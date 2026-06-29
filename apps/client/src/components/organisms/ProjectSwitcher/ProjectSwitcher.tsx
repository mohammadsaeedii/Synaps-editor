"use client";
import type { MouseEvent as ReactMouseEvent } from "react";
import { Icon } from "@/design/icons";
import { Swatch } from "@/components/atoms/Swatch/Swatch";
import { PROJECT_COLORS } from "@/lib/store/kinds";
import { store, useStoreVersion } from "@/lib/store/store";
import type { MenuItem } from "@/lib/ui-types";
import { useWorkspace } from "@/lib/workspace";
import s from "./ProjectSwitcher.module.css";

export function ProjectSwitcher() {
  useStoreVersion();
  const { openMenu, openTab, newProject } = useWorkspace();
  const p = store.activeProject();

  const onClick = (e: ReactMouseEvent<HTMLButtonElement>) => {
    const items: MenuItem[] = store.projects().map((pr) => ({
      label: pr.name,
      icon: <Swatch color={PROJECT_COLORS[pr.color]} />,
      check: pr.id === store.getState().ui.activeProjectId,
      onClick: () => store.setActiveProject(pr.id),
    }));
    items.push(
      { sep: true },
      { label: "New project…", icon: "plus", onClick: () => void newProject() },
      { label: "Manage in Overview", icon: "overview", onClick: () => openTab("overview", null) },
    );
    openMenu(items, e.currentTarget);
  };

  return (
    <button type="button" className={s.projswitch} title="Switch project" onClick={onClick}>
      <span className={s.dot} style={{ background: PROJECT_COLORS[p?.color ?? ""] || "#888" }} />
      <span className={s.name}>{p?.name || "No project"}</span>
      <span className={s.chev}>
        <Icon name="chevronDown" />
      </span>
    </button>
  );
}
