import { cx } from "@/lib/utils";
import s from "./Swatch.module.css";

/** A 10×10 colour chip used in menus, the project switcher and search rows. */
export function Swatch({ color, className }: { color: string; className?: string }) {
  return <span className={cx(s.swatch, className)} style={{ background: color }} />;
}
