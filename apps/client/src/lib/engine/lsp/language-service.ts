/* =========================================================================
   synapse · engine · language service
   Registry and orchestrator for pluggable language servers.
   ========================================================================= */
import { store } from "@/lib/store/store";
import { eventBus } from "../event-bus/event-bus";
import { diagnosticsService } from "../diagnostics/diagnostics-service";
import { astLanguageServer } from "./providers/ast-server";
import { typescriptLanguageServer } from "./providers/typescript-server";
import type {
  CompletionItem,
  DocumentSymbol,
  HoverInfo,
  LanguageServer,
  LanguageServerRegistration,
  LocationLink,
  LspPosition,
  LspRange,
} from "./types";

export class LanguageService {
  private servers: LanguageServerRegistration[] = [
    { server: typescriptLanguageServer, priority: 10 },
    { server: astLanguageServer, priority: 1 },
  ];
  private versions = new Map<string, number>();
  private installed = false;
  private initialized = false;

  install(): void {
    if (this.installed) return;
    this.installed = true;

    eventBus.on("FileCreated", (p) => this.notifyOpen(p.fileId, p.language, p.content ?? ""));
    eventBus.on("FileUpdated", (p) => this.notifyChange(p.fileId, p.content ?? ""));
    eventBus.on("FileDeleted", (p) => this.notifyClose(p.fileId));
    eventBus.on("FileRenamed", (p) => this.serverFor(p.language)?.didRename?.(p.fileId, p.path));
    eventBus.on("FileMoved", (p) => this.serverFor(p.language)?.didRename?.(p.fileId, p.path));
  }

  register(registration: LanguageServerRegistration): void {
    this.servers.push(registration);
    this.servers.sort((a, b) => b.priority - a.priority);
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    for (const { server } of this.servers) {
      await server.initialize?.();
      server.languageIds.forEach((id) => {
        eventBus.emit("LanguageServiceReady", { languageId: id });
      });
    }
    this.initialized = true;
  }

  async bootstrapProject(projectId: string): Promise<void> {
    await this.initialize();
    await typescriptLanguageServer.syncProject(projectId);
    store.byProject("file", projectId)
      .filter((f) => !f.dir)
      .forEach((f) => this.notifyOpen(f.id, f.language, f.content));
  }

  serverFor(language: string): LanguageServer | null {
    const lang = language.toLowerCase();
    const reg = this.servers.find((r) => r.server.languageIds.includes(lang));
    return reg?.server ?? astLanguageServer;
  }

  private bumpVersion(fileId: string): number {
    const v = (this.versions.get(fileId) ?? 0) + 1;
    this.versions.set(fileId, v);
    return v;
  }

  notifyOpen(fileId: string, language: string, content: string): void {
    const server = this.serverFor(language);
    const version = this.bumpVersion(fileId);
    server?.didOpen(fileId, language, content, version);
    void this.refreshDiagnostics(fileId, language);
  }

  notifyChange(fileId: string, content: string): void {
    const file = store.get("file", fileId);
    if (!file) return;
    const server = this.serverFor(file.language);
    const version = this.bumpVersion(fileId);
    server?.didChange(fileId, content, version);
    void this.refreshDiagnostics(fileId, file.language);
  }

  notifyClose(fileId: string): void {
    const file = store.get("file", fileId);
    const server = file ? this.serverFor(file.language) : null;
    server?.didClose(fileId);
    this.versions.delete(fileId);
    diagnosticsService.clearFile(fileId);
  }

  async refreshDiagnostics(fileId: string, language: string): Promise<void> {
    const server = this.serverFor(language);
    if (!server?.getDiagnostics) return;
    const file = store.get("file", fileId);
    if (!file) return;
    const diags = await server.getDiagnostics(fileId);
    if (diags.length) {
      diagnosticsService.mergeLspDiagnostics(
        fileId,
        file.projectId,
        diags.map(({ id: _, ...d }) => d),
      );
    }
  }

  async getHover(fileId: string, position: LspPosition): Promise<HoverInfo | null> {
    const file = store.get("file", fileId);
    if (!file) return null;
    return (await this.serverFor(file.language)?.getHover?.(fileId, position)) ?? null;
  }

  async getCompletions(fileId: string, position: LspPosition): Promise<CompletionItem[]> {
    const file = store.get("file", fileId);
    if (!file) return [];
    return (await this.serverFor(file.language)?.getCompletions?.(fileId, position)) ?? [];
  }

  async getDefinition(fileId: string, position: LspPosition): Promise<LocationLink[]> {
    const file = store.get("file", fileId);
    if (!file) return [];
    return (await this.serverFor(file.language)?.getDefinition?.(fileId, position)) ?? [];
  }

  async getReferences(fileId: string, position: LspPosition): Promise<LocationLink[]> {
    const file = store.get("file", fileId);
    if (!file) return [];
    return (await this.serverFor(file.language)?.getReferences?.(fileId, position)) ?? [];
  }

  async getDocumentSymbols(fileId: string): Promise<DocumentSymbol[]> {
    const file = store.get("file", fileId);
    if (!file) return [];
    return (await this.serverFor(file.language)?.getDocumentSymbols?.(fileId)) ?? [];
  }

  async getWorkspaceSymbols(query: string, projectId: string): Promise<DocumentSymbol[]> {
    const results: DocumentSymbol[] = [];
    for (const { server } of this.servers) {
      const syms = await server.getWorkspaceSymbols?.(query, projectId);
      if (syms) results.push(...syms);
    }
    return results;
  }

  async format(fileId: string): Promise<string | null> {
    const file = store.get("file", fileId);
    if (!file) return null;
    return (await this.serverFor(file.language)?.format?.(fileId)) ?? null;
  }

  async rename(fileId: string, position: LspPosition, newName: string): Promise<LocationLink[]> {
    const file = store.get("file", fileId);
    if (!file) return [];
    return (await this.serverFor(file.language)?.rename?.(fileId, position, newName)) ?? [];
  }

  async getCodeActions(fileId: string, range: LspRange) {
    const file = store.get("file", fileId);
    if (!file) return [];
    return (await this.serverFor(file.language)?.getCodeActions?.(fileId, range)) ?? [];
  }
}

export const languageService = new LanguageService();
