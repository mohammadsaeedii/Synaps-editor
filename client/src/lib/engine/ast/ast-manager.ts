/* =========================================================================
   synapse · engine · AST manager
   Parses, caches, and synchronizes ASTs on file changes (debounced).
   ========================================================================= */
import { store } from "@/lib/store/store";
import { eventBus } from "../event-bus/event-bus";
import { filePathInfo } from "../file-watcher/path-utils";
import { getParserForLanguage } from "./parsers";
import type { ASTQueryOptions, FileAST, ImportInfo, SymbolInfo } from "./types";

const DEBOUNCE_MS = 180;

export class ASTManager {
  private cache = new Map<string, FileAST>();
  private versions = new Map<string, number>();
  private timers = new Map<string, ReturnType<typeof setTimeout>>();
  private installed = false;

  install(): void {
    if (this.installed) return;
    this.installed = true;

    const schedule = (fileId: string) => {
      const prev = this.timers.get(fileId);
      if (prev) clearTimeout(prev);
      this.timers.set(
        fileId,
        setTimeout(() => this.parseFile(fileId), DEBOUNCE_MS),
      );
    };

    eventBus.on("FileCreated", (p) => schedule(p.fileId));
    eventBus.on("FileUpdated", (p) => schedule(p.fileId));
    eventBus.on("FileDeleted", (p) => this.invalidate(p.fileId));
    eventBus.on("FileRenamed", (p) => this.rekey(p.fileId));
    eventBus.on("FileMoved", (p) => this.rekey(p.fileId));
  }

  bootstrapProject(projectId: string): void {
    store.byProject("file", projectId)
      .filter((f) => !f.dir && (f.encoding ?? "text") === "text")
      .forEach((f) => this.parseFile(f.id));
  }

  getFileAST(fileId: string): FileAST | null {
    return this.cache.get(fileId) ?? null;
  }

  getSymbols(fileId: string): SymbolInfo[] {
    return this.cache.get(fileId)?.symbols ?? [];
  }

  findImports(fileId: string): ImportInfo[] {
    return this.cache.get(fileId)?.imports ?? [];
  }

  findUnusedSymbols(fileId: string): SymbolInfo[] {
    const ast = this.cache.get(fileId);
    if (!ast) return [];
    const content = store.get("file", fileId)?.content ?? "";
    return ast.symbols.filter((s) => {
      if (["import", "export"].includes(s.kind)) return false;
      const re = new RegExp(`\\b${s.name}\\b`, "g");
      const matches = content.match(re);
      return !matches || matches.length <= 1;
    });
  }

  findDependencies(fileId: string): string[] {
    return this.findImports(fileId).map((i) => i.source);
  }

  findReferences(symbolName: string, projectId?: string): { fileId: string; path: string; line: number }[] {
    const results: { fileId: string; path: string; line: number }[] = [];
    const re = new RegExp(`\\b${symbolName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "g");

    for (const ast of this.cache.values()) {
      if (projectId && ast.projectId !== projectId) continue;
      const file = store.get("file", ast.fileId);
      if (!file) continue;
      const lines = file.content.split("\n");
      lines.forEach((line, i) => {
        if (re.test(line)) {
          re.lastIndex = 0;
          results.push({ fileId: ast.fileId, path: ast.path, line: i + 1 });
        }
        re.lastIndex = 0;
      });
    }
    return results;
  }

  querySymbols(opts: ASTQueryOptions = {}): SymbolInfo[] {
    const out: SymbolInfo[] = [];
    for (const ast of this.cache.values()) {
      if (opts.projectId && ast.projectId !== opts.projectId) continue;
      for (const sym of ast.symbols) {
        if (opts.kind && sym.kind !== opts.kind) continue;
        if (opts.name && sym.name !== opts.name) continue;
        out.push(sym);
      }
    }
    return out;
  }

  listCachedFileIds(projectId?: string): string[] {
    return [...this.cache.entries()]
      .filter(([, ast]) => !projectId || ast.projectId === projectId)
      .map(([id]) => id);
  }

  parseFile(fileId: string): FileAST | null {
    const info = filePathInfo(fileId);
    const file = store.get("file", fileId);
    if (!info || !file || file.dir) return null;

    const parser = getParserForLanguage(file.language);
    const version = (this.versions.get(fileId) ?? 0) + 1;
    this.versions.set(fileId, version);

    const partial = parser.parse(file.content, {
      fileId,
      projectId: file.projectId,
      path: info.path,
      language: file.language,
    });

    const ast: FileAST = {
      ...partial,
      version,
      updatedAt: Date.now(),
    };

    this.cache.set(fileId, ast);
    eventBus.emit("ASTUpdated", { fileId, projectId: file.projectId, language: file.language });
    return ast;
  }

  invalidate(fileId: string): void {
    this.cache.delete(fileId);
    this.versions.delete(fileId);
    const t = this.timers.get(fileId);
    if (t) clearTimeout(t);
    this.timers.delete(fileId);
    const file = store.get("file", fileId);
    if (file) {
      eventBus.emit("ASTInvalidated", { fileId, projectId: file.projectId, language: file.language });
    }
  }

  private rekey(fileId: string): void {
    const ast = this.cache.get(fileId);
    if (!ast) return;
    const info = filePathInfo(fileId);
    if (info) {
      ast.path = info.path;
      this.cache.set(fileId, ast);
    }
  }
}

export const astManager = new ASTManager();
