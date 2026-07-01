import { Injectable } from "@nestjs/common";
import type { ExecutionInput, ExecutionPort, ExecutionResult } from "../ports/execution.port";

/** Stub adapter — swap for Piston / E2B / Firecracker later. */
@Injectable()
export class NoopExecutionAdapter implements ExecutionPort {
  async runCode(_input: ExecutionInput): Promise<ExecutionResult> {
    return {
      stdout: "",
      stderr: "Code execution is not enabled in this environment.",
      exitCode: 1,
      durationMs: 0,
    };
  }
}
