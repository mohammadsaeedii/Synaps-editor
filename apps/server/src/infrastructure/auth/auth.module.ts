import { Global, Module } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { SessionGuard } from "./session.guard";
import { EncryptionService } from "./encryption.service";

@Global()
@Module({
  providers: [AuthService, SessionGuard, EncryptionService],
  exports: [AuthService, SessionGuard, EncryptionService],
})
export class AuthModule {}
