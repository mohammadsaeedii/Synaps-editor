"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  getSyncError,
  getSyncStatus,
  hydrateWorkspaceFromServer,
  subscribeSync,
} from "@/lib/store/sync";

/**
 * Boots the workspace from Nest/Prisma, then renders children.
 * Falls back to localStorage if the API is offline.
 */
export function WorkspaceSyncGate({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState(getSyncStatus);

  useEffect(() => {
    let cancelled = false;
    void hydrateWorkspaceFromServer().finally(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => subscribeSync(() => setStatus(getSyncStatus())), []);

  if (!ready) {
    return (
      <div
        style={{
          display: "grid",
          placeItems: "center",
          height: "100vh",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          color: "var(--fg-muted, #888)",
          background: "var(--bg, #0e0e10)",
        }}
      >
        Syncing workspace…
      </div>
    );
  }

  return (
    <>
      {children}
      <SyncStatusPill status={status} />
    </>
  );
}

function SyncStatusPill({ status }: { status: string }) {
  if (status === "idle" || status === "synced") return null;
  const err = getSyncError();
  const label =
    status === "syncing"
      ? "Saving…"
      : status === "offline"
        ? "Offline · local only"
        : `Sync error${err ? `: ${err}` : ""}`;

  return (
    <div
      role="status"
      style={{
        position: "fixed",
        bottom: 28,
        right: 12,
        zIndex: 9999,
        padding: "6px 10px",
        borderRadius: 8,
        fontSize: 12,
        background: status === "error" ? "#3b1212" : "#1a1a1e",
        color: status === "error" ? "#f5a8a8" : "#b0b0b8",
        border: "1px solid rgba(255,255,255,0.08)",
        pointerEvents: "none",
      }}
    >
      {label}
    </div>
  );
}
