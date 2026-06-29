/* =========================================================================
   synapse · engine · Monaco TypeScript loader (Monaco 0.55+)
   ========================================================================= */

export interface MonacoTsApi {
  typescriptDefaults: {
    setCompilerOptions(opts: Record<string, unknown>): void;
    setEagerModelSync(enabled: boolean): void;
    setDiagnosticsOptions(opts: Record<string, unknown>): void;
  };
  javascriptDefaults: {
    setCompilerOptions(opts: Record<string, unknown>): void;
    setEagerModelSync(enabled: boolean): void;
    setDiagnosticsOptions(opts: Record<string, unknown>): void;
  };
  ScriptTarget: { ES2020: number };
  ModuleResolutionKind: { NodeJs: number };
  ModuleKind: { ESNext: number };
  JsxEmit: { React: number };
}

export async function loadMonacoTypeScript(monaco: typeof import("monaco-editor")): Promise<MonacoTsApi> {
  // Side-effect import registers TS/JS language services with Monaco
  await import("monaco-editor/min/vs/language/typescript/monaco.contribution.js");
  const ts = (monaco.languages as unknown as { typescript: MonacoTsApi }).typescript;
  return ts;
}
