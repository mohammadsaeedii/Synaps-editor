"use client";
import { useEffect, useState } from "react";
import { IconButton } from "@/components/atoms/IconButton/IconButton";
import { EmptyState } from "@/components/molecules/EmptyState/EmptyState";
import { PanelHeader } from "@/components/molecules/PanelHeader/PanelHeader";
import { Segmented } from "@/components/molecules/Segmented/Segmented";
import { TagChips } from "@/components/molecules/TagChips/TagChips";
import { md } from "@/lib/markdown";
import { useItemActions } from "@/lib/item-actions";
import { store, useStoreVersion } from "@/lib/store/store";
import { cx } from "@/lib/utils";
import { useWorkspace } from "@/lib/workspace";
import s from "./NotesPanel.module.css";

type Mode = "write" | "split" | "preview";

export function NotesPanel({ noteId }: { noteId: string }) {
  useStoreVersion();
  const { openMenu } = useWorkspace();
  const { itemMenuItems } = useItemActions();
  const note = store.get("note", noteId);
  const [mode, setMode] = useState<Mode>("write");
  const [text, setText] = useState(note?.content ?? "");

  useEffect(() => {
    setText(store.get("note", noteId)?.content ?? "");
  }, [noteId]);

  if (!note) return <EmptyState icon="notes" title="Note not found" sub="It may have been deleted." />;

  const change = (v: string) => {
    setText(v);
    store.update("note", noteId, { content: v }, { silent: true });
  };

  const editor = () => <textarea className={s.src} placeholder="Write something…" value={text} onChange={(e) => change(e.target.value)} />;
  const preview = () => <div className={cx(s.preview, "md")} dangerouslySetInnerHTML={{ __html: md(text) }} />;

  return (
    <div className={s.root}>
      <PanelHeader
        title={note.title}
        editableTitle
        onTitle={(v) => v.trim() && store.update("note", noteId, { title: v.trim() })}
        actions={
          <>
            <Segmented<Mode>
              options={[
                { value: "write", label: "Write" },
                { value: "split", label: "Split" },
                { value: "preview", label: "Preview" },
              ]}
              value={mode}
              onChange={setMode}
            />
            <IconButton icon={note.favorite ? "starFill" : "star"} active={note.favorite} title="Favorite" onClick={() => store.toggleFav("note", noteId)} />
            <IconButton icon={note.pinned ? "pin" : "pinOutline"} active={note.pinned} title="Pin" onClick={() => store.togglePin("note", noteId)} />
            <IconButton icon="more" title="More" onClick={(e) => openMenu(itemMenuItems("note", noteId), e.currentTarget)} />
          </>
        }
      />
      {note.tags.length > 0 && (
        <div className={s.tags}>
          <TagChips tags={note.tags} onRemove={(t) => store.setTags("note", noteId, note.tags.filter((x) => x !== t))} />
        </div>
      )}
      <div className={cx(s.body, mode === "write" && s.bodyWrite, mode === "split" && s.bodySplit, mode === "preview" && s.bodyPreview)}>
        {mode === "write" && editor()}
        {mode === "preview" && preview()}
        {mode === "split" && (
          <>
            <div className={cx(s.pane, s.paneSrc)}>{editor()}</div>
            <div className={s.divider} />
            <div className={cx(s.pane, s.panePrev)}>{preview()}</div>
          </>
        )}
      </div>
    </div>
  );
}
