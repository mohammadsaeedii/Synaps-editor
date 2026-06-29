/* =========================================================================
   synapse · engine · AI context builder
   Assembles code-aware context for the AI from AST, symbols, diagnostics, etc.
   ========================================================================= */
import { store } from "@/lib/store/store";
import { astManager } from "../ast/ast-manager";
import { dependencyGraph } from "../dependency-graph/dependency-graph";
import { diagnosticsService } from "../diagnostics/diagnostics-service";
import { projectIndex } from "../project-index/project-index";
import { runtimeManager } from "../runtime/runtime-manager";
import { symbolIndex } from "../symbols/symbol-index";

export interface CodeContextOptions {
  projectId?: string;
  activeFileId?: string | null;
  maxFiles?: number;
  maxChars?: number;
  includeRuntime?: boolean;
  includeGraph?: boolean;
}

export interface CodeContext {
  systemAppend: string;
  metadata: {
    openFiles: string[];
    activeFile: string | null;
    errorCount: number;
    warningCount: number;
    symbolCount: number;
    runtimeState: string;
  };
}

function getOpenFileIds(): string[] {
  const session = store.session();
  const groups = session.groups ?? [];
  const ids: string[] = [];
  for (const g of groups) {
    for (const t of g.tabs) {
      if (t.panel === "file" && t.refId) ids.push(t.refId);
    }
  }
  return [...new Set(ids)];
}

function getActiveFileId(): string | null {
  const session = store.session();
  const groups = session.groups ?? [];
  const group = groups[session.activeGroup];
  const tab = group?.tabs[group.active];
  return tab?.panel === "file" ? tab.refId : null;
}

export function buildCodeContext(opts: CodeContextOptions = {}): CodeContext {
  const projectId = opts.projectId ?? store.activeProject()?.id;
  const maxFiles = opts.maxFiles ?? 8;
  const maxChars = opts.maxChars ?? 24_000;
  const openFiles = getOpenFileIds();
  const activeFileId = opts.activeFileId ?? getActiveFileId();

  if (!projectId) {
    return {
      systemAppend: "",
      metadata: { openFiles: [], activeFile: null, errorCount: 0, warningCount: 0, symbolCount: 0, runtimeState: "idle" },
    };
  }

  const diagSummary = diagnosticsService.getSummary(projectId);
  const snapshot = projectIndex.getSnapshot(projectId) ?? projectIndex.rebuild(projectId);
  const runtimeState = runtimeManager.getState(projectId);
  const runtimeOutput = opts.includeRuntime !== false
    ? runtimeManager.getOutput(projectId, 20).map((o) => `[${o.stream}] ${o.text}`).join("")
    : "";

  const sections: string[] = [
    "## Code-aware context (auto-generated)",
    "",
    `Project symbols: ${snapshot.symbolCount}`,
    `Diagnostics: ${diagSummary.errorCount} errors, ${diagSummary.warningCount} warnings`,
    `Runtime: ${runtimeState}`,
  ];

  if (opts.includeGraph !== false && snapshot.graph) {
    const g = snapshot.graph;
    sections.push(
      "",
      "### Dependency graph",
      `Files: ${g.nodes.length}, Edges: ${g.edges.length}`,
      g.circular.length ? `Circular dependencies: ${g.circular.length}` : "No circular dependencies detected",
      g.unusedFiles.length ? `Potentially unused files: ${g.unusedFiles.length}` : "",
    );
  }

  if (activeFileId) {
    const ast = astManager.getFileAST(activeFileId);
    const file = store.get("file", activeFileId);
    if (ast && file) {
      sections.push(
        "",
        `### Active file: ${ast.path}`,
        `Language: ${file.language}`,
        `Symbols: ${ast.symbols.map((s) => `${s.kind} ${s.name}`).join(", ") || "none"}`,
        `Imports: ${ast.imports.map((i) => i.source).join(", ") || "none"}`,
      );
      const fileDiags = diagnosticsService.getForFile(activeFileId);
      if (fileDiags.length) {
        sections.push("Diagnostics:", ...fileDiags.slice(0, 10).map((d) => `- [${d.severity}] L${d.line}: ${d.message}`));
      }
    }
  }

  const priorityFiles = [...new Set([...(activeFileId ? [activeFileId] : []), ...openFiles])].slice(0, maxFiles);
  let charBudget = maxChars;

  for (const fileId of priorityFiles) {
    const ast = astManager.getFileAST(fileId);
    const file = store.get("file", fileId);
    if (!file || file.dir) continue;

    const header = `\n### ${ast?.path ?? file.name}\n\`\`\`${file.language}\n`;
    const footer = "\n```\n";
    const body = file.content.slice(0, Math.max(0, charBudget - header.length - footer.length - 200));
    if (body.length === 0) break;

    sections.push(header + body + footer);

    if (ast) {
      const symList = ast.symbols.slice(0, 20).map((s) => `- ${s.kind}: ${s.name}`).join("\n");
      if (symList) sections.push("AST symbols:\n" + symList);
    }

    charBudget -= header.length + body.length + footer.length;
    if (charBudget <= 500) break;
  }

  if (runtimeOutput && opts.includeRuntime !== false) {
    sections.push("", "### Recent runtime output", "```", runtimeOutput.slice(-2000), "```");
  }

  const workspaceSymbols = symbolIndex.findWorkspaceSymbols("", projectId).slice(0, 30);
  if (workspaceSymbols.length) {
    sections.push("", "### Workspace symbols (sample)", workspaceSymbols.map((s) => `- ${s.name} (${s.kind}) @ ${s.path}`).join("\n"));
  }

  if (snapshot.graph && opts.includeGraph !== false) {
    const deps = activeFileId ? dependencyGraph.findDependencies(activeFileId) : [];
    if (deps.length) sections.push("", `### Active file dependencies: ${deps.join(", ")}`);
  }

  return {
    systemAppend: sections.filter(Boolean).join("\n"),
    metadata: {
      openFiles: priorityFiles,
      activeFile: activeFileId,
      errorCount: diagSummary.errorCount,
      warningCount: diagSummary.warningCount,
      symbolCount: snapshot.symbolCount,
      runtimeState,
    },
  };
}
