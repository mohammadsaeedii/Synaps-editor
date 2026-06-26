"use client";
import { IconButton } from "@/components/atoms/IconButton/IconButton";
import { EmptyState } from "@/components/molecules/EmptyState/EmptyState";
import { useStore } from "@/lib/store/store";
import { useWorkspace } from "@/lib/workspace";
import s from "./RightPreview.module.css";

export function RightPreview() {
  const { rightPreview, toggleRight } = useWorkspace();
  const rightWidth = useStore((st) => st.session.rightWidth);

  return (
    <aside className={s.rightpanel} style={{ width: rightWidth }}>
      <div className={s.head}>
        <span className={s.title}>{rightPreview?.title ?? "Preview"}</span>
        <IconButton icon="close" title="Close preview" onClick={() => toggleRight(false)} />
      </div>
      <div className={s.body}>{rightPreview?.node ?? <EmptyState icon="eye" title="Nothing to preview" sub="Open a file's preview to see it here." />}</div>
    </aside>
  );
}
