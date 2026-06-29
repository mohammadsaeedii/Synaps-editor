/* =========================================================================
   synapse · engine · virtual path resolution
   Maps in-memory FileItem records to POSIX-style paths for LSP / AST / AI.
   ========================================================================= */
import { store } from "@/lib/store/store";
import type { FileItem } from "@/lib/store/types";

export function resolveFilePath(file: FileItem): string {
  const segments: string[] = [file.name];
  let parentId = file.parentId;
  const seen = new Set<string>();

  while (parentId) {
    if (seen.has(parentId)) break;
    seen.add(parentId);
    const parent = store.get("file", parentId);
    if (!parent) break;
    segments.unshift(parent.name);
    parentId = parent.parentId;
  }

  return "/" + segments.join("/");
}

export function filePathInfo(fileId: string): { fileId: string; projectId: string; name: string; path: string; language: string } | null {
  const file = store.get("file", fileId);
  if (!file || file.dir) return null;
  return {
    fileId: file.id,
    projectId: file.projectId,
    name: file.name,
    path: resolveFilePath(file),
    language: file.language,
  };
}

export function listProjectFiles(projectId: string): FileItem[] {
  return store.byProject("file", projectId).filter((f) => !f.dir && (f.encoding ?? "text") === "text");
}

export function toMonacoUri(path: string): string {
  return `file://${path.startsWith("/") ? path : "/" + path}`;
}
