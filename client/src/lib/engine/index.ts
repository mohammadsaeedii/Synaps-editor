/* =========================================================================
   synapse · engine · public API
   ========================================================================= */

export { initEngine, eventBus } from "./init";

export { fileWatcher } from "./file-watcher/file-watcher";
export { resolveFilePath, filePathInfo, listProjectFiles, toMonacoUri } from "./file-watcher/path-utils";

export { astManager } from "./ast/ast-manager";
export type { FileAST, SymbolInfo, ImportInfo, ExportInfo, SymbolKind, JsxNode } from "./ast/types";
export { registerParser, getParserForLanguage } from "./ast/parsers";

export { symbolIndex } from "./symbols/symbol-index";
export type { IndexedSymbol } from "./symbols/symbol-index";

export { dependencyGraph } from "./dependency-graph/dependency-graph";
export type { DependencyGraphSnapshot, GraphNode, GraphEdge } from "./dependency-graph/types";

export { projectIndex } from "./project-index/project-index";
export type { ProjectIndexSnapshot } from "./project-index/project-index";

export { diagnosticsService } from "./diagnostics/diagnostics-service";
export type { Diagnostic, DiagnosticSeverity, DiagnosticsSummary } from "./diagnostics/types";

export { languageService } from "./lsp/language-service";
export { installMonacoBridge, bindEditorModel, registerFileUri, disposeMonacoBridge } from "./lsp/monaco-bridge";
export type { LanguageServer, LanguageServerCapabilities, CompletionItem, HoverInfo, LocationLink } from "./lsp/types";

export { runtimeManager } from "./runtime/runtime-manager";
export type { Runtime, RuntimeCommand, RuntimeOutput, RuntimeInfo, RuntimeState } from "./runtime/types";

export { buildCodeContext } from "./ai/context-builder";
export type { CodeContext, CodeContextOptions } from "./ai/context-builder";

export type { EngineEventMap, EngineEventType, FileEventPayload, RuntimeState as EngineRuntimeState } from "./event-bus/types";
