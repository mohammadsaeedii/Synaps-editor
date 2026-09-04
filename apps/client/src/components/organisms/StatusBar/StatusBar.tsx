"use client";
import type { MouseEvent as ReactMouseEvent } from "react";
import { Icon } from "@/design/icons";
import { StatusItem } from "@/components/molecules/StatusItem/StatusItem";
import { useHealthQuery } from "@/lib/api";
import {
  isLive,
  modelDisplayLabel,
  modelPickerGroups,
  resolveProviderForModel,
  statusText,
} from "@/lib/ai";
import { diagnosticsService } from "@/lib/engine";
import { useEngineEvent, useRuntimeState } from "@/lib/engine/hooks";
import { PROJECT_COLORS } from "@/lib/store/kinds";
import { store, useStoreVersion } from "@/lib/store/store";
import type { MenuItem } from "@/lib/ui-types";
import { cx } from "@/lib/utils";
import { useWorkspace } from "@/lib/workspace";
import s from "./StatusBar.module.css";

function runtimeLabel(state: string): string {
  switch (state) {
    case "running": return "Running";
    case "starting": return "Starting…";
    case "stopping": return "Stopping…";
    case "restarting": return "Restarting…";
    case "error": return "Error";
    case "stopped": return "Stopped";
    default: return "Idle";
  }
}

export function StatusBar() {
  useStoreVersion();
  useEngineEvent("DiagnosticsChanged", "RuntimeStateChanged");
  const { openTab, openDock, openPalette, openMenu } = useWorkspace();
  const p = store.activeProject();
  const g = p ? store.getState().git[p.id] : null;
  const branch = g?.branch || "main";
  const dirty = (g?.working || []).length;
  const live = isLive();
  const health = useHealthQuery();
  const backendOk = health.isSuccess;
  const runtimeState = useRuntimeState(p?.id);
  const diag = p ? diagnosticsService.getSummary(p.id) : null;
  const problemCount = (diag?.errorCount ?? 0) + (diag?.warningCount ?? 0);
  const settings = store.settings();

  const projMenu = (e: ReactMouseEvent<HTMLButtonElement>) => {
    const items: MenuItem[] = store.projects().map((pr) => ({
      label: pr.name,
      check: pr.id === p?.id,
      onClick: () => store.setActiveProject(pr.id),
    }));
    openMenu(items, e.currentTarget);
  };

  const modelMenu = (e: ReactMouseEvent<HTMLButtonElement>) => {
    const items: MenuItem[] = [];
    for (const { provider, models } of modelPickerGroups()) {
      items.push({ head: provider.label });
      for (const m of models) {
        items.push({
          label: m.label,
          check: settings.model === m.id,
          onClick: () =>
            store.setSetting({
              model: m.id,
              provider: resolveProviderForModel(m.id),
            }),
        });
      }
      items.push({ sep: true });
    }
    if (items.length && items[items.length - 1].sep) items.pop();
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
      <StatusItem title="Runtime status">
        <Icon name={runtimeState === "running" ? "play" : "terminal"} />
        <span>{runtimeLabel(runtimeState)}</span>
      </StatusItem>
      <StatusItem title="Problems" onClick={() => openDock("problems")}>
        {problemCount > 0 ? (
          <>
            <Icon name="warn" />
            <span>{diag?.errorCount ?? 0}⊘ {diag?.warningCount ?? 0}⚠</span>
          </>
        ) : (
          <>
            <Icon name="check" />
            <span>0 problems</span>
          </>
        )}
      </StatusItem>
      <div className={s.spacer} />
      <StatusItem
        className={cx(live && backendOk ? s.live : s.mock)}
        title={
          backendOk
            ? "AI engine — open Settings"
            : "Backend offline — start Nest on port 3001"
        }
        onClick={() => openTab("settings", null)}
      >
        <span className={s.statusdot} />
        <span>{backendOk ? statusText() : "API offline"}</span>
      </StatusItem>
      <StatusItem title="Switch model" onClick={modelMenu}>
        <Icon name="cpu" />
        <span>{modelDisplayLabel(settings.model)}</span>
      </StatusItem>
      <StatusItem title="Command palette" onClick={() => openPalette("")}>
        <Icon name="command" />
        <span>⌘K</span>
      </StatusItem>
    </footer>
  );
}
