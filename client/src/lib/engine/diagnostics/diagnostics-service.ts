/* =========================================================================
   synapse · engine · diagnostics service
   Independent diagnostic store fed by LSP and AST. Subscribers: Explorer, AI, StatusBar.
   ========================================================================= */
import { uid } from "@/lib/utils";
import { astManager } from "../ast/ast-manager";
import { eventBus } from "../event-bus/event-bus";
import type { Diagnostic, DiagnosticSeverity, DiagnosticsSummary } from "./types";

export class DiagnosticsService {
  private byFile = new Map<string, Diagnostic[]>();
  private installed = false;

  install(): void {
    if (this.installed) return;
    this.installed = true;

    eventBus.on("ASTUpdated", ({ fileId, projectId }) => {
      this.syncFromAST(fileId, projectId);
    });
    eventBus.on("FileDeleted", ({ fileId }) => {
      this.byFile.delete(fileId);
      this.emitChange(fileId, "");
    });
  }

  setDiagnostics(fileId: string, projectId: string, diagnostics: Omit<Diagnostic, "id" | "fileId" | "projectId">[]): void {
    this.byFile.set(
      fileId,
      diagnostics.map((d) => ({ ...d, id: uid(), fileId, projectId })),
    );
    this.emitChange(fileId, projectId);
  }

  getForFile(fileId: string): Diagnostic[] {
    return this.byFile.get(fileId) ?? [];
  }

  getForProject(projectId: string): Diagnostic[] {
    const out: Diagnostic[] = [];
    for (const diags of this.byFile.values()) {
      out.push(...diags.filter((d) => d.projectId === projectId));
    }
    return out;
  }

  getSummary(projectId: string): DiagnosticsSummary {
    const diags = this.getForProject(projectId);
    const byFile = new Map<string, Diagnostic[]>();
    let errorCount = 0;
    let warningCount = 0;
    let infoCount = 0;

    for (const d of diags) {
      if (!byFile.has(d.fileId)) byFile.set(d.fileId, []);
      byFile.get(d.fileId)!.push(d);
      if (d.severity === "error") errorCount++;
      else if (d.severity === "warning") warningCount++;
      else infoCount++;
    }

    return { projectId, errorCount, warningCount, infoCount, byFile };
  }

  clearFile(fileId: string): void {
    const existing = this.byFile.get(fileId);
    const projectId = existing?.[0]?.projectId ?? "";
    this.byFile.delete(fileId);
    this.emitChange(fileId, projectId);
  }

  private syncFromAST(fileId: string, projectId: string): void {
    const ast = astManager.getFileAST(fileId);
    if (!ast) return;

    const diagnostics: Omit<Diagnostic, "id" | "fileId" | "projectId">[] = [];

    if (ast.parseError) {
      diagnostics.push({
        message: ast.parseError,
        severity: "error" as DiagnosticSeverity,
        source: "ast",
        line: 1,
        column: 1,
      });
    }

    const existing = this.byFile.get(fileId) ?? [];
    const lspDiags = existing.filter((d) => d.source === "lsp");
    this.byFile.set(fileId, [
      ...lspDiags,
      ...diagnostics.map((d) => ({ ...d, id: uid(), fileId, projectId })),
    ]);
    this.emitChange(fileId, projectId);
  }

  mergeLspDiagnostics(fileId: string, projectId: string, lspDiags: Omit<Diagnostic, "id" | "fileId" | "projectId">[]): void {
    const astDiags = (this.byFile.get(fileId) ?? []).filter((d) => d.source === "ast");
    this.byFile.set(fileId, [
      ...astDiags,
      ...lspDiags.map((d) => ({ ...d, id: uid(), fileId, projectId, source: "lsp" })),
    ]);
    this.emitChange(fileId, projectId);
  }

  private emitChange(fileId: string, projectId: string): void {
    const diags = this.byFile.get(fileId) ?? [];
    const errorCount = diags.filter((d) => d.severity === "error").length;
    const warningCount = diags.filter((d) => d.severity === "warning").length;
    eventBus.emit("DiagnosticsChanged", { fileId, projectId, errorCount, warningCount });
  }
}

export const diagnosticsService = new DiagnosticsService();
