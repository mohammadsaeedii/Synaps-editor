"use client";
import { useEffect, useState } from "react";
import { IconButton } from "@/components/atoms/IconButton/IconButton";
import { EmptyState } from "@/components/molecules/EmptyState/EmptyState";
import { PanelHeader } from "@/components/molecules/PanelHeader/PanelHeader";
import { Segmented } from "@/components/molecules/Segmented/Segmented";
import { TagChips } from "@/components/molecules/TagChips/TagChips";
import { Icon } from "@/design/icons";
import { useItemActions } from "@/lib/item-actions";
import { store, useStoreVersion } from "@/lib/store/store";
import type { Memory } from "@/lib/store/types";
import { fmtRelative } from "@/lib/utils";
import { useWorkspace } from "@/lib/workspace";
import s from "./MemoryPanel.module.css";

export function MemoryPanel({ memoryId }: { memoryId: string }) {
  useStoreVersion();
  const { openMenu } = useWorkspace();
  const { itemMenuItems, editTags } = useItemActions();
  const mem = store.get("memory", memoryId);
  const [text, setText] = useState(mem?.body ?? "");

  useEffect(() => {
    setText(store.get("memory", memoryId)?.body ?? "");
  }, [memoryId]);

  if (!mem) return <EmptyState icon="memory" title="Memory not found" sub="It may have been deleted." />;

  const change = (v: string) => {
    setText(v);
    store.update("memory", memoryId, { body: v }, { silent: true });
  };

  return (
    <div className={s.root}>
      <PanelHeader
        title={mem.title}
        editableTitle
        onTitle={(v) => v.trim() && store.update("memory", memoryId, { title: v.trim() })}
        actions={
          <>
            <Segmented<Memory["scope"]>
              options={[
                { value: "project", label: "Project" },
                { value: "global", label: "Global" },
              ]}
              value={mem.scope}
              onChange={(v) => store.update("memory", memoryId, { scope: v })}
            />
            <IconButton icon={mem.favorite ? "starFill" : "star"} active={mem.favorite} title="Favorite" onClick={() => store.toggleFav("memory", memoryId)} />
            <IconButton icon={mem.pinned ? "pin" : "pinOutline"} active={mem.pinned} title="Pin" onClick={() => store.togglePin("memory", memoryId)} />
            <IconButton icon="tag" title="Tags" onClick={() => editTags("memory", memoryId)} />
            <IconButton icon="more" title="More" onClick={(e) => openMenu(itemMenuItems("memory", memoryId), e.currentTarget)} />
          </>
        }
      />
      <div className={s.scroll}>
        <div className={s.doc}>
          <p className={s.hint}>
            <Icon name="info" />
            <span>Memory cards feed the AI persistent context for this project.</span>
          </p>
          <div className={s.card}>
            {mem.tags.length > 0 && <TagChips tags={mem.tags} onRemove={(t) => store.setTags("memory", memoryId, mem.tags.filter((x) => x !== t))} />}
            <textarea className={s.editor} placeholder="What should the AI always remember?" value={text} onChange={(e) => change(e.target.value)} />
          </div>
          <div className={s.meta}>
            <Icon name="clock" />
            <span>
              Scope: {mem.scope} · updated {fmtRelative(mem.updatedAt)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
