import { Inject, Injectable } from "@nestjs/common";
import type { Queue } from "bullmq";
import { QUEUE_TOKENS, type ActivityLogJob, type AgentRunJob, type EmbeddingJob, type MemoryIndexJob } from "./queue.constants";

@Injectable()
export class QueueService {
  constructor(
    @Inject(QUEUE_TOKENS.AGENT_RUNS) private readonly agentRuns: Queue<AgentRunJob>,
    @Inject(QUEUE_TOKENS.MEMORY_INDEX) private readonly memoryIndex: Queue<MemoryIndexJob>,
    @Inject(QUEUE_TOKENS.EMBEDDINGS) private readonly embeddings: Queue<EmbeddingJob>,
    @Inject(QUEUE_TOKENS.ACTIVITY_LOG) private readonly activityLog: Queue<ActivityLogJob>,
  ) {}

  enqueueAgentRun(job: AgentRunJob) {
    return this.agentRuns.add("run", job, {
      jobId: `agent-run:${job.runId}`,
      attempts: 3,
      backoff: { type: "exponential", delay: 2000 },
      removeOnComplete: 100,
      removeOnFail: 500,
    });
  }

  enqueueMemoryIndex(job: MemoryIndexJob) {
    return this.memoryIndex.add("index", job, {
      jobId: `memory-index:${job.memoryId}`,
      attempts: 3,
      backoff: { type: "exponential", delay: 1000 },
    });
  }

  enqueueEmbedding(job: EmbeddingJob) {
    return this.embeddings.add("embed", job, {
      jobId: `embed:${job.entityType}:${job.entityId}`,
      attempts: 3,
    });
  }

  enqueueActivity(job: ActivityLogJob) {
    return this.activityLog.add("log", job, {
      attempts: 5,
      backoff: { type: "fixed", delay: 500 },
    });
  }
}
