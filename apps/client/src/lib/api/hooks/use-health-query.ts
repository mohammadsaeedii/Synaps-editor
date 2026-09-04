"use client";

import { useQuery } from "@tanstack/react-query";
import { healthQueryOptions } from "../queries/health";

/** Backend readiness + whether the server has ANTHROPIC_API_KEY configured. */
export function useHealthQuery() {
  return useQuery(healthQueryOptions);
}
