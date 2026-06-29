/* =========================================================================
   synapse · engine · project index
   Aggregates files, symbols, and dependency graph for AI and search.
   ========================================================================= */
import { store } from "@/lib/store/store";
import { astManager } from "../ast/ast-manager";
import { dependencyGraph } from "../dependency-graph/dependency-graph";
import { eventBus } from "../event-bus/event-bus";
import { listProjectFiles, resolveFilePath } from "../file-watcher/path-utils";
import { symbolIndex } from "../symbols/symbol-index";
import type { DependencyGraphSnapshot } from "../dependency-graph/types";
import type { IndexedSymbol } from "../symbols/symbol-index";

export interface ProjectIndexSnapshot {
  projectId: string;
  files: { fileId: string; path: string; language: string; symbolCount: number }[];
  symbolCount: number;
  graph: DependencyGraphSnapshot | null;
  updatedAt: number;
}

export class ProjectIndex {
  private snapshots = new Map<string, ProjectIndexSnapshot>();
  private installed = false;

  install(): void {
    if (this.installed) return;
    this.installed = true;
    eventBus.on("ProjectIndexUpdated", ({ projectId }) => this.rebuild(projectId));
  }

  getSnapshot(projectId: string): ProjectIndexSnapshot | null {
    return this.snapshots.get(projectId) ?? null;
  }

  rebuild(projectId: string): ProjectIndexSnapshot {
    const files = listProjectFiles(projectId).map((f) => {
      const ast = astManager.getFileAST(f.id);
      return {
        fileId: f.id,
        path: ast?.path ?? resolveFilePath(f),
        language: f.language,
        symbolCount: ast?.symbols.length ?? 0,
      };
    });

    const symbols = symbolIndex.getSymbols(undefined, projectId);
    const graph = dependencyGraph.getGraph(projectId) ?? dependencyGraph.rebuild(projectId);

    const snapshot: ProjectIndexSnapshot = {
      projectId,
      files,
      symbolCount: symbols.length,
      graph,
      updatedAt: Date.now(),
    };

    this.snapshots.set(projectId, snapshot);
    return snapshot;
  }

  getActiveProjectSnapshot(): ProjectIndexSnapshot | null {
    const p = store.activeProject();
    return p ? this.getSnapshot(p.id) ?? this.rebuild(p.id) : null;
  }

  searchSymbols(query: string, projectId?: string): IndexedSymbol[] {
    const pid = projectId ?? store.activeProject()?.id;
    return pid ? symbolIndex.findWorkspaceSymbols(query, pid) : [];
  }
}

export const projectIndex = new ProjectIndex();
