import { Button } from "@/components/atoms/Button/Button";
import { Icon, isIconName, type IconName } from "@/design/icons";
import type { ReactNode } from "react";
import s from "./EmptyState.module.css";

export interface EmptyStateProps {
  icon?: IconName | ReactNode;
  title: string;
  sub?: string;
  action?: { label: string; icon?: IconName; onClick: () => void };
}

/** The centred "nothing here yet" block. Mirrors `.empty`. */
export function EmptyState({ icon = "sparkle", title, sub, action }: EmptyStateProps) {
  return (
    <div className={s.empty}>
      <div className={s.mark}>{isIconName(icon) ? <Icon name={icon} /> : icon}</div>
      <h3>{title}</h3>
      {sub && <p>{sub}</p>}
      {action && (
        <Button variant="primary" icon={action.icon} onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
