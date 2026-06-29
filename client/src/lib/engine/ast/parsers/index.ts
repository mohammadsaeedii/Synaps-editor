/* =========================================================================
   synapse · engine · AST parsers
   Pluggable parsers per language. Register new parsers without changing ASTManager.
   ========================================================================= */
import type { ASTParser } from "../types";
import { babelParser } from "./babel";
import { cssParser } from "./css";
import { htmlParser } from "./html";
import { jsonParser } from "./json";
import { noopParser } from "./noop";

const registry: ASTParser[] = [babelParser, jsonParser, htmlParser, cssParser, noopParser];

export function getParserForLanguage(language: string): ASTParser {
  const lang = language.toLowerCase();
  return registry.find((p) => p.languageIds.includes(lang)) ?? noopParser;
}

export function registerParser(parser: ASTParser): void {
  const idx = registry.findIndex((p) => p === noopParser);
  if (idx >= 0) registry.splice(idx, 0, parser);
  else registry.push(parser);
}

export function listParsers(): ASTParser[] {
  return [...registry];
}
