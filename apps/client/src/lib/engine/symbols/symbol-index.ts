/* =========================================================================
   synapse · engine · symbol index
   Cross-file symbol lookup built from AST cache.
   ========================================================================= */
import { eventBus } from "../event-bus/event-bus";
import { astManager } from "../ast/ast-manager";
import type { SymbolInfo, SymbolKind } from "../ast/types";

export interface IndexedSymbol extends SymbolInfo {
  path: string;
  projectId: string;
}

export class SymbolIndex {
  private index = new Map<string, IndexedSymbol[]>();
  private installed = false;

  install(): void {
    if (this.installed) return;
    this.installed = true;

    eventBus.on("ASTUpdated", ({ fileId }) => this.indexFile(fileId));
    eventBus.on("ASTInvalidated", ({ fileId, projectId }) => {
      this.index.delete(fileId);
      eventBus.emit("ProjectIndexUpdated", { projectId });
    });
  }

  rebuild(projectId?: string): void {
    const fileIds = projectId
      ? astManager.listCachedFileIds(projectId)
      : astManager.listCachedFileIds();
    for (const fileId of fileIds) this.indexFile(fileId);
    if (!projectId) this.index.clear();
  }

  private indexFile(fileId: string): void {
    const ast = astManager.getFileAST(fileId);
    if (!ast) {
      this.index.delete(fileId);
      return;
    }
    const symbols: IndexedSymbol[] = ast.symbols.map((s) => ({
      ...s,
      path: ast.path,
      projectId: ast.projectId,
    }));
    this.index.set(fileId, symbols);
    eventBus.emit("ProjectIndexUpdated", { projectId: ast.projectId });
  }

  getSymbols(fileId?: string, projectId?: string): IndexedSymbol[] {
    if (fileId) return this.index.get(fileId) ?? [];
    const out: IndexedSymbol[] = [];
    for (const syms of this.index.values()) {
      for (const s of syms) {
        if (!projectId || s.projectId === projectId) out.push(s);
      }
    }
    return out;
  }

  findByName(name: string, projectId?: string, kind?: SymbolKind): IndexedSymbol[] {
    return this.getSymbols(undefined, projectId).filter((s) => s.name === name && (!kind || s.kind === kind));
  }

  findWorkspaceSymbols(query: string, projectId?: string): IndexedSymbol[] {
    const q = query.toLowerCase();
    return this.getSymbols(undefined, projectId).filter((s) => s.name.toLowerCase().includes(q));
  }
}

export const symbolIndex = new SymbolIndex();
