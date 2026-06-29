/* =========================================================================
   synapse · engine · noop AST parser (fallback)
   ========================================================================= */
import type { ASTParser } from "../types";

export const noopParser: ASTParser = {
  languageIds: ["plaintext", "markdown", "shell", "sql", "yaml", "xml", "dockerfile"],
  parse(content, ctx) {
    return {
      fileId: ctx.fileId,
      projectId: ctx.projectId,
      language: ctx.language,
      path: ctx.path,
      symbols: [],
      imports: [],
      exports: [],
      jsxTree: [],
      raw: null,
    };
  },
};
