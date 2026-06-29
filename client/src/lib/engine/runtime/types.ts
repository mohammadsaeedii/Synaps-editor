/* =========================================================================
   synapse · engine · runtime types
   ========================================================================= */
import type { RuntimeState } from "../event-bus/types";

export type { RuntimeState };

export interface RuntimeCommand {
  command: string;
  args?: string[];
  cwd?: string;
  env?: Record<string, string>;
}

export interface RuntimeOutput {
  stream: "stdout" | "stderr";
  text: string;
  timestamp: number;
}

export interface RuntimeInfo {
  id: string;
  name: string;
  languageIds: string[];
}

export interface Runtime {
  readonly info: RuntimeInfo;
  start(projectId: string, options?: { command?: string; env?: Record<string, string> }): Promise<void>;
  stop(projectId: string): Promise<void>;
  restart(projectId: string): Promise<void>;
  install(projectId: string, packages: string[]): Promise<void>;
  execute(projectId: string, cmd: RuntimeCommand): Promise<{ exitCode: number; stdout: string; stderr: string }>;
  getState(projectId: string): RuntimeState;
  getOutput(projectId: string, limit?: number): RuntimeOutput[];
}

export interface RuntimeManagerState {
  activeRuntimeId: string;
  states: Map<string, RuntimeState>;
  outputs: Map<string, RuntimeOutput[]>;
}
