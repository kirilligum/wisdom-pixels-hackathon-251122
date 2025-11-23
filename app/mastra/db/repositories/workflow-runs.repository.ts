import { eq, and, desc } from 'drizzle-orm';
import type { Database } from '../client';
import { workflowRuns, type WorkflowRun, type NewWorkflowRun } from '../schema';
import { randomUUID } from 'crypto';

export class WorkflowRunsRepository {
  constructor(private db: Database) {}

  /**
   * Create a new workflow run
   */
  async create(data: Omit<NewWorkflowRun, 'runId' | 'startedAt'>): Promise<WorkflowRun> {
    const runId = randomUUID();

    const [run] = await this.db
      .insert(workflowRuns)
      .values({
        ...data,
        runId,
        status: data.status ?? 'running',
        startedAt: new Date(),
      })
      .returning();

    return run;
  }

  /**
   * Get workflow run by ID
   */
  async findById(runId: string): Promise<WorkflowRun | undefined> {
    const [run] = await this.db
      .select()
      .from(workflowRuns)
      .where(eq(workflowRuns.runId, runId))
      .limit(1);

    return run;
  }

  /**
   * Get all workflow runs
   */
  async findAll(): Promise<WorkflowRun[]> {
    return await this.db
      .select()
      .from(workflowRuns)
      .orderBy(desc(workflowRuns.startedAt));
  }

  /**
   * Get workflow runs by workflow name
   */
  async findByWorkflowName(workflowName: string): Promise<WorkflowRun[]> {
    return await this.db
      .select()
      .from(workflowRuns)
      .where(eq(workflowRuns.workflowName, workflowName))
      .orderBy(desc(workflowRuns.startedAt));
  }

  /**
   * Get workflow runs for a brand
   */
  async findByBrandId(brandId: string): Promise<WorkflowRun[]> {
    return await this.db
      .select()
      .from(workflowRuns)
      .where(eq(workflowRuns.brandId, brandId))
      .orderBy(desc(workflowRuns.startedAt));
  }

  /**
   * Get workflow runs by status
   */
  async findByStatus(status: string): Promise<WorkflowRun[]> {
    return await this.db
      .select()
      .from(workflowRuns)
      .where(eq(workflowRuns.status, status))
      .orderBy(desc(workflowRuns.startedAt));
  }

  /**
   * Complete a workflow run successfully
   */
  async complete(runId: string, output?: Record<string, any>): Promise<WorkflowRun | undefined> {
    const run = await this.findById(runId);
    if (!run) return undefined;

    const completedAt = new Date();
    const durationMs = completedAt.getTime() - new Date(run.startedAt).getTime();

    const [updated] = await this.db
      .update(workflowRuns)
      .set({
        status: 'completed',
        completedAt,
        durationMs,
        output,
      })
      .where(eq(workflowRuns.runId, runId))
      .returning();

    return updated;
  }

  /**
   * Mark a workflow run as failed
   */
  async fail(runId: string, error: string): Promise<WorkflowRun | undefined> {
    const run = await this.findById(runId);
    if (!run) return undefined;

    const completedAt = new Date();
    const durationMs = completedAt.getTime() - new Date(run.startedAt).getTime();

    const [updated] = await this.db
      .update(workflowRuns)
      .set({
        status: 'failed',
        completedAt,
        durationMs,
        error,
      })
      .where(eq(workflowRuns.runId, runId))
      .returning();

    return updated;
  }

  /**
   * Update workflow run
   */
  async update(runId: string, data: Partial<Omit<WorkflowRun, 'runId' | 'startedAt'>>): Promise<WorkflowRun | undefined> {
    const [updated] = await this.db
      .update(workflowRuns)
      .set(data)
      .where(eq(workflowRuns.runId, runId))
      .returning();

    return updated;
  }

  /**
   * Delete workflow run
   */
  async delete(runId: string): Promise<void> {
    await this.db.delete(workflowRuns).where(eq(workflowRuns.runId, runId));
  }
}
