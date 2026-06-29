"use client";
import { useEffect, useState } from "react";
import { WorkspaceShell } from "@/components/templates/WorkspaceShell/WorkspaceShell";
import { WorkspaceProvider } from "@/lib/workspace";

/**
 * The workspace is a local-first SPA hydrated from localStorage, so it renders
 * client-only behind a mount gate (SSR emits nothing → no hydration mismatch).
 */
export default function Page() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return (
    <WorkspaceProvider>
      <WorkspaceShell />
    </WorkspaceProvider>
  );
}
