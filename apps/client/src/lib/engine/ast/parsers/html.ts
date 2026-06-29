/* =========================================================================
   synapse · engine · HTML AST parser (lightweight tag extraction)
   ========================================================================= */
import type { ASTParser, JsxNode } from "../types";

const TAG_RE = /<(\/?)([\w-]+)([^>]*)>/g;
const IMPORT_RE = /<link[^>]+href=['"]([^'"]+)['"]/gi;

function buildTree(content: string): JsxNode[] {
  const roots: JsxNode[] = [];
  const stack: JsxNode[] = [];
  let m: RegExpExecArray | null;
  const lineOf = (idx: number) => content.slice(0, idx).split("\n").length;

  TAG_RE.lastIndex = 0;
  while ((m = TAG_RE.exec(content)) !== null) {
    const closing = m[1] === "/";
    const tag = m[2];
    const attrs = (m[3].match(/[\w-]+(?==)/g) ?? []);
    const line = lineOf(m.index);
    const node: JsxNode = {
      tag,
      range: { start: { line, column: m.index, offset: m.index }, end: { line, column: m.index + m[0].length, offset: m.index + m[0].length } },
      attributes: attrs,
      children: [],
    };

    if (closing) {
      while (stack.length && stack[stack.length - 1].tag !== tag) stack.pop();
      if (stack.length) stack.pop();
    } else if (!m[0].endsWith("/>")) {
      if (stack.length) stack[stack.length - 1].children.push(node);
      else roots.push(node);
      stack.push(node);
    } else {
      if (stack.length) stack[stack.length - 1].children.push(node);
      else roots.push(node);
    }
  }
  return roots;
}

export const htmlParser: ASTParser = {
  languageIds: ["html", "xml"],
  parse(content, ctx) {
    const jsxTree = buildTree(content);
    const imports: { source: string; specifiers: string[]; range: { start: { line: number; column: number; offset: number }; end: { line: number; column: number; offset: number } }; isDefault: boolean; isNamespace: boolean }[] = [];

    let m: RegExpExecArray | null;
    IMPORT_RE.lastIndex = 0;
    while ((m = IMPORT_RE.exec(content)) !== null) {
      imports.push({
        source: m[1],
        specifiers: [],
        range: { start: { line: 1, column: m.index, offset: m.index }, end: { line: 1, column: m.index + m[0].length, offset: m.index + m[0].length } },
        isDefault: false,
        isNamespace: false,
      });
    }

    return {
      fileId: ctx.fileId,
      projectId: ctx.projectId,
      language: ctx.language,
      path: ctx.path,
      symbols: [],
      imports,
      exports: [],
      jsxTree,
      raw: null,
    };
  },
};
