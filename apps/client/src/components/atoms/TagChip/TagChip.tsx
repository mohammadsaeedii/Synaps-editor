import { Icon } from "@/design/icons";
import { cx } from "@/lib/utils";
import s from "./TagChip.module.css";

export interface TagChipProps {
  label: string;
  onRemove?: () => void;
  onClick?: () => void;
  className?: string;
}

/** A pill for a single `#tag`. Mirrors the original `.tagchip`. */
export function TagChip({ label, onRemove, onClick, className }: TagChipProps) {
  return (
    <span className={cx(s.chip, !onRemove && s.clickable, className)} onClick={onClick}>
      <span>{label.startsWith("#") ? label : "#" + label}</span>
      {onRemove && (
        <button
          type="button"
          className={s.x}
          aria-label="Remove tag"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          <Icon name="close" />
        </button>
      )}
    </span>
  );
}
