/* =========================================================================
   synapse · file service
   Import from native picker, download, and content helpers for FileItems.
   ========================================================================= */
import { store } from "@/lib/store/store";
import type { FileItem } from "@/lib/store/types";
import { detectFileType, shouldUseBase64, type FileEncoding } from "./file-types";

export interface ImportedFile {
  id: string;
  name: string;
}

function readAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

function readAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? "");
      const comma = result.indexOf(",");
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export async function readNativeFile(file: File): Promise<{ content: string; encoding: FileEncoding; mimeType: string; language: string }> {
  const info = detectFileType(file.name);
  const mimeType = file.type || info.mimeType;
  const useBase64 = shouldUseBase64(info.category, mimeType) && info.category !== "unknown";

  if (useBase64 && !info.editable) {
    const content = await readAsBase64(file);
    return { content, encoding: "base64", mimeType, language: info.language };
  }

  try {
    const content = await readAsText(file);
    return { content, encoding: "text", mimeType, language: info.language };
  } catch {
    const content = await readAsBase64(file);
    return { content, encoding: "base64", mimeType, language: info.language };
  }
}

export async function importNativeFiles(files: FileList | File[], opts: { parentId?: string | null; openFirst?: boolean } = {}): Promise<ImportedFile[]> {
  const pid = store.getState().ui.activeProjectId ?? "";
  const list = Array.from(files);
  const imported: ImportedFile[] = [];

  for (const file of list) {
    const { content, encoding, mimeType, language } = await readNativeFile(file);
    const item = store.create(
      "file",
      {
        name: file.name,
        parentId: opts.parentId ?? null,
        dir: false,
        content,
        language,
        encoding,
        mimeType,
        size: file.size,
      },
      { silent: list.length > 1 },
    );
    imported.push({ id: item.id, name: item.name });
  }

  if (imported.length) {
    store.logActivity("imported", "file", store.get("file", imported[0].id));
    store.flush();
  }

  return imported;
}

export function downloadFileItem(file: FileItem): void {
  const mime = file.mimeType || detectFileType(file.name).mimeType;
  let blob: Blob;

  if (file.encoding === "base64") {
    const bin = atob(file.content);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    blob = new Blob([bytes], { type: mime });
  } else {
    blob = new Blob([file.content], { type: mime });
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function createBlankFile(parentId: string | null = null): FileItem {
  return store.create("file", { name: "untitled.txt", parentId, dir: false, content: "", language: "plaintext", encoding: "text" });
}
