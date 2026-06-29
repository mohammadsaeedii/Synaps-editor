"use client";
import type { MouseEvent as ReactMouseEvent } from "react";
import { IconButton } from "@/components/atoms/IconButton/IconButton";
import { Brand } from "@/components/molecules/Brand/Brand";
import { PaletteTrigger } from "@/components/molecules/PaletteTrigger/PaletteTrigger";
import { ProjectSwitcher } from "@/components/organisms/ProjectSwitcher/ProjectSwitcher";
import { store } from "@/lib/store/store";
import type { MenuItem } from "@/lib/ui-types";
import { useWorkspace } from "@/lib/workspace";
import s from "./TopBar.module.css";

export function TopBar() {
  const { openTab, openPalette, newChat, newItem, pickFiles, newProject, toggleSide, toggleDock, toggleRight, openMenu } = useWorkspace();

  const newMenu = (e: ReactMouseEvent<HTMLButtonElement>) => {
    const items: MenuItem[] = [
      { head: "Create" },
      { label: "Chat", icon: "chat", hint: "⌘N", onClick: () => newChat() },
      { label: "Add file…", icon: "file", onClick: () => pickFiles() },
      { label: "Blank file", icon: "file", onClick: () => newItem("file") },
      { label: "Note", icon: "notes", onClick: () => newItem("note") },
      { label: "Task", icon: "tasks", onClick: () => newItem("task") },
      { label: "Prompt", icon: "prompts", onClick: () => newItem("prompt") },
      { label: "Memory", icon: "memory", onClick: () => newItem("memory") },
      { sep: true },
      { label: "Project", icon: "project", onClick: () => void newProject() },
    ];
    openMenu(items, e.currentTarget);
  };

  const toggleTheme = () => {
    store.setSetting({ theme: store.settings().theme === "dark" ? "light" : "dark" });
  };

  return (
    <header className={s.top}>
      <div className={s.left}>
        <Brand onClick={() => openTab("overview", null)} />
        <ProjectSwitcher />
      </div>
      <PaletteTrigger onClick={() => openPalette("")} />
      <div className={s.right}>
        <IconButton icon="plus" title="New… (⌘N)" aria-label="New" onClick={newMenu} />
        <IconButton icon="sidebar" title="Toggle side panel (⌘B)" onClick={() => toggleSide()} />
        <IconButton icon="panelBottom" title="Toggle panel (⌘J)" onClick={() => toggleDock()} />
        <IconButton icon="eye" title="Toggle preview (⌥⌘B)" onClick={() => toggleRight()} />
        <IconButton icon="palette" title="Toggle theme" onClick={toggleTheme} />
      </div>
    </header>
  );
}
