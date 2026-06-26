"use client";
import type { MouseEvent as ReactMouseEvent } from "react";
import { Icon } from "@/design/icons";
import { StatusItem } from "@/components/molecules/StatusItem/StatusItem";
import { isLive, statusText } from "@/lib/ai";
import { PROJECT_COLORS } from "@/lib/store/kinds";
import { store, useStoreVersion } from "@/lib/store/store";
import type { MenuItem } from "@/lib/ui-types";
import { cx } from "@/lib/utils";
import { useWorkspace } from "@/lib/workspace";
import s from "./StatusBar.module.css";

function modelShort(m: string): string {
  return (m || "")
    .replace("claude-", "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace("Opus 4 8", "Opus 4.8")
    .replace("Sonnet 4 6", "Sonnet 4.6")
    .replace("Haiku 4 5", "Haiku 4.5");
}

export function StatusBar() {
  useStoreVersion();
  const { openTab, openDock, openPalette, openMenu } = useWorkspace();
  const p = store.activeProject();
  const g = p ? store.getState().git[p.id] : null;
  const branch = g?.branch || "main";
  const dirty = (g?.working || []).length;
  const live = isLive();

  const projMenu = (e: ReactMouseEvent<HTMLButtonElement>) => {
    const items: MenuItem[] = store.projects().map((pr) => ({
      label: pr.name,
      check: pr.id === p?.id,
      onClick: () => store.setActiveProject(pr.id),
    }));
    openMenu(items, e.currentTarget);
  };

  return (
    <footer className={s.statusbar}>
      <StatusItem onClick={projMenu}>
        <span className={s.dot} style={{ background: PROJECT_COLORS[p?.color ?? ""] || "#888" }} />
        <span>{p?.name || "—"}</span>
      </StatusItem>
      <StatusItem title="Git" onClick={() => openDock("git")}>
        <Icon name="branch" />
        <span>{branch}</span>
        {dirty ? <span className={s.badge}>{dirty}</span> : null}
      </StatusItem>
      <div className={s.spacer} />
      <StatusItem title="Smoke status">
        <Icon name="check" />
        <span>ready</span>
      </StatusItem>
      <StatusItem className={cx(live ? s.live : s.mock)} title="AI engine — open Settings" onClick={() => openTab("settings", null)}>
        <span className={s.statusdot} />
        <span>{statusText()}</span>
      </StatusItem>
      <StatusItem title="Model" onClick={() => openTab("settings", null)}>
        <Icon name="cpu" />
        <span>{modelShort(store.settings().model)}</span>
      </StatusItem>
      <StatusItem title="Command palette" onClick={() => openPalette("")}>
        <Icon name="command" />
        <span>⌘K</span>
      </StatusItem>
    </footer>
  );
}
