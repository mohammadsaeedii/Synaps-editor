import { Global, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { LoggerModule } from "nestjs-pino";
import { DatabaseModule } from "./infrastructure/database/database.module";
import { RedisModule } from "./infrastructure/redis/redis.module";
import { QueueModule } from "./infrastructure/queue/queue.module";
import { AuthModule } from "./infrastructure/auth/auth.module";
import { AiModule } from "./infrastructure/ai/ai.module";
import { TrpcModule } from "./trpc/trpc.module";
import { HttpModule } from "./http/http.module";
import { IdentityModule } from "./modules/identity/identity.module";
import { ProjectsModule } from "./modules/projects/projects.module";
import { FilesModule } from "./modules/files/files.module";
import { ChatModule } from "./modules/chat/chat.module";
import { TasksModule } from "./modules/tasks/tasks.module";
import { AgentsModule } from "./modules/agents/agents.module";
import { MemoryModule } from "./modules/memory/memory.module";
import { SearchModule } from "./modules/search/search.module";
import { WorkspaceModule } from "./modules/workspace/workspace.module";
import { HealthController } from "./http/health.controller";

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule.forRoot({
      pinoHttp: {
        transport: process.env.NODE_ENV !== "production" ? { target: "pino-pretty" } : undefined,
        autoLogging: true,
      },
    }),
    DatabaseModule,
    RedisModule,
    QueueModule,
    AuthModule,
    AiModule,
    IdentityModule,
    WorkspaceModule,
    ProjectsModule,
    FilesModule,
    ChatModule,
    TasksModule,
    AgentsModule,
    MemoryModule,
    SearchModule,
    TrpcModule,
    HttpModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
