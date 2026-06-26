import { Icon, isIconName, type IconName } from "@/design/icons";
import { cx } from "@/lib/utils";
import type { ReactNode } from "react";
import s from "./Segmented.module.css";

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  icon?: IconName | ReactNode;
}

export interface SegmentedProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

/** A segmented control (board/list, write/split/preview…). Mirrors `.segmented`. */
export function Segmented<T extends string>({ options, value, onChange, className }: SegmentedProps<T>) {
  return (
    <div className={cx(s.segmented, className)} role="tablist">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={o.value === value}
          className={cx(s.btn, o.value === value && s.on)}
          onClick={() => onChange(o.value)}
        >
          {o.icon != null && (isIconName(o.icon) ? <Icon name={o.icon} /> : o.icon)}
          <span>{o.label}</span>
        </button>
      ))}
    </div>
  );
}
