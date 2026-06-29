/* =========================================================================
   synapse · store — slice helpers
   Shared utilities for Zustand slices (defaults, activity log).
   ========================================================================= */
import { uid } from "../../utils";
import { KINDS } from "../kinds";
import { titleOf } from "../selectors";
import type { Activity, AnyItem, AppState, Kind, KindItemMap, Project } from "../types";

export function newItemDefaults<K extends Kind>(state: AppState, kind: K, props: { projectId?: string }): KindItemMap[K] {
  const now = Date.now();
  const baseObj = {
    id: uid(),
    projectId: props.projectId ?? state.ui.activeProjectId ?? "",
    pinned: false,
    favorite: false,
    tags: [] as string[],
    createdAt: now,
    updatedAt: now,
  };
  let obj: object = baseObj;
  switch (kind) {
    case "chat":
      obj = { ...baseObj, title: "New chat", folderId: null, archived: false, system: "", persona: "", model: "", messages: [] };
      break;
    case "file":
      obj = { ...baseObj, name: "untitled.txt", parentId: null, dir: false, content: "", language: "plaintext", encoding: "text", mimeType: "text/plain" };
      break;
    case "note":
      obj = { ...baseObj, title: "Untitled note", content: "" };
      break;
    case "task":
      obj = { ...baseObj, title: "New task", status: "todo", priority: "med", due: null, notes: "", order: now };
      break;
    case "prompt":
      obj = { ...baseObj, title: "New prompt", body: "", uses: 0 };
      break;
    case "memory":
      obj = { ...baseObj, title: "New memory", body: "", scope: "project" };
      break;
  }
  return obj as unknown as KindItemMap[K];
}

export function logActivity(draft: AppState, action: string, kind: string, obj: AnyItem | Project | null): void {
  if (!obj) return;
  draft.activity.unshift({
    id: uid(),
    action,
    kind,
    refId: obj.id,
    projectId: (obj as AnyItem).projectId ?? null,
    title: titleOf(kind, obj),
    ts: Date.now(),
  } as Activity);
  if (draft.activity.length > 120) draft.activity.length = 120;
}

export function touch(draft: AppState, obj: AnyItem, kind: string, action: string | null): void {
  obj.updatedAt = Date.now();
  if (action) logActivity(draft, action, kind, obj);
}

export function itemCollection<K extends Kind>(draft: AppState, kind: K): Record<string, KindItemMap[K]> {
  return draft[KINDS[kind].coll] as Record<string, KindItemMap[K]>;
}
