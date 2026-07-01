/** Future code execution seam — NOT implemented in MVP. */
export interface ExecutionInput {
  language: string;
  code: string;
  stdin?: string;
  timeoutMs?: number;
}

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  durationMs: number;
}

export interface ExecutionPort {
  runCode(input: ExecutionInput): Promise<ExecutionResult>;
}

export const EXECUTION_PORT = Symbol("EXECUTION_PORT");
