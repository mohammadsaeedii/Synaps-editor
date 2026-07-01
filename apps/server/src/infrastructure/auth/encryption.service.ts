import { Injectable } from "@nestjs/common";
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";
import { env } from "../../config/env";

/** AES-256-GCM encryption for user API keys at rest. */
@Injectable()
export class EncryptionService {
  private readonly key = scryptSync(env.ENCRYPTION_KEY, "synapse-salt", 32);

  encrypt(plaintext: string): { ciphertext: Buffer; iv: Buffer } {
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", this.key, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();
    return { ciphertext: Buffer.concat([encrypted, tag]), iv };
  }

  decrypt(ciphertext: Buffer, iv: Buffer): string {
    const tag = ciphertext.subarray(ciphertext.length - 16);
    const data = ciphertext.subarray(0, ciphertext.length - 16);
    const decipher = createDecipheriv("aes-256-gcm", this.key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
  }
}
