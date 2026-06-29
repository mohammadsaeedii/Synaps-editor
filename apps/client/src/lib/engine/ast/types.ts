/* =========================================================================
   synapse · engine · AST types
   ========================================================================= */

export type SymbolKind =
  | "function"
  | "class"
  | "interface"
  | "type"
  | "variable"
  | "const"
  | "let"
  | "import"
  | "export"
  | "method"
  | "property"
  | "enum"
  | "namespace"
  | "jsx"
  | "unknown";

export interface SourcePosition {
  line: number;
  column: number;
  offset: number;
}

export interface SourceRange {
  start: SourcePosition;
  end: SourcePosition;
}

export interface SymbolInfo {
  id: string;
  name: string;
  kind: SymbolKind;
  range: SourceRange;
  exported: boolean;
  fileId: string;
  parentId?: string;
}

export interface ImportInfo {
  source: string;
  specifiers: string[];
  range: SourceRange;
  isDefault: boolean;
  isNamespace: boolean;
}

export interface ExportInfo {
  name: string;
  kind: SymbolKind;
  range: SourceRange;
  source?: string;
}

export interface JsxNode {
  tag: string;
  range: SourceRange;
  children: JsxNode[];
  attributes: string[];
}

export interface FileAST {
  fileId: string;
  projectId: string;
  language: string;
  path: string;
  version: number;
  parseError?: string;
  symbols: SymbolInfo[];
  imports: ImportInfo[];
  exports: ExportInfo[];
  jsxTree: JsxNode[];
  /** Raw AST node for language-specific consumers (opaque). */
  raw: unknown;
  updatedAt: number;
}

export interface ASTParser {
  readonly languageIds: string[];
  parse(content: string, ctx: { fileId: string; projectId: string; path: string; language: string }): Omit<FileAST, "version" | "updatedAt">;
}

export interface ASTQueryOptions {
  projectId?: string;
  kind?: SymbolKind;
  name?: string;
}
