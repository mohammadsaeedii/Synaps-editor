import type { ReactNode } from "react";
import { cx } from "@/lib/utils";
import s from "./PanelHeader.module.css";

export interface PanelHeaderProps {
  title: string;
  sub?: string;
  editableTitle?: boolean;
  onTitle?: (value: string) => void;
  actions?: ReactNode;
  className?: string;
}

/** The 44px editor-panel header: (editable) title + a row of actions. `.phead`. */
export function PanelHeader({ title, sub, editableTitle, onTitle, actions, className }: PanelHeaderProps) {
  return (
    <div className={cx(s.phead, className)}>
      <div className={s.left}>
        {editableTitle ? (
          <input
            key={title}
            className={s.titleInput}
            defaultValue={title}
            aria-label="Title"
            onBlur={(e) => onTitle?.(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
            }}
          />
        ) : (
          <div className={s.title}>{title}</div>
        )}
        {sub && <div className={s.sub}>{sub}</div>}
      </div>
      <div className={s.actions}>{actions}</div>
    </div>
  );
}
