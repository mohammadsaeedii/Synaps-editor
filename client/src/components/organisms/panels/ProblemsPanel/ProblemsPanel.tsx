"use client";
import { diagnosticsService } from "@/lib/engine";
import { useEngineEvent } from "@/lib/engine/hooks";
import { store, useStoreVersion } from "@/lib/store/store";
import { useWorkspace } from "@/lib/workspace";
import s from "./ProblemsPanel.module.css";

export function ProblemsPanel() {
  useStoreVersion();
  useEngineEvent("DiagnosticsChanged");
  const { openTab } = useWorkspace();
  const p = store.activeProject();
  const diags = p ? diagnosticsService.getForProject(p.id) : [];

  if (!diags.length) {
    return (
      <div className={s.empty}>
        <span>No problems detected in the workspace.</span>
      </div>
    );
  }

  return (
    <div className={s.root}>
      {diags.map((d) => {
        const file = store.get("file", d.fileId);
        return (
          <button
            key={d.id}
            type="button"
            className={s.row}
            onClick={() => openTab("file", d.fileId)}
          >
            <span className={d.severity === "error" ? s.err : s.warn}>{d.severity === "error" ? "⊘" : "⚠"}</span>
            <span className={s.file}>{file?.name ?? d.fileId}</span>
            <span className={s.loc}>Ln {d.line}, Col {d.column}</span>
            <span className={s.msg}>{d.message}</span>
            <span className={s.src}>{d.source}</span>
          </button>
        );
      })}
    </div>
  );
}
