import { randomUUID } from "crypto";
import type { AnalysisJob, InsertAnalysisJob } from "@shared/schema";

export interface IStorage {
  createJob(data: InsertAnalysisJob): Promise<AnalysisJob>;
  getJob(id: string): Promise<AnalysisJob | undefined>;
  updateJobStatus(id: string, status: AnalysisJob["status"], results?: any): Promise<AnalysisJob | undefined>;
}

export class MemStorage implements IStorage {
  private jobs: Map<string, AnalysisJob>;

  constructor() {
    this.jobs = new Map();
  }

  async createJob(data: InsertAnalysisJob): Promise<AnalysisJob> {
    const id = `req-${randomUUID().slice(0, 8)}`;
    const now = new Date().toISOString();
    const job: AnalysisJob = {
      id,
      status: "pending",
      createdAt: now,
      updatedAt: now,
      repoUrl: data.repoUrl,
      analysisMode: data.analysisMode,
      results: undefined,
    };
    this.jobs.set(id, job);
    return job;
  }

  async getJob(id: string): Promise<AnalysisJob | undefined> {
    return this.jobs.get(id);
  }

  async updateJobStatus(
    id: string,
    status: AnalysisJob["status"],
    results?: any
  ): Promise<AnalysisJob | undefined> {
    const job = this.jobs.get(id);
    if (!job) return undefined;

    const updatedJob: AnalysisJob = {
      ...job,
      status,
      updatedAt: new Date().toISOString(),
      results: results !== undefined ? results : job.results,
    };
    this.jobs.set(id, updatedJob);
    return updatedJob;
  }
}

export const storage = new MemStorage();
