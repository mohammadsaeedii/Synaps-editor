import { cx } from "@/lib/utils";
import s from "./Dot.module.css";

export interface DotProps {
  color: string;
  size?: number;
  /** 50% for a circle, or a px radius for a rounded square. */
  radius?: number | string;
  className?: string;
}

/** A generic colour dot/square (project dots, status dots, priority dots). */
export function Dot({ color, size = 9, radius = "50%", className }: DotProps) {
  return (
    <span
      className={cx(s.dot, className)}
      style={{ background: color, width: size, height: size, borderRadius: typeof radius === "number" ? radius + "px" : radius }}
    />
  );
}
