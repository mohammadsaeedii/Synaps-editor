import type { ReactNode } from "react";

/** A keyboard hint. Styling lives in the global `kbd` base rule. */
export function Kbd({ children, className }: { children: ReactNode; className?: string }) {
  return <kbd className={className}>{children}</kbd>;
}
