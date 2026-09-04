"use client";

import { useMutation } from "@tanstack/react-query";
import { runAI, type ApiMessage, type RunOptions } from "@/lib/ai";

export type RunAIMutationInput = {
  history: ApiMessage[];
} & RunOptions;

/** React Query mutation around the shared `runAI` façade (live + mock). */
export function useRunAIMutation() {
  return useMutation({
    mutationKey: ["ai", "run"],
    mutationFn: ({ history, ...opts }: RunAIMutationInput) => runAI(history, opts),
  });
}
