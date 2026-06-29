/* =========================================================================
   synapse · workspace orchestrator
   The React replacement for the original dock.js (shell layout + tabs), the
   ui.js host surfaces (toasts, dialogs, context menu) and app.js (global
   actions + theme). Persisted layout lives in the store's `session`; transient
   surfaces (toasts, the open menu, the palette) live in ui-store (Zustand).
   Components consume shell actions through `useWorkspace()`.
   ========================================================================= */
"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  type ChangeEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from "react";
import { importNativeFiles, createBlankFile } from "./files/file-service";
import { initEngine } from "./engine";
import { PANEL_META, tabKey } from "./panels";
import { ACCENTS, KINDS } from "./store/kinds";
import { store, useStore } from "./store/store";
import type { AnyItem, Chat, GroupSnapshot, Kind, Project } from "./store/types";
import { useUiStore } from "./ui/ui-store";
import type { DialogSpec, MenuAnchor, MenuItem, ToastItem, ToastKind } from "./ui-types";
import { clamp } from "./utils";

interface RightPreview {
  node: ReactNode;
  title: string;
}

export interface WorkspaceContextValue {
  /* transient surfaces */
  toasts: ToastItem[];
  toast: (msg: string, kind?: ToastKind) => void;
  dismissToast: (id: string) => void;

  dialog: DialogSpec | null;
  confirm: (message: string, opts?: { title?: string; okText?: string; danger?: boolean }) => Promise<boolean>;
  promptDialog: (title: string, opts?: { value?: string; placeholder?: string; okText?: string }) => Promise<string | null>;
  resolveDialog: (value: string | boolean | null) => void;

  menu: { items: MenuItem[]; anchor: MenuAnchor } | null;
  openMenu: (items: MenuItem[], at: ReactMouseEvent | HTMLElement) => void;
  closeMenu: () => void;

  paletteOpen: boolean;
  palettePrefill: string;
  openPalette: (prefill?: string) => void;
  closePalette: () => void;

  rightPreview: RightPreview | null;
  openRight: (node: ReactNode, title?: string) => void;
  clearRight: () => void;

  /* single-panel focus + prompt insertion */
  focusTaskId: string | null;
  focusTask: (id: string | null) => void;
  focusAgentId: string | null;
  insertRequest: { text: string; ts: number; chatId: string | null } | null;
  clearInsertRequest: () => void;

  /* shell actions (persisted in session) */
  openTab: (panel: string, refId?: string | null, opts?: { focus?: boolean; group?: number }) => void;
  closeTab: (id: string) => void;
  closeOthers: (id: string) => void;
  setActiveTab: (groupIndex: number, tabIndex: number) => void;
  focusGroup: (i: number) => void;
  splitActive: () => void;
  closeGroup: (i: number) => void;
  activateSide: (id: string) => void;
  toggleSide: (force?: boolean) => void;
  openDock: (id: string) => void;
  toggleDock: (force?: boolean) => void;
  toggleRight: (force?: boolean) => void;
  setSideWidth: (v: number) => void;
  setRightWidth: (v: number) => void;
  setDockHeight: (v: number) => void;

  /* app actions */
  newChat: () => Chat;
  newItem: (kind: Kind) => AnyItem;
  pickFiles: () => void;
  revealInExplorer: (fileId: string) => void;
  newProject: () => Promise<Project | undefined>;
  open: (kind: string, id: string) => void;
  openAgent: (id: string) => void;
  usePromptItem: (id: string) => void;
  requestInsert: (text: string) => void;
}

const Ctx = createContext<WorkspaceContextValue | null>(null);

export function useWorkspace(): WorkspaceContextValue {
  const v = useContext(Ctx);
  if (!v) throw new Error("useWorkspace must be used within <WorkspaceProvider>");
  return v;
}

const cloneGroups = (): GroupSnapshot[] => {
  const g = store.session().groups;
  const src = g && g.length ? g : [{ active: -1, tabs: [] }];
  return src.map((x) => ({ active: x.active, tabs: x.tabs.slice() }));
};

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const settings = useStore((s) => s.settings);
  const ui = useUiStore();

  /* ---- editor tabs (persisted in session) ---- */
  const openTab = useCallback((panel: string, refId: string | null = null, opts: { focus?: boolean; group?: number } = {}) => {
    const meta = PANEL_META[panel];
    if (!meta) return;
    const rid = meta.single ? null : refId ?? null;
    const id = tabKey(panel, rid);
    const groups = cloneGroups();
    for (let gi = 0; gi < groups.length; gi++) {
      const ti = groups[gi].tabs.findIndex((t) => tabKey(t.panel, t.refId) === id);
      if (ti >= 0) {
        groups[gi].active = ti;
        store.setSession({ groups, activeGroup: opts.focus === false ? store.session().activeGroup : gi });
        return;
      }
    }
    const want = opts.group ?? store.session().activeGroup ?? 0;
    const gi = groups[want] ? want : 0;
    groups[gi].tabs.push({ panel, refId: rid });
    groups[gi].active = groups[gi].tabs.length - 1;
    store.setSession({ groups, activeGroup: gi });
  }, []);

  const closeTab = useCallback((id: string) => {
    const groups = cloneGroups();
    for (let gi = 0; gi < groups.length; gi++) {
      const i = groups[gi].tabs.findIndex((t) => tabKey(t.panel, t.refId) === id);
      if (i < 0) continue;
      groups[gi].tabs.splice(i, 1);
      if (groups[gi].active >= groups[gi].tabs.length) groups[gi].active = groups[gi].tabs.length - 1;
      if (!groups[gi].tabs.length && groups.length > 1) {
        groups.splice(gi, 1);
        store.setSession({ groups, activeGroup: 0 });
        return;
      }
      store.setSession({ groups });
      return;
    }
  }, []);

  const closeOthers = useCallback((id: string) => {
    for (const g of cloneGroups()) {
      const t = g.tabs.find((x) => tabKey(x.panel, x.refId) === id);
      if (t) {
        store.setSession({ groups: [{ active: 0, tabs: [t] }], activeGroup: 0 });
        return;
      }
    }
  }, []);

  const setActiveTab = useCallback((groupIndex: number, tabIndex: number) => {
    const groups = cloneGroups();
    if (!groups[groupIndex]) return;
    groups[groupIndex].active = tabIndex;
    store.setSession({ groups, activeGroup: groupIndex });
  }, []);

  const focusGroup = useCallback((i: number) => store.setSession({ activeGroup: i }), []);

  const splitActive = useCallback(() => {
    const groups = cloneGroups();
    if (groups.length >= 2) {
      ui.toast("Already split", "info");
      return;
    }
    groups.push({ active: -1, tabs: [] });
    store.setSession({ groups, activeGroup: 1 });
  }, [ui]);

  const closeGroup = useCallback((i: number) => {
    const groups = cloneGroups();
    if (groups.length <= 1) return;
    groups.splice(i, 1);
    store.setSession({ groups, activeGroup: 0 });
  }, []);

  /* ---- side / dock / right ---- */
  const activateSide = useCallback((id: string) => {
    const s = store.session();
    if (s.sideView === id && s.sideOpen) {
      store.setSession({ sideOpen: false });
      return;
    }
    store.setSession({ sideView: id, sideOpen: true });
  }, []);
  const toggleSide = useCallback((force?: boolean) => store.setSession({ sideOpen: force ?? !store.session().sideOpen }), []);
  const openDock = useCallback((id: string) => store.setSession({ dockTab: id, dockOpen: true }), []);
  const toggleDock = useCallback((force?: boolean) => store.setSession({ dockOpen: force ?? !store.session().dockOpen }), []);
  const toggleRight = useCallback((force?: boolean) => store.setSession({ rightOpen: force ?? !store.session().rightOpen }), []);
  const openRight = useCallback(
    (node: ReactNode, title = "Preview") => {
      ui.openRight(node, title);
      store.setSession({ rightOpen: true });
    },
    [ui],
  );
  const clearRight = ui.clearRight;
  const setSideWidth = useCallback((v: number) => store.setSession({ sideWidth: clamp(v, 180, 560) }), []);
  const setRightWidth = useCallback((v: number) => store.setSession({ rightWidth: clamp(v, 260, 720) }), []);
  const setDockHeight = useCallback((v: number) => store.setSession({ dockHeight: clamp(v, 120, window.innerHeight - 220) }), []);

  /* ---- file picker ---- */
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pickFiles = useCallback(() => fileInputRef.current?.click(), []);

  const handleFileInput = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files?.length) return;
      const imported = await importNativeFiles(files);
      if (imported.length) {
        openTab("file", imported[0].id);
        ui.toast(imported.length === 1 ? `Added ${imported[0].name}` : `Added ${imported.length} files`, "ok");
      }
      e.target.value = "";
    },
    [openTab, ui],
  );

  const revealInExplorer = useCallback((fileId: string) => {
    const ex = store.session().explorer ?? { groups: {}, query: "", tag: "", favOnly: false };
    store.setSession({
      sideView: "explorer",
      sideOpen: true,
      explorer: { ...ex, groups: { ...ex.groups, files: true }, revealFileId: fileId },
    });
  }, []);

  /* ---- app actions ---- */
  const newChat = useCallback((): Chat => {
    const c = store.create("chat", {});
    store.setActiveChatId(c.id);
    store.saveNow();
    openTab("chat", c.id);
    return c;
  }, [openTab]);

  const open = useCallback(
    (kind: string, id: string) => {
      if (kind === "project") {
        store.setActiveProject(id);
        return;
      }
      const meta = PANEL_META[kind];
      if (!meta) return;
      if (meta.single) {
        openTab(kind, null);
        if (kind === "task") ui.focusTask(id);
      } else {
        openTab(kind, id);
      }
    },
    [openTab, ui],
  );

  const newItem = useCallback(
    (kind: Kind): AnyItem => {
      if (kind === "file") {
        const o = createBlankFile();
        open(kind, o.id);
        ui.toast("New file", "ok");
        return o;
      }
      const o = store.create(kind, {});
      open(kind, o.id);
      ui.toast("New " + KINDS[kind].label.toLowerCase(), "ok");
      return o;
    },
    [open, ui],
  );

  const newProject = useCallback(async (): Promise<Project | undefined> => {
    const name = await ui.promptDialog("New project", { placeholder: "Project name", okText: "Create" });
    if (name?.trim()) {
      const p = store.createProject({ name: name.trim() });
      store.setActiveProject(p.id);
      ui.toast("Project created", "ok");
      return p;
    }
    return undefined;
  }, [ui]);

  const openAgent = useCallback(
    (id: string) => {
      openTab("agents", null);
      ui.setFocusAgentId(id);
    },
    [openTab, ui],
  );

  const requestInsert = useCallback(
    (text: string) => {
      let cid = store.getState().ui.activeChatId;
      if (!cid || !store.get("chat", cid)) {
        cid = newChat().id;
      } else {
        openTab("chat", cid);
      }
      ui.setInsertRequest({ text, ts: Date.now(), chatId: cid });
    },
    [newChat, openTab, ui],
  );

  const usePromptItem = useCallback(
    (id: string) => {
      const p = store.get("prompt", id);
      if (!p) return;
      store.update("prompt", id, { uses: (p.uses || 0) + 1 }, { silent: true });
      requestInsert(p.body);
    },
    [requestInsert],
  );

  /* ---- theme (data-theme / accent / motion) ---- */
  useEffect(() => {
    const root = document.documentElement;
    const resolved = settings.theme === "system" ? (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark") : settings.theme;
    root.setAttribute("data-theme", resolved);
    const a = ACCENTS[settings.accent] || ACCENTS.violet;
    root.style.setProperty("--accent", a[0]);
    root.style.setProperty("--accent-2", a[1]);
    root.setAttribute("data-motion", settings.reduceMotion ? "reduce" : "full");
  }, [settings.theme, settings.accent, settings.reduceMotion]);

  /* ---- IDE engine (LSP, AST, file watcher, runtime) ---- */
  useEffect(() => {
    void initEngine();
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const h = () => {
      if (store.settings().theme === "system") document.documentElement.setAttribute("data-theme", mq.matches ? "light" : "dark");
    };
    mq.addEventListener?.("change", h);
    return () => mq.removeEventListener?.("change", h);
  }, []);

  /* ---- first-run: open something useful ---- */
  useEffect(() => {
    const s = store.session();
    if (!s.groups || !s.groups.some((g) => g.tabs.length)) {
      openTab("overview", null);
      const cid = store.getState().ui.activeChatId;
      if (cid && store.get("chat", cid)) openTab("chat", cid);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---- global keyboard ---- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      const el = document.activeElement as HTMLElement | null;
      const typing = el ? /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || el.isContentEditable : false;
      const k = e.key.toLowerCase();
      if (e.key === "Escape") {
        ui.closeMenu();
        return;
      }
      if (mod && e.shiftKey && k === "p") {
        e.preventDefault();
        ui.openPalette(">");
      } else if (mod && (k === "k" || k === "p") && !e.shiftKey) {
        e.preventDefault();
        ui.openPalette("");
      } else if (mod && e.shiftKey && k === "f") {
        e.preventDefault();
        activateSide("search");
      } else if (mod && e.shiftKey && k === "e") {
        e.preventDefault();
        activateSide("explorer");
      } else if (mod && k === "b" && !e.altKey) {
        e.preventDefault();
        toggleSide();
      } else if (mod && e.altKey && k === "b") {
        e.preventDefault();
        toggleRight();
      } else if (mod && k === "j") {
        e.preventDefault();
        toggleDock();
      } else if (e.key === "`" && e.ctrlKey) {
        e.preventDefault();
        openDock("terminal");
      } else if (mod && e.key === "\\") {
        e.preventDefault();
        splitActive();
      } else if (mod && k === "n" && !typing) {
        e.preventDefault();
        newChat();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [activateSide, newChat, openDock, splitActive, toggleDock, toggleRight, toggleSide, ui]);

  const value: WorkspaceContextValue = {
    toasts: ui.toasts,
    toast: ui.toast,
    dismissToast: ui.dismissToast,
    dialog: ui.dialog,
    confirm: ui.confirm,
    promptDialog: ui.promptDialog,
    resolveDialog: ui.resolveDialog,
    menu: ui.menu,
    openMenu: ui.openMenu,
    closeMenu: ui.closeMenu,
    paletteOpen: ui.paletteOpen,
    palettePrefill: ui.palettePrefill,
    openPalette: ui.openPalette,
    closePalette: ui.closePalette,
    rightPreview: ui.rightPreview,
    openRight,
    clearRight,
    focusTaskId: ui.focusTaskId,
    focusTask: ui.focusTask,
    focusAgentId: ui.focusAgentId,
    insertRequest: ui.insertRequest,
    clearInsertRequest: ui.clearInsertRequest,
    openTab,
    closeTab,
    closeOthers,
    setActiveTab,
    focusGroup,
    splitActive,
    closeGroup,
    activateSide,
    toggleSide,
    openDock,
    toggleDock,
    toggleRight,
    setSideWidth,
    setRightWidth,
    setDockHeight,
    newChat,
    newItem,
    pickFiles,
    revealInExplorer,
    newProject,
    open,
    openAgent,
    usePromptItem,
    requestInsert,
  };

  return (
    <Ctx.Provider value={value}>
      <input ref={fileInputRef} type="file" multiple hidden aria-hidden onChange={handleFileInput} />
      {children}
    </Ctx.Provider>
  );
}
