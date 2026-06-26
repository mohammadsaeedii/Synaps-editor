import { TagChip } from "@/components/atoms/TagChip/TagChip";
import { cx } from "@/lib/utils";
import s from "./TagChips.module.css";

export interface TagChipsProps {
  tags: string[];
  onRemove?: (tag: string) => void;
  onClick?: (tag: string) => void;
  className?: string;
}

/** A wrapping row of tag pills. Mirrors `.tagchips`. */
export function TagChips({ tags, onRemove, onClick, className }: TagChipsProps) {
  if (!tags || !tags.length) return null;
  return (
    <div className={cx(s.tagchips, className)}>
      {tags.map((t) => (
        <TagChip key={t} label={t} onRemove={onRemove ? () => onRemove(t) : undefined} onClick={onClick ? () => onClick(t) : undefined} />
      ))}
    </div>
  );
}
