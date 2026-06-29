import type { ButtonHTMLAttributes } from "react";
import { cx } from "@/lib/utils";
import s from "./StatusItem.module.css";

export interface StatusItemProps extends ButtonHTMLAttributes<HTMLButtonElement> {}

/** A clickable status-bar segment. Mirrors `.status__item`. */
export function StatusItem({ className, children, type = "button", ...rest }: StatusItemProps) {
  return (
    <button type={type} className={cx(s.item, className)} {...rest}>
      {children}
    </button>
  );
}
