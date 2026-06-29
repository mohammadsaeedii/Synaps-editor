import type { ReactNode } from "react";
import s from "./Field.module.css";

export interface FieldProps {
  label: string;
  hint?: string;
  children: ReactNode;
}

/** A stacked label + control + hint. Mirrors the original `.field`. */
export function Field({ label, hint, children }: FieldProps) {
  return (
    <label className={s.field}>
      <span className={s.label}>{label}</span>
      {children}
      {hint && <span className={s.hint}>{hint}</span>}
    </label>
  );
}
