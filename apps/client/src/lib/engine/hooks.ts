"use client";
import { useEffect, useState } from "react";
import { eventBus, runtimeManager, type EngineEventType } from "@/lib/engine";

/** Subscribe to engine events and trigger re-render. */
export function useEngineEvent(...types: EngineEventType[]): number {
  const key = types.join(",");
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const subs = types.map((t) => eventBus.on(t, () => setTick((n) => n + 1)));
    return () => subs.forEach((s) => s.unsubscribe());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return tick;
}

/** Subscribe to runtime state changes for a project. */
export function useRuntimeState(projectId?: string | null): string {
  const [state, setState] = useState("idle");

  useEffect(() => {
    if (projectId) setState(runtimeManager.getState(projectId));
    const sub = runtimeManager.subscribeState((s, pid) => {
      if (!projectId || projectId === pid) setState(s);
    });
    return () => sub.unsubscribe();
  }, [projectId]);

  return state;
}
