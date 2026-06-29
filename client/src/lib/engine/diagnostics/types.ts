/* =========================================================================
   synapse · engine · diagnostics types
   ========================================================================= */

export type DiagnosticSeverity = "error" | "warning" | "info" | "hint";

export interface Diagnostic {
  id: string;
  fileId: string;
  projectId: string;
  message: string;
  severity: DiagnosticSeverity;
  source: string;
  line: number;
  column: number;
  endLine?: number;
  endColumn?: number;
  code?: string;
}

export interface DiagnosticsSummary {
  projectId: string;
  errorCount: number;
  warningCount: number;
  infoCount: number;
  byFile: Map<string, Diagnostic[]>;
}
