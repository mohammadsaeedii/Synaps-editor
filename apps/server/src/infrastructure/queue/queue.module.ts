import { Global, Module } from "@nestjs/common";
import { Queue, Worker } from "bullmq";
import { env } from "../../config/env";
import { QUEUE_NAMES, QUEUE_TOKENS } from "./queue.constants";
import { QueueService } from "./queue.service";

const connection = { url: env.REDIS_URL };

@Global()
@Module({
  providers: [
    {
      provide: QUEUE_TOKENS.AGENT_RUNS,
      useFactory: () => new Queue(QUEUE_NAMES.AGENT_RUNS, { connection }),
    },
    {
      provide: QUEUE_TOKENS.MEMORY_INDEX,
      useFactory: () => new Queue(QUEUE_NAMES.MEMORY_INDEX, { connection }),
    },
    {
      provide: QUEUE_TOKENS.EMBEDDINGS,
      useFactory: () => new Queue(QUEUE_NAMES.EMBEDDINGS, { connection }),
    },
    {
      provide: QUEUE_TOKENS.ACTIVITY_LOG,
      useFactory: () => new Queue(QUEUE_NAMES.ACTIVITY_LOG, { connection }),
    },
    QueueService,
  ],
  exports: [QUEUE_TOKENS.AGENT_RUNS, QUEUE_TOKENS.MEMORY_INDEX, QUEUE_TOKENS.EMBEDDINGS, QUEUE_TOKENS.ACTIVITY_LOG, QueueService],
})
export class QueueModule {}

export { Worker };
