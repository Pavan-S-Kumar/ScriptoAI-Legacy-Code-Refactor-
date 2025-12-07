import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { analyzeCode, generateReport, generateJSON } from "./analyzer";
import multer from "multer";
import FormData from "form-data";
import { z } from "zod";
import { insertAnalysisJobSchema, callbackPayloadSchema } from "@shared/schema";
import archiver from "archiver";

const upload = multer({ storage: multer.memoryStorage() });

const N8N_WEBHOOK = process.env.N8N_WEBHOOK || "";
const CALLBACK_SECRET = process.env.CALLBACK_SECRET || "demo-secret";
const EXTERNAL_BASE = process.env.EXTERNAL_BASE || "";

const analyzeRequestSchema = z.object({
  analysis_mode: z.enum(["quick", "standard", "deep"]).default("standard"),
  repo_url: z.string().url().optional().or(z.literal("")),
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.post("/api/analyze", upload.single("code_zip"), async (req, res) => {
    try {
      const parsed = analyzeRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ 
          message: "Invalid request", 
          errors: parsed.error.flatten().fieldErrors 
        });
      }
      
      const analysisMode = parsed.data.analysis_mode;
      const repoUrl = parsed.data.repo_url && parsed.data.repo_url.length > 0 ? parsed.data.repo_url : undefined;
      const file = req.file;

      if (!file && !repoUrl) {
        return res.status(400).json({ message: "Either code_zip file or repo_url is required" });
      }

      const job = await storage.createJob({
        analysisMode,
        repoUrl,
      });

      await storage.updateJobStatus(job.id, "processing");

      if (N8N_WEBHOOK) {
        try {
          const formData = new FormData();
          formData.append("request_id", job.id);
          formData.append("analysis_mode", analysisMode);
          formData.append("repo_url", repoUrl || "");
          formData.append("callback_url", `${EXTERNAL_BASE}/api/callback`);
          formData.append("callback_secret", CALLBACK_SECRET);

          if (file) {
            formData.append("code_zip", file.buffer, {
              filename: file.originalname,
              contentType: file.mimetype,
            });
          }

          const response = await fetch(N8N_WEBHOOK, {
            method: "POST",
            body: formData as any,
            headers: formData.getHeaders(),
          });

          if (!response.ok) {
            console.error("n8n webhook failed:", await response.text());
          }
        } catch (webhookError) {
          console.error("Error calling n8n webhook:", webhookError);
        }
      } else {
        (async () => {
          try {
            const analysisResult = await analyzeCode(
              job.id,
              file?.buffer,
              repoUrl,
              analysisMode
            );
            await storage.updateJobStatus(job.id, "completed", analysisResult);
          } catch (error) {
            console.error("Analysis failed:", error);
            await storage.updateJobStatus(job.id, "failed", {
              request_id: job.id,
              status: "failed",
              summary: { languages: [], total_files_analyzed: 0, issues_count: { critical: 0, major: 0, minor: 0 } },
              issues: [],
              patches: [],
              refactoredFiles: []
            });
          }
        })();
      }

      res.json({ request_id: job.id });
    } catch (error) {
      console.error("Error in /api/analyze:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/callback", async (req, res) => {
    try {
      const parsed = callbackPayloadSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ 
          message: "Invalid callback payload", 
          errors: parsed.error.flatten().fieldErrors 
        });
      }

      const { callback_secret, request_id, status, results } = parsed.data;

      if (callback_secret !== CALLBACK_SECRET) {
        return res.status(401).json({ message: "Invalid callback secret" });
      }

      const job = await storage.getJob(request_id);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }

      const newStatus = status === "completed" ? "completed" : status === "failed" ? "failed" : job.status;
      await storage.updateJobStatus(request_id, newStatus as "completed" | "failed" | "pending" | "processing", results);

      res.json({ success: true });
    } catch (error) {
      console.error("Error in /api/callback:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/status/:requestId", async (req, res) => {
    try {
      const { requestId } = req.params;
      const job = await storage.getJob(requestId);

      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }

      res.json(job);
    } catch (error) {
      console.error("Error in /api/status:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/download/:requestId/markdown", async (req, res) => {
    try {
      const { requestId } = req.params;
      const job = await storage.getJob(requestId);

      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }

      if (job.status !== "completed" || !job.results) {
        return res.status(400).json({ message: "Analysis not completed yet" });
      }

      const report = generateReport(job.results);
      res.setHeader("Content-Type", "text/markdown");
      res.setHeader("Content-Disposition", `attachment; filename="analysis-${requestId}.md"`);
      res.send(report);
    } catch (error) {
      console.error("Error in /api/download/markdown:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/download/:requestId/json", async (req, res) => {
    try {
      const { requestId } = req.params;
      const job = await storage.getJob(requestId);

      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }

      if (job.status !== "completed" || !job.results) {
        return res.status(400).json({ message: "Analysis not completed yet" });
      }

      const jsonExport = generateJSON(job.results);
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", `attachment; filename="analysis-${requestId}.json"`);
      res.send(jsonExport);
    } catch (error) {
      console.error("Error in /api/download/json:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/download/:requestId/refactored", async (req, res) => {
    try {
      const { requestId } = req.params;
      const job = await storage.getJob(requestId);

      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }

      if (job.status !== "completed" || !job.results) {
        return res.status(400).json({ message: "Analysis not completed yet" });
      }

      const refactoredFiles = job.results.refactoredFiles || [];
      
      if (refactoredFiles.length === 0) {
        return res.status(400).json({ message: "No refactored files available" });
      }

      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", `attachment; filename="refactored-code-${requestId}.zip"`);

      const archive = archiver("zip", { zlib: { level: 9 } });
      
      archive.on("error", (err) => {
        console.error("Archive error:", err);
        res.status(500).json({ message: "Error creating zip file" });
      });

      archive.pipe(res);

      for (const file of refactoredFiles) {
        archive.append(file.refactored, { name: file.file });
      }

      await archive.finalize();
    } catch (error) {
      console.error("Error in /api/download/refactored:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  return httpServer;
}
