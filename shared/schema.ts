import { z } from "zod";

export const analysisJobSchema = z.object({
  id: z.string(),
  status: z.enum(["pending", "processing", "completed", "failed"]),
  createdAt: z.string(),
  updatedAt: z.string(),
  repoUrl: z.string().optional(),
  analysisMode: z.enum(["quick", "standard", "deep"]),
  results: z.any().optional(),
});

export type AnalysisJob = z.infer<typeof analysisJobSchema>;

export const insertAnalysisJobSchema = z.object({
  repoUrl: z.string().optional(),
  analysisMode: z.enum(["quick", "standard", "deep"]),
});

export type InsertAnalysisJob = z.infer<typeof insertAnalysisJobSchema>;

export const analysisResultSchema = z.object({
  request_id: z.string(),
  status: z.string(),
  summary: z.object({
    languages: z.array(z.string()),
    total_files_analyzed: z.number(),
    issues_count: z.object({
      critical: z.number(),
      major: z.number(),
      minor: z.number(),
    }),
  }).optional(),
  issues: z.array(z.object({
    severity: z.enum(["critical", "major", "minor"]),
    file: z.string(),
    line: z.number(),
    message: z.string(),
    rule: z.string().optional(),
  })).optional(),
  patches: z.array(z.any()).optional(),
  refactoredFiles: z.array(z.object({
    file: z.string(),
    original: z.string(),
    refactored: z.string(),
  })).optional(),
});

export type AnalysisResult = z.infer<typeof analysisResultSchema>;

export const callbackPayloadSchema = z.object({
  callback_secret: z.string(),
  request_id: z.string(),
  status: z.string(),
  results: z.any(),
});

export type CallbackPayload = z.infer<typeof callbackPayloadSchema>;
