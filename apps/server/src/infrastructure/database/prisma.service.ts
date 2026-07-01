import { Injectable } from "@nestjs/common";
import type { PrismaClient } from "@synapse/db";

@Injectable()
export class PrismaService {
  constructor(private readonly client: PrismaClient) {}

  get db(): PrismaClient {
    return this.client;
  }
}
