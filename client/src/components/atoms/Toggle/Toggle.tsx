import { cx } from "@/lib/utils";
import s from "./Toggle.module.css";

export interface ToggleProps {
  on: boolean;
  onChange: (next: boolean) => void;
  className?: string;
  "aria-label"?: string;
}

/** An iOS-style switch. Mirrors the original `.toggle`. */
export function Toggle({ on, onChange, className, "aria-label": ariaLabel }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={ariaLabel}
      className={cx(s.toggle, on && s.on, className)}
      onClick={() => onChange(!on)}
    >
      <span className={s.knob} />
    </button>
  );
}
