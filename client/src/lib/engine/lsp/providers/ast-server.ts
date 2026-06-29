/* =========================================================================
   synapse · engine · AST language server
   Provides hover, completion, symbols from AST for languages without full LSP.
   ========================================================================= */
import { astManager } from "../../ast/ast-manager";
import { symbolIndex } from "../../symbols/symbol-index";
import type { Diagnostic } from "../../diagnostics/types";
import type {
  CompletionItem,
  DocumentSymbol,
  HoverInfo,
  LanguageServer,
  LanguageServerCapabilities,
  LspPosition,
  LocationLink,
} from "../types";

const CAPABILITIES: LanguageServerCapabilities = {
  diagnostics: true,
  hover: true,
  completion: true,
  signatureHelp: false,
  rename: false,
  definition: true,
  references: true,
  documentSymbols: true,
  semanticTokens: false,
  folding: true,
  codeActions: false,
  formatting: false,
  workspaceSymbols: true,
};

function offsetAt(content: string, pos: LspPosition): number {
  const lines = content.split("\n");
  let offset = 0;
  for (let i = 0; i < pos.line && i < lines.length; i++) offset += lines[i].length + 1;
  return offset + pos.character;
}

function wordAt(content: string, offset: number): string {
  const re = /[\w$]+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) {
    if (m.index <= offset && m.index + m[0].length >= offset) return m[0];
  }
  return "";
}

export class ASTLanguageServer implements LanguageServer {
  readonly id = "ast";
  readonly languageIds: string[];
  readonly capabilities = CAPABILITIES;

  constructor(languageIds: string[]) {
    this.languageIds = languageIds;
  }

  didOpen(): void {}
  didChange(): void {}
  didClose(): void {}

  async getDiagnostics(fileId: string): Promise<Diagnostic[]> {
    const ast = astManager.getFileAST(fileId);
    if (!ast?.parseError) return [];
    return [{
      id: "",
      fileId,
      projectId: ast.projectId,
      message: ast.parseError,
      severity: "error",
      source: "ast",
      line: 1,
      column: 1,
    }];
  }

  async getHover(fileId: string, position: LspPosition): Promise<HoverInfo | null> {
    const ast = astManager.getFileAST(fileId);
    if (!ast) return null;
    const sym = ast.symbols.find((s) =>
      position.line >= s.range.start.line && position.line <= s.range.end.line,
    );
    if (sym) return { contents: `**${sym.kind}** \`${sym.name}\`` };
    return null;
  }

  async getCompletions(fileId: string, position: LspPosition): Promise<CompletionItem[]> {
    const ast = astManager.getFileAST(fileId);
    if (!ast) return [];
    const syms = symbolIndex.getSymbols(fileId);
    const keywords = ast.imports.flatMap((i) => i.specifiers).filter(Boolean);
    const items: CompletionItem[] = [
      ...syms.map((s) => ({ label: s.name, kind: s.kind, detail: s.kind })),
      ...keywords.map((k) => ({ label: k, kind: "import" })),
    ];
    return items;
  }

  async getDefinition(fileId: string, position: LspPosition): Promise<LocationLink[]> {
    const ast = astManager.getFileAST(fileId);
    if (!ast) return [];
    const sym = ast.symbols.find((s) =>
      position.line >= s.range.start.line && position.line <= s.range.end.line,
    );
    if (!sym) return [];
    return [{
      fileId,
      path: ast.path,
      range: {
        start: { line: sym.range.start.line - 1, character: sym.range.start.column },
        end: { line: sym.range.end.line - 1, character: sym.range.end.column },
      },
    }];
  }

  async getReferences(fileId: string, position: LspPosition): Promise<LocationLink[]> {
    const ast = astManager.getFileAST(fileId);
    if (!ast) return [];
    const name = ast.symbols.find((s) => position.line >= s.range.start.line)?.name;
    if (!name) return [];
    return astManager.findReferences(name, ast.projectId).map((r) => ({
      fileId: r.fileId,
      path: r.path,
      range: { start: { line: r.line - 1, character: 0 }, end: { line: r.line - 1, character: 0 } },
    }));
  }

  async getDocumentSymbols(fileId: string): Promise<DocumentSymbol[]> {
    const ast = astManager.getFileAST(fileId);
    if (!ast) return [];
    return ast.symbols.map((s) => ({
      name: s.name,
      kind: s.kind,
      range: {
        start: { line: s.range.start.line - 1, character: s.range.start.column },
        end: { line: s.range.end.line - 1, character: s.range.end.column },
      },
    }));
  }

  async getWorkspaceSymbols(query: string, projectId: string): Promise<DocumentSymbol[]> {
    return symbolIndex.findWorkspaceSymbols(query, projectId).map((s) => ({
      name: s.name,
      kind: s.kind,
      range: {
        start: { line: s.range.start.line - 1, character: s.range.start.column },
        end: { line: s.range.end.line - 1, character: s.range.end.column },
      },
    }));
  }
}

export const astLanguageServer = new ASTLanguageServer([
  "json", "css", "scss", "less", "html", "xml", "python", "go", "rust",
  "java", "php", "ruby", "sql", "yaml", "shell", "plaintext", "markdown",
]);
