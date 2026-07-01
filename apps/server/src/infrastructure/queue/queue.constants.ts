export const QUEUE_NAMES = {
  AGENT_RUNS: "agent-runs",
  MEMORY_INDEX: "memory-index",
  EMBEDDINGS: "embeddings",
  ACTIVITY_LOG: "activity-log",
} as const;

export const QUEUE_TOKENS = {
  AGENT_RUNS: Symbol("QUEUE_AGENT_RUNS"),
  MEMORY_INDEX: Symbol("QUEUE_MEMORY_INDEX"),
  EMBEDDINGS: Symbol("QUEUE_EMBEDDINGS"),
  ACTIVITY_LOG: Symbol("QUEUE_ACTIVITY_LOG"),
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

export interface AgentRunJob {
  runId: string;
  agentId: string;
  userId: string;
  goal: string;
}

export interface MemoryIndexJob {
  memoryId: string;
  userId: string;
}

export interface EmbeddingJob {
  entityType: "file" | "note" | "memory";
  entityId: string;
  userId: string;
}

export interface ActivityLogJob {
  userId: string;
  action: string;
  kind: string;
  refId: string;
  projectId: string | null;
  title: string;
}
