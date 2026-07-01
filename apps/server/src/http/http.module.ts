import { Module } from "@nestjs/common";
import { AiStreamController } from "./ai-stream.controller";
import { AgentStreamController } from "./agent-stream.controller";

@Module({
  controllers: [AiStreamController, AgentStreamController],
})
export class HttpModule {}
