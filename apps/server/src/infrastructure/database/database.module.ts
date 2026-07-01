import { Global, Module } from "@nestjs/common";
import { PrismaClient } from "@synapse/db";
import { PrismaService } from "./prisma.service";

@Global()
@Module({
  providers: [
    {
      provide: PrismaClient,
      useFactory: () => new PrismaClient(),
    },
    {
      provide: PrismaService,
      useFactory: (client: PrismaClient) => new PrismaService(client),
      inject: [PrismaClient],
    },
  ],
  exports: [PrismaService, PrismaClient],
})
export class DatabaseModule {}
