/* =========================================================================
   synapse · engine · simulated Node runtime
   Browser-safe runtime that operates on the virtual file system.
   Structured for future WebContainers / backend runtime swap.
   ========================================================================= */
import { store } from "@/lib/store/store";
import { eventBus } from "../../event-bus/event-bus";
import { listProjectFiles } from "../../file-watcher/path-utils";
import type { Runtime, RuntimeCommand, RuntimeInfo, RuntimeOutput } from "../types";
import type { RuntimeState } from "../../event-bus/types";

export class SimulatedNodeRuntime implements Runtime {
  readonly info: RuntimeInfo = {
    id: "node",
    name: "Node.js (simulated)",
    languageIds: ["javascript", "typescript", "json"],
  };

  private states = new Map<string, RuntimeState>();
  private outputs = new Map<string, RuntimeOutput[]>();
  private processes = new Map<string, ReturnType<typeof setInterval>>();

  private setState(projectId: string, state: RuntimeState, message?: string): void {
    this.states.set(projectId, state);
    eventBus.emit("RuntimeStateChanged", {
      projectId,
      state,
      runtimeId: this.info.id,
      message,
    });
  }

  private append(projectId: string, stream: "stdout" | "stderr", text: string): void {
    const list = this.outputs.get(projectId) ?? [];
    list.push({ stream, text, timestamp: Date.now() });
    if (list.length > 500) list.splice(0, list.length - 500);
    this.outputs.set(projectId, list);
    eventBus.emit("RuntimeOutput", { projectId, runtimeId: this.info.id, stream, text });
  }

  getState(projectId: string): RuntimeState {
    return this.states.get(projectId) ?? "idle";
  }

  getOutput(projectId: string, limit = 100): RuntimeOutput[] {
    const list = this.outputs.get(projectId) ?? [];
    return list.slice(-limit);
  }

  async start(projectId: string, options: { command?: string; env?: Record<string, string> } = {}): Promise<void> {
    if (this.getState(projectId) === "running") return;
    this.setState(projectId, "starting");
    this.append(projectId, "stdout", `[${this.info.name}] Starting project…\n`);

    await delay(400);

    const cmd = options.command ?? detectStartCommand(projectId);
    this.append(projectId, "stdout", `$ ${cmd}\n`);

    const proc = setInterval(() => {
      /* heartbeat for running state */
    }, 30_000);
    this.processes.set(projectId, proc);

    this.setState(projectId, "running", `Running: ${cmd}`);
    this.append(projectId, "stdout", `Process started (simulated). Use the terminal to interact.\n`);
  }

  async stop(projectId: string): Promise<void> {
    if (this.getState(projectId) === "idle" || this.getState(projectId) === "stopped") return;
    this.setState(projectId, "stopping");
    const proc = this.processes.get(projectId);
    if (proc) clearInterval(proc);
    this.processes.delete(projectId);
    await delay(200);
    this.append(projectId, "stdout", `[${this.info.name}] Process stopped.\n`);
    this.setState(projectId, "stopped");
    setTimeout(() => this.setState(projectId, "idle"), 500);
  }

  async restart(projectId: string): Promise<void> {
    this.setState(projectId, "restarting");
    await this.stop(projectId);
    await delay(300);
    await this.start(projectId);
  }

  async install(projectId: string, packages: string[]): Promise<void> {
    this.append(projectId, "stdout", `$ npm install ${packages.join(" ")}\n`);
    await delay(600 + packages.length * 100);
    this.append(projectId, "stdout", `added ${packages.length} packages (simulated)\n`);
  }

  async execute(projectId: string, cmd: RuntimeCommand): Promise<{ exitCode: number; stdout: string; stderr: string }> {
    const line = [cmd.command, ...(cmd.args ?? [])].join(" ");
    this.append(projectId, "stdout", `$ ${line}\n`);

    const files = listProjectFiles(projectId);
    let stdout = "";
    let stderr = "";
    let exitCode = 0;

    if (cmd.command === "ls" || cmd.command === "dir") {
      stdout = files.map((f) => f.name).join("\n") + "\n";
    } else if (cmd.command === "pwd") {
      stdout = "/\n";
    } else if (cmd.command === "node" && cmd.args?.[0]) {
      const script = files.find((f) => f.name === cmd.args![0] || f.name.endsWith(cmd.args![0]));
      if (script) {
        stdout = `[simulated] Executing ${script.name}…\n`;
        if (script.content.includes("console.log")) {
          const matches = script.content.match(/console\.log\(([^)]+)\)/g);
          matches?.forEach((m) => { stdout += m.replace("console.log(", "").replace(/\)$/, "") + "\n"; });
        }
      } else {
        stderr = `Cannot find module '${cmd.args[0]}'\n`;
        exitCode = 1;
      }
    } else if (cmd.command === "npm" && cmd.args?.[0] === "run") {
      stdout = `> synapse-sim\n> ${cmd.args[1] ?? "start"}\n\n[simulated] Script ran successfully.\n`;
    } else {
      stdout = `[simulated] ${line}\n`;
    }

    if (stdout) this.append(projectId, "stdout", stdout);
    if (stderr) this.append(projectId, "stderr", stderr);
    return { exitCode, stdout, stderr };
  }
}

function detectStartCommand(projectId: string): string {
  const files = listProjectFiles(projectId);
  if (files.some((f) => f.name === "package.json")) {
    try {
      const pkg = JSON.parse(files.find((f) => f.name === "package.json")!.content) as { scripts?: Record<string, string> };
      if (pkg.scripts?.dev) return "npm run dev";
      if (pkg.scripts?.start) return "npm run start";
    } catch { /* ignore */ }
  }
  if (files.some((f) => f.name === "index.ts")) return "npx tsx index.ts";
  if (files.some((f) => f.name === "index.js")) return "node index.js";
  if (files.some((f) => f.name === "main.py")) return "python main.py";
  if (files.some((f) => f.name === "main.go")) return "go run main.go";
  return "npm run dev";
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export const simulatedNodeRuntime = new SimulatedNodeRuntime();
