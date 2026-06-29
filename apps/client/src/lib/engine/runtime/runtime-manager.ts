/* =========================================================================
   synapse · engine · runtime manager
   Isolated process lifecycle — UI communicates only through this facade.
   ========================================================================= */
import { store } from "@/lib/store/store";
import { eventBus } from "../event-bus/event-bus";
import { simulatedNodeRuntime } from "./providers/node-runtime";
import type { Runtime, RuntimeCommand, RuntimeInfo, RuntimeOutput } from "./types";
import type { RuntimeState } from "../event-bus/types";

export class RuntimeManager {
  private runtimes = new Map<string, Runtime>();
  private activeRuntimeId = "node";
  private installed = false;

  constructor() {
    this.register(simulatedNodeRuntime);
  }

  setup(): void {
    if (this.installed) return;
    this.installed = true;
  }

  register(runtime: Runtime): void {
    this.runtimes.set(runtime.info.id, runtime);
  }

  listRuntimes(): RuntimeInfo[] {
    return [...this.runtimes.values()].map((r) => r.info);
  }

  setActiveRuntime(id: string): void {
    if (this.runtimes.has(id)) this.activeRuntimeId = id;
  }

  getActiveRuntime(): Runtime | null {
    return this.runtimes.get(this.activeRuntimeId) ?? null;
  }

  private projectId(): string | null {
    return store.activeProject()?.id ?? null;
  }

  private runtime(): Runtime {
    return this.getActiveRuntime() ?? simulatedNodeRuntime;
  }

  getState(projectId?: string): RuntimeState {
    const pid = projectId ?? this.projectId();
    if (!pid) return "idle";
    return this.runtime().getState(pid);
  }

  getOutput(projectId?: string, limit?: number): RuntimeOutput[] {
    const pid = projectId ?? this.projectId();
    if (!pid) return [];
    return this.runtime().getOutput(pid, limit);
  }

  async start(projectId?: string, options?: { command?: string; env?: Record<string, string> }): Promise<void> {
    const pid = projectId ?? this.projectId();
    if (!pid) return;
    await this.runtime().start(pid, options);
  }

  async stop(projectId?: string): Promise<void> {
    const pid = projectId ?? this.projectId();
    if (!pid) return;
    await this.runtime().stop(pid);
  }

  async restart(projectId?: string): Promise<void> {
    const pid = projectId ?? this.projectId();
    if (!pid) return;
    await this.runtime().restart(pid);
  }

  async installPackages(packages: string[], projectId?: string): Promise<void> {
    const pid = projectId ?? this.projectId();
    if (!pid) return;
    await this.runtime().install(pid, packages);
  }

  async execute(cmd: RuntimeCommand, projectId?: string) {
    const pid = projectId ?? this.projectId();
    if (!pid) throw new Error("No active project");
    return this.runtime().execute(pid, cmd);
  }

  subscribeState(handler: (state: RuntimeState, projectId: string) => void) {
    return eventBus.on("RuntimeStateChanged", ({ state, projectId }) => handler(state, projectId));
  }

  subscribeOutput(handler: (output: RuntimeOutput) => void) {
    return eventBus.on("RuntimeOutput", ({ projectId, stream, text }) => {
      handler({ stream, text, timestamp: Date.now() });
    });
  }
}

export const runtimeManager = new RuntimeManager();
