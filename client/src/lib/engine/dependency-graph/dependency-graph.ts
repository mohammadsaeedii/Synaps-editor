/* =========================================================================
   synapse · engine · dependency graph
   Tracks imports/exports, circular refs, unused files and exports.
   ========================================================================= */
import { store } from "@/lib/store/store";
import { astManager } from "../ast/ast-manager";
import { eventBus } from "../event-bus/event-bus";
import { listProjectFiles } from "../file-watcher/path-utils";
import type { DependencyGraphSnapshot, GraphEdge, GraphNode } from "./types";

function resolveImport(source: string, fromPath: string, projectId: string): string | undefined {
  const files = listProjectFiles(projectId);
  const candidates = [
    source,
    source + ".ts",
    source + ".tsx",
    source + ".js",
    source + ".jsx",
    source + "/index.ts",
    source + "/index.tsx",
    source + "/index.js",
  ];

  const fromDir = fromPath.split("/").slice(0, -1).join("/") || "/";

  for (const c of candidates) {
    let resolved = c;
    if (c.startsWith(".")) {
      const parts = (fromDir + "/" + c).split("/").filter(Boolean);
      const norm: string[] = [];
      for (const p of parts) {
        if (p === "..") norm.pop();
        else if (p !== ".") norm.push(p);
      }
      resolved = "/" + norm.join("/");
    } else if (!c.startsWith("/")) {
      resolved = "/" + c;
    }

    const match = files.find((f) => {
      const path = astManager.getFileAST(f.id)?.path;
      return path === resolved || path?.endsWith(resolved);
    });
    if (match) return match.id;
  }
  return undefined;
}

export class DependencyGraph {
  private graphs = new Map<string, DependencyGraphSnapshot>();
  private installed = false;

  install(): void {
    if (this.installed) return;
    this.installed = true;

    eventBus.on("ASTUpdated", ({ projectId }) => this.rebuild(projectId));
    eventBus.on("FileDeleted", ({ projectId }) => this.rebuild(projectId));
    eventBus.on("FileCreated", ({ projectId }) => this.rebuild(projectId));
  }

  getGraph(projectId: string): DependencyGraphSnapshot | null {
    return this.graphs.get(projectId) ?? null;
  }

  findDependencies(fileId: string): string[] {
    const ast = astManager.getFileAST(fileId);
    if (!ast) return [];
    const graph = this.graphs.get(ast.projectId);
    if (!graph) return [];
    return graph.edges.filter((e) => e.from === fileId).map((e) => e.to);
  }

  findDependents(fileId: string): string[] {
    const ast = astManager.getFileAST(fileId);
    if (!ast) return [];
    const graph = this.graphs.get(ast.projectId);
    if (!graph) return [];
    return graph.edges.filter((e) => e.to === fileId).map((e) => e.from);
  }

  findCircular(projectId: string): string[][] {
    return this.graphs.get(projectId)?.circular ?? [];
  }

  findUnusedFiles(projectId: string): string[] {
    return this.graphs.get(projectId)?.unusedFiles ?? [];
  }

  findUnusedExports(projectId: string): { fileId: string; name: string }[] {
    return this.graphs.get(projectId)?.unusedExports ?? [];
  }

  rebuild(projectId: string): DependencyGraphSnapshot {
    const files = listProjectFiles(projectId);
    const nodes: GraphNode[] = files.map((f) => ({
      fileId: f.id,
      path: astManager.getFileAST(f.id)?.path ?? `/${f.name}`,
      projectId,
      language: f.language,
    }));

    const edges: GraphEdge[] = [];
    for (const f of files) {
      const ast = astManager.getFileAST(f.id);
      if (!ast) continue;
      for (const imp of ast.imports) {
        const resolved = resolveImport(imp.source, ast.path, projectId);
        edges.push({
          from: f.id,
          to: resolved ?? imp.source,
          specifiers: imp.specifiers,
          resolvedFileId: resolved,
        });
      }
    }

    const circular = this.detectCycles(edges, nodes.map((n) => n.fileId));
    const referenced = new Set<string>();
    edges.forEach((e) => { if (e.resolvedFileId) referenced.add(e.resolvedFileId); });

    const entryCandidates = files.filter((f) =>
      /\.(tsx?|jsx?)$/.test(f.name) && (f.name.includes("index") || f.name.includes("main") || f.name.includes("app")),
    );
    entryCandidates.forEach((f) => referenced.add(f.id));

    const unusedFiles = nodes
      .filter((n) => !referenced.has(n.fileId) && files.length > 1)
      .map((n) => n.fileId);

    const unusedExports = this.computeUnusedExports(projectId, edges);

    const snapshot: DependencyGraphSnapshot = {
      projectId,
      nodes,
      edges,
      circular,
      unusedFiles,
      unusedExports,
      updatedAt: Date.now(),
    };

    this.graphs.set(projectId, snapshot);
    eventBus.emit("ProjectIndexUpdated", { projectId });
    return snapshot;
  }

  private detectCycles(edges: GraphEdge[], nodeIds: string[]): string[][] {
    const adj = new Map<string, string[]>();
    nodeIds.forEach((id) => adj.set(id, []));
    edges.forEach((e) => {
      if (e.resolvedFileId) adj.get(e.from)?.push(e.resolvedFileId);
    });

    const cycles: string[][] = [];
    const visited = new Set<string>();
    const stack = new Set<string>();
    const path: string[] = [];

    const dfs = (node: string) => {
      if (stack.has(node)) {
        const idx = path.indexOf(node);
        if (idx >= 0) cycles.push([...path.slice(idx), node]);
        return;
      }
      if (visited.has(node)) return;
      visited.add(node);
      stack.add(node);
      path.push(node);
      for (const next of adj.get(node) ?? []) dfs(next);
      path.pop();
      stack.delete(node);
    };

    nodeIds.forEach(dfs);
    return cycles;
  }

  private computeUnusedExports(projectId: string, edges: GraphEdge[]): { fileId: string; name: string }[] {
    const imported = new Set<string>();
    edges.forEach((e) => e.specifiers.forEach((s) => imported.add(s)));

    const unused: { fileId: string; name: string }[] = [];
    for (const f of listProjectFiles(projectId)) {
      const ast = astManager.getFileAST(f.id);
      if (!ast) continue;
      for (const exp of ast.exports) {
        if (exp.name !== "default" && !imported.has(exp.name)) {
          unused.push({ fileId: f.id, name: exp.name });
        }
      }
    }
    return unused;
  }
}

export const dependencyGraph = new DependencyGraph();
