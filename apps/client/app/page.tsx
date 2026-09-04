"use client";
import { useEffect, useState } from "react";
import { WorkspaceShell } from "@/components/templates/WorkspaceShell/WorkspaceShell";
import { QueryProvider, WorkspaceSyncGate } from "@/lib/api";
import { WorkspaceProvider } from "@/lib/workspace";

/**
 * The workspace is a local-first SPA hydrated from the Nest API (Prisma),
 * with localStorage as an offline cache. Client-only mount gate avoids SSR mismatch.
 */
export default function Page() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return (
    <QueryProvider>
      <WorkspaceSyncGate>
        <WorkspaceProvider>
          <WorkspaceShell />
        </WorkspaceProvider>
      </WorkspaceSyncGate>
    </QueryProvider>
  );
}
