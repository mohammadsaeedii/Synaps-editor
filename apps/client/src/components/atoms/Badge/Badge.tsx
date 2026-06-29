import type { HTMLAttributes } from "react";
import { cx } from "@/lib/utils";
import s from "./Badge.module.css";

export function Badge({ className, children, ...rest }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span className={cx(s.badge, className)} {...rest}>
      {children}
    </span>
  );
}
