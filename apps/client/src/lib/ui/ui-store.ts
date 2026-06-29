/* =========================================================================
   synapse · UI store (Zustand)
   Ephemeral overlay + shell chrome state: toasts, dialogs, menus, palette,
   preview panel focus, prompt insertion. Not persisted.
   ========================================================================= */
"use client";
import { create } from "zustand";
import type { MouseEvent as ReactMouseEvent, ReactNode } from "react";
import type { DialogSpec, MenuAnchor, MenuItem, ToastItem, ToastKind } from "../ui-types";
import { uid } from "../utils";

interface RightPreview {
  node: ReactNode;
  title: string;
}

interface UiState {
  toasts: ToastItem[];
  dialog: DialogSpec | null;
  menu: { items: MenuItem[]; anchor: MenuAnchor } | null;
  paletteOpen: boolean;
  palettePrefill: string;
  rightPreview: RightPreview | null;
  focusTaskId: string | null;
  focusAgentId: string | null;
  insertRequest: { text: string; ts: number; chatId: string | null } | null;
}

interface UiActions {
  toast: (msg: string, kind?: ToastKind) => void;
  dismissToast: (id: string) => void;
  confirm: (message: string, opts?: { title?: string; okText?: string; danger?: boolean }) => Promise<boolean>;
  promptDialog: (title: string, opts?: { value?: string; placeholder?: string; okText?: string }) => Promise<string | null>;
  resolveDialog: (value: string | boolean | null) => void;
  openMenu: (items: MenuItem[], at: ReactMouseEvent | HTMLElement) => void;
  closeMenu: () => void;
  openPalette: (prefill?: string) => void;
  closePalette: () => void;
  openRight: (node: ReactNode, title?: string) => void;
  clearRight: () => void;
  focusTask: (id: string | null) => void;
  setFocusAgentId: (id: string | null) => void;
  setInsertRequest: (req: UiState["insertRequest"]) => void;
  clearInsertRequest: () => void;
}

export type UiStore = UiState & UiActions;

let dialogResolve: ((v: string | boolean | null) => void) | null = null;

export const useUiStore = create<UiStore>((set, get) => ({
  toasts: [],
  dialog: null,
  menu: null,
  paletteOpen: false,
  palettePrefill: "",
  rightPreview: null,
  focusTaskId: null,
  focusAgentId: null,
  insertRequest: null,

  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),

  toast: (msg, kind = "") => {
    const id = uid();
    set((s) => ({ toasts: [...s.toasts, { id, msg, kind }] }));
    setTimeout(() => get().dismissToast(id), 2600);
  },

  confirm: (message, opts = {}) =>
    new Promise<boolean>((resolve) => {
      dialogResolve = (v) => resolve(!!v);
      set({ dialog: { title: opts.title ?? "Confirm", message, okText: opts.okText ?? "Confirm", danger: opts.danger } });
    }),

  promptDialog: (title, opts = {}) =>
    new Promise<string | null>((resolve) => {
      dialogResolve = (v) => resolve(typeof v === "string" ? v : null);
      set({ dialog: { title, input: true, value: opts.value ?? "", placeholder: opts.placeholder, okText: opts.okText ?? "OK" } });
    }),

  resolveDialog: (value) => {
    set({ dialog: null });
    const r = dialogResolve;
    dialogResolve = null;
    r?.(value);
  },

  openMenu: (items, at) => {
    let anchor: MenuAnchor;
    if (at instanceof HTMLElement) {
      const r = at.getBoundingClientRect();
      anchor = { x: r.right, y: r.bottom + 6, alignRight: true };
    } else {
      anchor = { x: at.clientX, y: at.clientY, alignRight: false };
      at.preventDefault();
    }
    set({ menu: { items: items.filter(Boolean), anchor } });
  },

  closeMenu: () => set({ menu: null }),

  openPalette: (prefill = "") => set({ paletteOpen: true, palettePrefill: prefill }),

  closePalette: () => set({ paletteOpen: false }),

  openRight: (node, title = "Preview") => set({ rightPreview: { node, title } }),

  clearRight: () => set({ rightPreview: null }),

  focusTask: (id) => set({ focusTaskId: id }),

  setFocusAgentId: (id) => set({ focusAgentId: id }),

  setInsertRequest: (req) => set({ insertRequest: req }),

  clearInsertRequest: () => set({ insertRequest: null }),
}));
