/* =========================================================================
   synapse · engine · LSP types
   ========================================================================= */
import type { Diagnostic } from "../diagnostics/types";

export interface LspPosition {
  line: number;
  character: number;
}

export interface LspRange {
  start: LspPosition;
  end: LspPosition;
}

export interface CompletionItem {
  label: string;
  kind?: string;
  detail?: string;
  insertText?: string;
}

export interface HoverInfo {
  contents: string;
  range?: LspRange;
}

export interface LocationLink {
  fileId: string;
  path: string;
  range: LspRange;
}

export interface DocumentSymbol {
  name: string;
  kind: string;
  range: LspRange;
  children?: DocumentSymbol[];
}

export interface LanguageServerCapabilities {
  diagnostics: boolean;
  hover: boolean;
  completion: boolean;
  signatureHelp: boolean;
  rename: boolean;
  definition: boolean;
  references: boolean;
  documentSymbols: boolean;
  semanticTokens: boolean;
  folding: boolean;
  codeActions: boolean;
  formatting: boolean;
  workspaceSymbols: boolean;
}

export interface LanguageServer {
  readonly id: string;
  readonly languageIds: string[];
  readonly capabilities: LanguageServerCapabilities;
  initialize?(): Promise<void>;
  dispose?(): void;
  didOpen(fileId: string, language: string, content: string, version: number): void;
  didChange(fileId: string, content: string, version: number): void;
  didClose(fileId: string): void;
  didRename?(fileId: string, newPath: string): void;
  getDiagnostics?(fileId: string): Promise<Diagnostic[]>;
  getHover?(fileId: string, position: LspPosition): Promise<HoverInfo | null>;
  getCompletions?(fileId: string, position: LspPosition): Promise<CompletionItem[]>;
  getSignatureHelp?(fileId: string, position: LspPosition): Promise<string | null>;
  getDefinition?(fileId: string, position: LspPosition): Promise<LocationLink[]>;
  getReferences?(fileId: string, position: LspPosition): Promise<LocationLink[]>;
  getDocumentSymbols?(fileId: string): Promise<DocumentSymbol[]>;
  getWorkspaceSymbols?(query: string, projectId: string): Promise<DocumentSymbol[]>;
  rename?(fileId: string, position: LspPosition, newName: string): Promise<LocationLink[]>;
  format?(fileId: string): Promise<string | null>;
  getCodeActions?(fileId: string, range: LspRange): Promise<{ title: string; edit?: string }[]>;
}

export interface LanguageServerRegistration {
  server: LanguageServer;
  priority: number;
}
