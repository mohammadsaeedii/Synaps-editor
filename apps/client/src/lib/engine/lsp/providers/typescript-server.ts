/* =========================================================================
   synapse · engine · TypeScript language server (Monaco built-in worker)
   Syncs virtual project files to Monaco's TypeScript language service.
   ========================================================================= */
import { store } from "@/lib/store/store";
import { diagnosticsService } from "../../diagnostics/diagnostics-service";
import { listProjectFiles, toMonacoUri, resolveFilePath } from "../../file-watcher/path-utils";
import type { Diagnostic } from "../../diagnostics/types";
import type { LanguageServer, LanguageServerCapabilities } from "../types";
import { loadMonacoTypeScript } from "../monaco-typescript";

const TS_LANGS = ["typescript", "javascript", "typescriptreact", "javascriptreact", "tsx", "jsx"];

const CAPABILITIES: LanguageServerCapabilities = {
  diagnostics: true,
  hover: true,
  completion: true,
  signatureHelp: true,
  rename: true,
  definition: true,
  references: true,
  documentSymbols: true,
  semanticTokens: true,
  folding: true,
  codeActions: true,
  formatting: true,
  workspaceSymbols: true,
};

type MonacoModule = typeof import("monaco-editor");

export class TypeScriptLanguageServer implements LanguageServer {
  readonly id = "typescript";
  readonly languageIds = TS_LANGS;
  readonly capabilities = CAPABILITIES;

  private monaco: MonacoModule | null = null;
  private models = new Map<string, import("monaco-editor").editor.ITextModel>();
  private versions = new Map<string, number>();
  private ready = false;

  async initialize(): Promise<void> {
    if (this.ready) return;
    this.monaco = await import("monaco-editor");
    const ts = await loadMonacoTypeScript(this.monaco);

    const opts = {
      target: ts.ScriptTarget.ES2020,
      allowNonTsExtensions: true,
      moduleResolution: ts.ModuleResolutionKind.NodeJs,
      module: ts.ModuleKind.ESNext,
      noEmit: true,
      esModuleInterop: true,
      jsx: ts.JsxEmit.React,
      allowJs: true,
      checkJs: true,
    };

    ts.typescriptDefaults.setCompilerOptions(opts);
    ts.javascriptDefaults.setCompilerOptions(opts);
    ts.typescriptDefaults.setEagerModelSync(true);
    ts.javascriptDefaults.setEagerModelSync(true);
    ts.typescriptDefaults.setDiagnosticsOptions({ noSemanticValidation: false, noSyntaxValidation: false });
    ts.javascriptDefaults.setDiagnosticsOptions({ noSemanticValidation: false, noSyntaxValidation: false });

    this.ready = true;
  }

  private uriFor(fileId: string): import("monaco-editor").Uri | null {
    const file = store.get("file", fileId);
    if (!file) return null;
    return this.monaco!.Uri.parse(toMonacoUri(resolveFilePath(file)));
  }

  private langFor(language: string): string {
    const l = language.toLowerCase();
    if (l.includes("tsx") || l === "typescriptreact") return "typescript";
    if (l.includes("jsx") || l === "javascriptreact") return "javascript";
    if (l === "typescript") return "typescript";
    return "javascript";
  }

  didOpen(fileId: string, language: string, content: string, version: number): void {
    void this.syncModel(fileId, language, content, version);
  }

  didChange(fileId: string, content: string, version: number): void {
    const file = store.get("file", fileId);
    if (!file) return;
    void this.syncModel(fileId, file.language, content, version);
  }

  didClose(fileId: string): void {
    const model = this.models.get(fileId);
    if (model) {
      model.dispose();
      this.models.delete(fileId);
    }
    this.versions.delete(fileId);
    diagnosticsService.clearFile(fileId);
  }

  didRename(fileId: string): void {
    const model = this.models.get(fileId);
    const file = store.get("file", fileId);
    if (!model || !file || !this.monaco) return;
    const uri = this.uriFor(fileId);
    if (!uri) return;
    const lang = this.langFor(file.language);
    const newModel = this.monaco.editor.createModel(model.getValue(), lang, uri);
    model.dispose();
    this.models.set(fileId, newModel);
    this.pushDiagnostics(fileId);
  }

  async syncProject(projectId: string): Promise<void> {
    await this.initialize();
    for (const f of listProjectFiles(projectId)) {
      if (TS_LANGS.includes(f.language.toLowerCase()) || /\.(tsx?|jsx?)$/.test(f.name)) {
        await this.syncModel(f.id, f.language, f.content, (this.versions.get(f.id) ?? 0) + 1);
      }
    }
  }

  private async syncModel(fileId: string, language: string, content: string, version: number): Promise<void> {
    await this.initialize();
    if (!this.monaco) return;

    const uri = this.uriFor(fileId);
    if (!uri) return;

    const lang = this.langFor(language);
    let model = this.models.get(fileId);

    if (!model) {
      model = this.monaco.editor.createModel(content, lang, uri);
      this.models.set(fileId, model);
    } else if (model.getValue() !== content) {
      model.setValue(content);
    }

    this.versions.set(fileId, version);
    this.scheduleDiagnostics(fileId);
  }

  private diagTimer = new Map<string, ReturnType<typeof setTimeout>>();

  private scheduleDiagnostics(fileId: string): void {
    const prev = this.diagTimer.get(fileId);
    if (prev) clearTimeout(prev);
    this.diagTimer.set(fileId, setTimeout(() => this.pushDiagnostics(fileId), 300));
  }

  private pushDiagnostics(fileId: string): void {
    if (!this.monaco) return;
    const model = this.models.get(fileId);
    const file = store.get("file", fileId);
    if (!model || !file) return;

    const markers = this.monaco.editor.getModelMarkers({ resource: model.uri });
    const diags: Omit<Diagnostic, "id">[] = markers.map((m) => ({
      fileId,
      projectId: file.projectId,
      message: m.message,
      severity: m.severity === this.monaco!.MarkerSeverity.Error ? "error"
        : m.severity === this.monaco!.MarkerSeverity.Warning ? "warning"
        : "info",
      source: "lsp",
      line: m.startLineNumber,
      column: m.startColumn,
      endLine: m.endLineNumber,
      endColumn: m.endColumn,
      code: m.code ? String(m.code) : undefined,
    }));

    diagnosticsService.mergeLspDiagnostics(fileId, file.projectId, diags);
  }

  async getDiagnostics(fileId: string): Promise<Diagnostic[]> {
    this.pushDiagnostics(fileId);
    return diagnosticsService.getForFile(fileId).filter((d) => d.source === "lsp");
  }
}

export const typescriptLanguageServer = new TypeScriptLanguageServer();
