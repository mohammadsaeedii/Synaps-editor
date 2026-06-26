"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Kbd } from "@/components/atoms/Kbd/Kbd";
import { Swatch } from "@/components/atoms/Swatch/Swatch";
import { Icon, isIconName, type IconName } from "@/design/icons";
import { fuzzy, hi } from "@/lib/fuzzy";
import { KINDS, PROJECT_COLORS } from "@/lib/store/kinds";
import { store, useStoreVersion } from "@/lib/store/store";
import type { Kind } from "@/lib/store/types";
import { downloadText, pluralize } from "@/lib/utils";
import { useWorkspace } from "@/lib/workspace";
import s from "./CommandPalette.module.css";

interface Result {
  type: "cmd" | "item" | "tag";
  title: string;
  idx: number[];
  icon: IconName | ReactNode;
  hint?: string;
  group?: string;
  snippet?: string;
  projectId?: string | null;
  kind?: string;
  run: () => void;
}

interface Command {
  title: string;
  icon: IconName;
  group: string;
  hint?: string;
  run: () => void;
}

export function CommandPalette() {
  useStoreVersion();
  const ws = useWorkspace();
  const { paletteOpen, palettePrefill, closePalette } = ws;
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (paletteOpen) {
      setQuery(palettePrefill);
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [paletteOpen, palettePrefill]);

  if (!paletteOpen) return null;

  const commands: Command[] = [
    { title: "New chat", icon: "chat", group: "Create", hint: "⌘N", run: () => ws.newChat() },
    { title: "New note", icon: "notes", group: "Create", run: () => ws.newItem("note") },
    { title: "New task", icon: "tasks", group: "Create", run: () => ws.newItem("task") },
    { title: "New file", icon: "file", group: "Create", run: () => ws.newItem("file") },
    { title: "New prompt", icon: "prompts", group: "Create", run: () => ws.newItem("prompt") },
    { title: "New memory", icon: "memory", group: "Create", run: () => ws.newItem("memory") },
    { title: "New project", icon: "project", group: "Create", run: () => void ws.newProject() },
    { title: "Go to: Project Overview", icon: "overview", group: "Go to", run: () => ws.openTab("overview", null) },
    { title: "Go to: Settings", icon: "settings", group: "Go to", run: () => ws.openTab("settings", null) },
    { title: "Open Terminal", icon: "terminal", group: "Go to", hint: "⌃`", run: () => ws.openDock("terminal") },
    { title: "Open Source Control", icon: "git", group: "Go to", run: () => ws.openDock("git") },
    { title: "Open AI Agents", icon: "agents", group: "Go to", run: () => ws.activateSide("agents") },
    { title: "Toggle side panel", icon: "sidebar", group: "View", hint: "⌘B", run: () => ws.toggleSide() },
    { title: "Toggle bottom panel", icon: "panelBottom", group: "View", hint: "⌘J", run: () => ws.toggleDock() },
    { title: "Toggle preview panel", icon: "eye", group: "View", hint: "⌥⌘B", run: () => ws.toggleRight() },
    { title: "Split editor", icon: "split", group: "View", hint: "⌘\\", run: () => ws.splitActive() },
    { title: "Toggle light/dark theme", icon: "palette", group: "View", run: () => store.setSetting({ theme: store.settings().theme === "dark" ? "light" : "dark" }) },
    { title: "Export workspace (JSON)", icon: "download", group: "Data", run: () => { downloadText("synapse-export.json", store.exportAll()); ws.toast("Exported", "ok"); } },
    {
      title: "Reset workspace…",
      icon: "trash",
      group: "Data",
      run: async () => {
        if (await ws.confirm("Delete everything and reseed the demo workspace?", { title: "Reset", okText: "Reset", danger: true })) store.reset();
      },
    },
    ...store.projects().map((p) => ({ title: "Switch to project: " + p.name, icon: "project" as IconName, group: "Projects", run: () => store.setActiveProject(p.id) })),
  ];

  const toResult = (r: { kind: string; id: string; title: string; idx: number[]; snippet?: string; projectId: string | null }): Result => ({
    type: "item",
    kind: r.kind,
    title: r.title,
    idx: r.idx,
    snippet: r.snippet,
    projectId: r.projectId,
    icon: r.kind === "project" ? "project" : KINDS[r.kind as Kind]?.icon ?? "file",
    run: () => (r.kind === "project" ? store.setActiveProject(r.id) : ws.open(r.kind, r.id)),
  });

  const compute = (q: string): { results: Result[]; hint: string } => {
    const mode = q[0] === ">" ? "cmd" : q[0] === "#" ? "tag" : "search";
    const term = q.replace(/^[>#]/, "").trim();
    if (mode === "cmd") {
      const matched = commands
        .map((c) => ({ c, f: term ? fuzzy(term, c.title) : { score: 0, idx: [] } }))
        .filter((x): x is { c: Command; f: { score: number; idx: number[] } } => !!x.f)
        .sort((a, b) => b.f.score - a.f.score);
      return {
        results: matched.map((x) => ({ type: "cmd", title: x.c.title, idx: x.f.idx, icon: x.c.icon, hint: x.c.hint, group: x.c.group, run: x.c.run })),
        hint: "Commands · ↑↓ to navigate · ↵ to run · esc to close",
      };
    }
    if (mode === "tag") {
      const tags = store.allTags("all").filter((t) => !term || t.tag.includes(term.toLowerCase()));
      if (term && tags.length) {
        const tag = tags[0].tag;
        return { results: store.search("", { tag }).map(toResult), hint: `Items tagged #${tag}` };
      }
      return {
        results: tags.map((t) => ({ type: "tag", title: "#" + t.tag, idx: [], icon: "tag", hint: String(t.count), run: () => setQuery("#" + t.tag) })),
        hint: "Pick a tag",
      };
    }
    if (!term) {
      const rec = store.recent("all", 8).map((r) => toResult({ kind: r.kind, id: r.o.id, title: store.titleOf(r.kind, r.o), snippet: "recent", idx: [], projectId: r.o.projectId }));
      return { results: rec, hint: "Recent · type to search everything · > for commands" };
    }
    const list = store.search(term, { pid: "all" }).map(toResult);
    return { results: list, hint: `${list.length} ${pluralize(list.length, "result")}` };
  };

  const { results, hint } = compute(query);
  const safeActive = Math.min(active, Math.max(0, results.length - 1));

  const choose = (r?: Result) => {
    if (!r) return;
    closePalette();
    setTimeout(() => r.run(), 0);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      closePalette();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(results.length - 1, a + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      choose(results[safeActive]);
    } else if (e.key === "Tab") {
      e.preventDefault();
      setQuery((q) => (q.startsWith(">") ? q : ">" + q.replace(/^[>#]/, "")));
    }
  };

  let lastGroup: string | null = null;

  return (
    <div className={s.overlay} onMouseDown={(e) => e.target === e.currentTarget && closePalette()}>
      <div className={s.palette} role="dialog" aria-modal="true" aria-label="Command palette">
        <div className={s.inputwrap}>
          <Icon name="search" />
          <input
            ref={inputRef}
            className={s.input}
            type="text"
            autoComplete="off"
            spellCheck={false}
            placeholder="Search files, chats, notes…  Type > for commands, # for tags"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={onKey}
          />
        </div>
        <div className={s.list} ref={listRef} role="listbox">
          {!results.length ? (
            <div className={s.empty}>No matches</div>
          ) : (
            results.map((r, i) => {
              const g = r.group || (r.type === "item" ? (r.kind === "project" ? "Projects" : (KINDS[r.kind as Kind]?.label ?? "") + "s") : r.type === "tag" ? "Tags" : "");
              const showGroup = g && g !== lastGroup;
              if (showGroup) lastGroup = g;
              const proj = r.projectId ? store.project(r.projectId) : null;
              return (
                <div key={i}>
                  {showGroup && <div className={s.group}>{g}</div>}
                  <div
                    className={`${s.item} ${i === safeActive ? s.itemActive : ""}`}
                    role="option"
                    aria-selected={i === safeActive}
                    onMouseMove={() => i !== safeActive && setActive(i)}
                    onClick={() => choose(r)}
                  >
                    <span className={s.ico}>{isIconName(r.icon) ? <Icon name={r.icon} /> : r.icon}</span>
                    <span className={s.main}>
                      <span className={s.title}>{hi(r.title, r.idx)}</span>
                      {r.snippet && <span className={s.snippet}>{r.snippet}</span>}
                    </span>
                    {proj && r.kind !== "project" && (
                      <span className={s.proj}>
                        <Swatch color={PROJECT_COLORS[proj.color]} />
                        <span>{proj.name}</span>
                      </span>
                    )}
                    {r.hint && <Kbd>{r.hint}</Kbd>}
                  </div>
                </div>
              );
            })
          )}
        </div>
        <div className={s.hint}>{hint}</div>
      </div>
    </div>
  );
}
