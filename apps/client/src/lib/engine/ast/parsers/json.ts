/* =========================================================================
   synapse · engine · JSON AST parser
   ========================================================================= */
import type { ASTParser, ExportInfo, SymbolInfo } from "../types";

function pos(line: number, column: number, offset: number) {
  return { line, column, offset };
}

function range(startLine: number, endLine: number): { start: ReturnType<typeof pos>; end: ReturnType<typeof pos> } {
  return { start: pos(startLine, 0, 0), end: pos(endLine, 0, 0) };
}

export const jsonParser: ASTParser = {
  languageIds: ["json"],
  parse(content, ctx) {
    const symbols: SymbolInfo[] = [];
    const exports: ExportInfo[] = [];
    let parseError: string | undefined;

    try {
      const data = JSON.parse(content) as unknown;
      if (data && typeof data === "object" && !Array.isArray(data)) {
        Object.keys(data as Record<string, unknown>).forEach((key, i) => {
          const sym: SymbolInfo = {
            id: `${ctx.fileId}:${key}`,
            name: key,
            kind: "property",
            range: range(i + 1, i + 1),
            exported: true,
            fileId: ctx.fileId,
          };
          symbols.push(sym);
          exports.push({ name: key, kind: "property", range: sym.range });
        });
      }
    } catch (e) {
      parseError = e instanceof Error ? e.message : "Invalid JSON";
    }

    return {
      fileId: ctx.fileId,
      projectId: ctx.projectId,
      language: ctx.language,
      path: ctx.path,
      parseError,
      symbols,
      imports: [],
      exports,
      jsxTree: [],
      raw: null,
    };
  },
};
