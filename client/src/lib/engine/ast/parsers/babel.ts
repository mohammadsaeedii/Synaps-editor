/* =========================================================================
   synapse · engine · Babel AST parser (JS/TS/JSX/TSX)
   ========================================================================= */
import { parse, type ParserOptions } from "@babel/parser";
import traverse, { type NodePath } from "@babel/traverse";
import type * as t from "@babel/types";
import type { ASTParser, ExportInfo, ImportInfo, JsxNode, SymbolInfo, SymbolKind } from "../types";

const JS_LANGS = [
  "javascript", "typescript", "jsx", "tsx",
  "javascriptreact", "typescriptreact",
];

function posFromNode(node: { loc?: { start: { line: number; column: number }; end: { line: number; column: number } } | null }, start = true) {
  const loc = node.loc;
  if (!loc) return { line: 1, column: 0, offset: 0 };
  const p = start ? loc.start : loc.end;
  return { line: p.line, column: p.column, offset: 0 };
}

function rangeFromNode(node: { loc?: { start: { line: number; column: number }; end: { line: number; column: number } } | null }) {
  return { start: posFromNode(node, true), end: posFromNode(node, false) };
}

function kindFromDecl(type: string): SymbolKind {
  switch (type) {
    case "FunctionDeclaration":
    case "FunctionExpression":
    case "ArrowFunctionExpression":
      return "function";
    case "ClassDeclaration":
    case "ClassExpression":
      return "class";
    case "TSInterfaceDeclaration":
      return "interface";
    case "TSTypeAliasDeclaration":
      return "type";
    case "VariableDeclarator":
      return "variable";
    case "TSEnumDeclaration":
      return "enum";
    default:
      return "unknown";
  }
}

function extractJsxName(opening: { name?: t.JSXIdentifier | t.JSXMemberExpression | t.JSXNamespacedName }): string {
  const n = opening.name;
  if (!n) return "unknown";
  if (n.type === "JSXIdentifier") return n.name;
  if (n.type === "JSXMemberExpression") {
    const obj = n.object.type === "JSXIdentifier" ? n.object.name : "?";
    const prop = n.property.name;
    return `${obj}.${prop}`;
  }
  return "unknown";
}

function walkJsx(node: t.Node, depth = 0): JsxNode[] {
  if (depth > 32) return [];
  if (node.type === "JSXElement") {
    const attrs = node.openingElement.attributes
      .filter((a): a is t.JSXAttribute => a.type === "JSXAttribute")
      .map((a) => (a.name.type === "JSXIdentifier" ? a.name.name : ""))
      .filter(Boolean);
    return [{
      tag: extractJsxName(node.openingElement),
      range: rangeFromNode(node),
      attributes: attrs,
      children: node.children.flatMap((c) => walkJsx(c, depth + 1)),
    }];
  }
  if ("children" in node && Array.isArray((node as { children?: t.Node[] }).children)) {
    return (node as { children: t.Node[] }).children.flatMap((c) => walkJsx(c, depth + 1));
  }
  return [];
}

export const babelParser: ASTParser = {
  languageIds: JS_LANGS,
  parse(content, ctx) {
    const isTs = ["typescript", "tsx", "typescriptreact"].includes(ctx.language.toLowerCase());
    const symbols: SymbolInfo[] = [];
    const imports: ImportInfo[] = [];
    const exports: ExportInfo[] = [];
    let parseError: string | undefined;
    let jsxTree: JsxNode[] = [];

    const plugins = ["jsx", "classProperties", "dynamicImport", "importMeta"] as ParserOptions["plugins"];
    if (isTs) (plugins as string[]).push("typescript", "decorators-legacy");

    try {
      const ast = parse(content, {
        sourceType: "module",
        plugins,
        errorRecovery: true,
      });

      traverse(ast, {
        ImportDeclaration(path: NodePath<t.ImportDeclaration>) {
          const node = path.node;
          const specifiers = node.specifiers.map((s) => {
            if (s.type === "ImportDefaultSpecifier") return "default";
            if (s.type === "ImportNamespaceSpecifier") return "*";
            return s.local.name;
          });
          imports.push({
            source: node.source.value as string,
            specifiers,
            range: rangeFromNode(node),
            isDefault: specifiers.includes("default"),
            isNamespace: specifiers.includes("*"),
          });
        },
        ExportNamedDeclaration(path: NodePath<t.ExportNamedDeclaration>) {
          const node = path.node;
          if (node.declaration) {
            const decl = node.declaration;
            if (decl.type === "VariableDeclaration") {
              decl.declarations.forEach((d) => {
                if (d.id.type === "Identifier") {
                  exports.push({ name: d.id.name, kind: "variable", range: rangeFromNode(d) });
                }
              });
            } else if ("id" in decl && decl.id && decl.id.type === "Identifier") {
              exports.push({ name: decl.id.name, kind: kindFromDecl(decl.type), range: rangeFromNode(decl) });
            }
          }
          node.specifiers?.forEach((s) => {
            if (s.exported.type === "Identifier") {
              exports.push({ name: s.exported.name, kind: "export", range: rangeFromNode(s) });
            }
          });
        },
        ExportDefaultDeclaration(path: NodePath<t.ExportDefaultDeclaration>) {
          const node = path.node;
          let name = "default";
          if (node.declaration.type === "Identifier") name = node.declaration.name;
          exports.push({ name, kind: kindFromDecl(node.declaration.type), range: rangeFromNode(node) });
        },
        FunctionDeclaration(path: NodePath<t.FunctionDeclaration>) {
          const node = path.node;
          if (node.id) {
            symbols.push({
              id: `${ctx.fileId}:fn:${node.id.name}`,
              name: node.id.name,
              kind: "function",
              range: rangeFromNode(node),
              exported: path.parent.type === "ExportNamedDeclaration" || path.parent.type === "ExportDefaultDeclaration",
              fileId: ctx.fileId,
            });
          }
        },
        ClassDeclaration(path: NodePath<t.ClassDeclaration>) {
          const node = path.node;
          if (node.id) {
            symbols.push({
              id: `${ctx.fileId}:class:${node.id.name}`,
              name: node.id.name,
              kind: "class",
              range: rangeFromNode(node),
              exported: path.parent.type.startsWith("Export"),
              fileId: ctx.fileId,
            });
          }
        },
        TSInterfaceDeclaration(path: NodePath<t.TSInterfaceDeclaration>) {
          const node = path.node;
          symbols.push({
            id: `${ctx.fileId}:iface:${node.id.name}`,
            name: node.id.name,
            kind: "interface",
            range: rangeFromNode(node),
            exported: path.parent.type.startsWith("Export"),
            fileId: ctx.fileId,
          });
        },
        TSTypeAliasDeclaration(path: NodePath<t.TSTypeAliasDeclaration>) {
          const node = path.node;
          symbols.push({
            id: `${ctx.fileId}:type:${node.id.name}`,
            name: node.id.name,
            kind: "type",
            range: rangeFromNode(node),
            exported: path.parent.type.startsWith("Export"),
            fileId: ctx.fileId,
          });
        },
        VariableDeclarator(path: NodePath<t.VariableDeclarator>) {
          const node = path.node;
          if (node.id.type === "Identifier") {
            const parent = path.parentPath.parent;
            const varDecl = path.parentPath.node;
            symbols.push({
              id: `${ctx.fileId}:var:${node.id.name}`,
              name: node.id.name,
              kind: varDecl.type === "VariableDeclaration" && varDecl.kind === "const" ? "const"
                : varDecl.type === "VariableDeclaration" && varDecl.kind === "let" ? "let"
                : "variable",
              range: rangeFromNode(node),
              exported: parent?.type.startsWith("Export") ?? false,
              fileId: ctx.fileId,
            });
          }
        },
        JSXElement(path: NodePath<t.JSXElement>) {
          if (jsxTree.length === 0) jsxTree = walkJsx(path.node);
        },
      });

      return {
        fileId: ctx.fileId,
        projectId: ctx.projectId,
        language: ctx.language,
        path: ctx.path,
        symbols,
        imports,
        exports,
        jsxTree,
        raw: ast,
      };
    } catch (e) {
      parseError = e instanceof Error ? e.message : "Parse error";
      return {
        fileId: ctx.fileId,
        projectId: ctx.projectId,
        language: ctx.language,
        path: ctx.path,
        parseError,
        symbols,
        imports,
        exports,
        jsxTree,
        raw: null,
      };
    }
  },
};
