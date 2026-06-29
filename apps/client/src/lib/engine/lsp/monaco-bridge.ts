/* =========================================================================
   synapse · engine · Monaco LSP bridge
   Registers Monaco language providers backed by LanguageService.
   ========================================================================= */
import type { editor, IDisposable, Position } from "monaco-editor";
import { store } from "@/lib/store/store";
import { diagnosticsService } from "../diagnostics/diagnostics-service";
import { toMonacoUri, resolveFilePath } from "../file-watcher/path-utils";
import { languageService } from "./language-service";
import { astLanguageServer } from "./providers/ast-server";

const TS_LANGS = new Set(["typescript", "javascript", "typescriptreact", "javascriptreact", "tsx", "jsx"]);

let bridgeInstalled = false;
const disposables: IDisposable[] = [];
const fileIdByUri = new Map<string, string>();

function uriKey(path: string): string {
  return path.replace(/^file:\/\//, "");
}

export function registerFileUri(fileId: string): string {
  const file = store.get("file", fileId);
  if (!file) return "";
  const path = resolveFilePath(file);
  const uri = toMonacoUri(path);
  fileIdByUri.set(uriKey(path), fileId);
  return uri;
}

export function fileIdFromModel(model: editor.ITextModel): string | null {
  const key = uriKey(model.uri.path);
  return fileIdByUri.get(key) ?? null;
}

export async function installMonacoBridge(monaco: typeof import("monaco-editor")): Promise<void> {
  if (bridgeInstalled) return;
  bridgeInstalled = true;

  await languageService.initialize();

  const pushMarkers = (fileId: string) => {
    const file = store.get("file", fileId);
    if (!file) return;
    const uri = monaco.Uri.parse(toMonacoUri(resolveFilePath(file)));
    const model = monaco.editor.getModel(uri);
    if (!model) return;

    const diags = diagnosticsService.getForFile(fileId);
    monaco.editor.setModelMarkers(
      model,
      "synapse",
      diags.map((d) => ({
        severity: d.severity === "error" ? monaco.MarkerSeverity.Error
          : d.severity === "warning" ? monaco.MarkerSeverity.Warning
          : d.severity === "info" ? monaco.MarkerSeverity.Info
          : monaco.MarkerSeverity.Hint,
        message: d.message,
        startLineNumber: d.line,
        startColumn: d.column,
        endLineNumber: d.endLine ?? d.line,
        endColumn: d.endColumn ?? d.column + 1,
        source: d.source,
        code: d.code,
      })),
    );
  };

  const { eventBus } = await import("../event-bus/event-bus");
  eventBus.on("DiagnosticsChanged", ({ fileId }) => pushMarkers(fileId));

  const astLangs = astLanguageServer.languageIds.filter((l) => !TS_LANGS.has(l));

  const lspPos = (position: Position) => ({
    line: position.lineNumber - 1,
    character: position.column - 1,
  });

  disposables.push(
    monaco.languages.registerHoverProvider(astLangs, {
      provideHover: async (model, position) => {
        const fileId = fileIdFromModel(model);
        if (!fileId) return null;
        const hover = await languageService.getHover(fileId, lspPos(position));
        if (!hover) return null;
        return {
          range: new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column),
          contents: [{ value: hover.contents }],
        };
      },
    }),
  );

  disposables.push(
    monaco.languages.registerCompletionItemProvider(astLangs, {
      triggerCharacters: [".", '"', "'", "/"],
      provideCompletionItems: async (model, position) => {
        const fileId = fileIdFromModel(model);
        if (!fileId) return { suggestions: [] };
        const items = await languageService.getCompletions(fileId, lspPos(position));
        return {
          suggestions: items.map((item) => ({
            label: item.label,
            kind: monaco.languages.CompletionItemKind.Text,
            insertText: item.insertText ?? item.label,
            detail: item.detail,
            range: {
              startLineNumber: position.lineNumber,
              startColumn: position.column,
              endLineNumber: position.lineNumber,
              endColumn: position.column,
            },
          })),
        };
      },
    }),
  );

  disposables.push(
    monaco.languages.registerDefinitionProvider(astLangs, {
      provideDefinition: async (model, position) => {
        const fileId = fileIdFromModel(model);
        if (!fileId) return null;
        const links = await languageService.getDefinition(fileId, lspPos(position));
        return links.map((l) => ({
          uri: monaco.Uri.parse(toMonacoUri(l.path)),
          range: new monaco.Range(
            l.range.start.line + 1,
            l.range.start.character + 1,
            l.range.end.line + 1,
            l.range.end.character + 1,
          ),
        }));
      },
    }),
  );

  disposables.push(
    monaco.languages.registerReferenceProvider(astLangs, {
      provideReferences: async (model, position) => {
        const fileId = fileIdFromModel(model);
        if (!fileId) return [];
        const links = await languageService.getReferences(fileId, lspPos(position));
        return links.map((l) => ({
          uri: monaco.Uri.parse(toMonacoUri(l.path)),
          range: new monaco.Range(
            l.range.start.line + 1,
            l.range.start.character + 1,
            l.range.end.line + 1,
            l.range.end.character + 1,
          ),
        }));
      },
    }),
  );

  disposables.push(
    monaco.languages.registerDocumentSymbolProvider(astLangs, {
      provideDocumentSymbols: async (model) => {
        const fileId = fileIdFromModel(model);
        if (!fileId) return [];
        const symbols = await languageService.getDocumentSymbols(fileId);
        return symbols.map((s) => ({
          name: s.name,
          detail: s.kind,
          kind: monaco.languages.SymbolKind.Function,
          tags: [],
          range: new monaco.Range(
            s.range.start.line + 1,
            s.range.start.character + 1,
            s.range.end.line + 1,
            s.range.end.character + 1,
          ),
          selectionRange: new monaco.Range(
            s.range.start.line + 1,
            s.range.start.character + 1,
            s.range.start.line + 1,
            s.range.start.character + 1,
          ),
        }));
      },
    }),
  );

  disposables.push(
    monaco.languages.registerRenameProvider(astLangs, {
      provideRenameEdits: async (model, position, newName) => {
        const fileId = fileIdFromModel(model);
        if (!fileId) return null;
        const edits = await languageService.rename(fileId, lspPos(position), newName);
        const resourceEdits = edits.map((e) => ({
          resource: monaco.Uri.parse(toMonacoUri(e.path)),
          textEdit: {
            range: new monaco.Range(
              e.range.start.line + 1,
              e.range.start.character + 1,
              e.range.end.line + 1,
              e.range.end.character + 1,
            ),
            text: newName,
          },
          versionId: undefined,
        }));
        return { edits: resourceEdits };
      },
    }),
  );
}

export function disposeMonacoBridge(): void {
  disposables.forEach((d) => d.dispose());
  disposables.length = 0;
  bridgeInstalled = false;
}

export function bindEditorModel(monaco: typeof import("monaco-editor"), fileId: string, language: string, content: string): editor.ITextModel {
  registerFileUri(fileId);
  const file = store.get("file", fileId);
  if (!file) throw new Error("File not found");
  const uri = monaco.Uri.parse(toMonacoUri(resolveFilePath(file)));
  let model = monaco.editor.getModel(uri);
  if (!model) {
    model = monaco.editor.createModel(content, language, uri);
  } else if (model.getValue() !== content) {
    model.setValue(content);
  }
  return model;
}
