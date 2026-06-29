/* =========================================================================
   synapse · editor view state
   Persists Monaco cursor, scroll, selection, and folded regions per file
   across tab switches and close/reopen cycles.
   ========================================================================= */
import type { editor } from "monaco-editor";

const viewStates = new Map<string, editor.ICodeEditorViewState>();

export function saveViewState(fileId: string, ed: editor.IStandaloneCodeEditor): void {
  const vs = ed.saveViewState();
  if (vs) viewStates.set(fileId, vs);
}

export function restoreViewState(fileId: string, ed: editor.IStandaloneCodeEditor): boolean {
  const vs = viewStates.get(fileId);
  if (!vs) return false;
  ed.restoreViewState(vs);
  return true;
}

export function clearViewState(fileId: string): void {
  viewStates.delete(fileId);
}

export function hasViewState(fileId: string): boolean {
  return viewStates.has(fileId);
}
