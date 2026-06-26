/* =========================================================================
   synapse · reusable item actions
   The right-click action set shared by the explorer, panels and palette
   (rename / duplicate / pin / favourite / tags / export / delete), ported from
   ui.js. Exposed as a hook so it can reach the workspace dialogs + toasts.
   ========================================================================= */
"use client";
import { KINDS } from "./store/kinds";
import { store } from "./store/store";
import type { Kind } from "./store/types";
import type { MenuItem } from "./ui-types";
import { downloadText } from "./utils";
import { useWorkspace } from "./workspace";

/** Permissive update — the generic store signature fights the Kind union here. */
const updateField = (kind: Kind, id: string, p: Record<string, unknown>) =>
  (store.update as unknown as (k: Kind, id: string, patch: Record<string, unknown>, o?: { silent?: boolean }) => void)(kind, id, p);

export function useItemActions() {
  const { confirm, promptDialog, toast } = useWorkspace();

  const renameItem = async (kind: Kind, id: string) => {
    const o = store.get(kind, id);
    if (!o) return;
    const key = KINDS[kind].title;
    const v = await promptDialog("Rename", { value: (o as unknown as Record<string, string>)[key], okText: "Rename" });
    if (v != null && v.trim()) updateField(kind, id, { [key]: v.trim() });
  };

  const editTags = async (kind: Kind, id: string) => {
    const o = store.get(kind, id);
    if (!o) return;
    const v = await promptDialog("Tags (comma or space separated)", {
      value: (o.tags || []).map((t) => "#" + t).join(" "),
      placeholder: "#frontend #urgent",
    });
    if (v != null) store.setTags(kind, id, v.split(/[\s,]+/));
  };

  const deleteItem = async (kind: Kind, id: string) => {
    const o = store.get(kind, id);
    if (!o) return;
    const ok = await confirm(`Delete “${store.titleOf(kind, o)}”? This cannot be undone.`, { title: "Delete", okText: "Delete", danger: true });
    if (ok) {
      store.remove(kind, id);
      toast("Deleted", "ok");
    }
  };

  const exportItem = (kind: Kind, id: string) => {
    const o = store.get(kind, id);
    if (!o) return;
    downloadText(`${store.titleOf(kind, o).replace(/\W+/g, "-").toLowerCase()}.json`, JSON.stringify(o, null, 2));
    toast("Exported", "ok");
  };

  const itemMenuItems = (kind: Kind, id: string, opts: { onOpen?: () => void; extra?: MenuItem[] } = {}): MenuItem[] => {
    const o = store.get(kind, id);
    if (!o) return [];
    return [
      opts.onOpen ? { label: "Open", icon: "chat", onClick: opts.onOpen } : undefined,
      { label: "Rename", icon: "edit", onClick: () => renameItem(kind, id) },
      { label: "Duplicate", icon: "duplicate", onClick: () => { if (store.duplicate(kind, id)) toast("Duplicated", "ok"); } },
      { label: o.pinned ? "Unpin" : "Pin", icon: "pin", onClick: () => store.togglePin(kind, id) },
      { label: o.favorite ? "Unfavorite" : "Favorite", icon: "star", onClick: () => store.toggleFav(kind, id) },
      { label: "Tags…", icon: "tag", onClick: () => editTags(kind, id) },
      ...(opts.extra || []),
      { sep: true },
      { label: "Export", icon: "download", onClick: () => exportItem(kind, id) },
      { label: "Delete", icon: "trash", danger: true, onClick: () => deleteItem(kind, id) },
    ].filter(Boolean) as MenuItem[];
  };

  return { renameItem, editTags, deleteItem, exportItem, itemMenuItems };
}
