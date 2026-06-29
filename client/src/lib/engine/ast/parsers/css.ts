/* =========================================================================
   synapse · engine · CSS AST parser (lightweight)
   ========================================================================= */
import type { ASTParser, SymbolInfo } from "../types";

const SELECTOR_RE = /([.#]?[\w-]+(?:\s*[>,+~]\s*[\w.#-]+)*)\s*\{/g;
const IMPORT_RE = /@import\s+(?:url\()?['"]?([^'")\s;]+)['"]?\)?/g;

export const cssParser: ASTParser = {
  languageIds: ["css", "scss", "less"],
  parse(content, ctx) {
    const symbols: SymbolInfo[] = [];
    const imports: import("../types").ImportInfo[] = [];

    let m: RegExpExecArray | null;
    let line = 1;
    const lines = content.split("\n");

    lines.forEach((ln, i) => {
      SELECTOR_RE.lastIndex = 0;
      while ((m = SELECTOR_RE.exec(ln)) !== null) {
        const name = m[1].trim();
        symbols.push({
          id: `${ctx.fileId}:css:${name}:${i}`,
          name,
          kind: "unknown",
          range: { start: { line: i + 1, column: m.index, offset: 0 }, end: { line: i + 1, column: m.index + name.length, offset: 0 } },
          exported: false,
          fileId: ctx.fileId,
        });
      }
    });

    IMPORT_RE.lastIndex = 0;
    while ((m = IMPORT_RE.exec(content)) !== null) {
      const before = content.slice(0, m.index);
      line = before.split("\n").length;
      imports.push({
        source: m[1],
        specifiers: [],
        range: { start: { line, column: 0, offset: m.index }, end: { line, column: m[0].length, offset: m.index + m[0].length } },
        isDefault: false,
        isNamespace: false,
      });
    }

    return {
      fileId: ctx.fileId,
      projectId: ctx.projectId,
      language: ctx.language,
      path: ctx.path,
      symbols,
      imports,
      exports: [],
      jsxTree: [],
      raw: null,
    };
  },
};
