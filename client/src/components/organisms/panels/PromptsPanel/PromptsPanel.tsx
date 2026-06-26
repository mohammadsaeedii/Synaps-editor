"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/atoms/Button/Button";
import { IconButton } from "@/components/atoms/IconButton/IconButton";
import { EmptyState } from "@/components/molecules/EmptyState/EmptyState";
import { PanelHeader } from "@/components/molecules/PanelHeader/PanelHeader";
import { TagChips } from "@/components/molecules/TagChips/TagChips";
import { Icon } from "@/design/icons";
import { useItemActions } from "@/lib/item-actions";
import { store, useStoreVersion } from "@/lib/store/store";
import { copyText, fmtRelative } from "@/lib/utils";
import { useWorkspace } from "@/lib/workspace";
import s from "./PromptsPanel.module.css";

export function PromptsPanel({ promptId }: { promptId: string }) {
  useStoreVersion();
  const { openMenu, toast, usePromptItem } = useWorkspace();
  const { itemMenuItems, editTags } = useItemActions();
  const prompt = store.get("prompt", promptId);
  const [text, setText] = useState(prompt?.body ?? "");

  useEffect(() => {
    setText(store.get("prompt", promptId)?.body ?? "");
  }, [promptId]);

  if (!prompt) return <EmptyState icon="prompts" title="Prompt not found" sub="It may have been deleted." />;

  const change = (v: string) => {
    setText(v);
    store.update("prompt", promptId, { body: v }, { silent: true });
  };

  const vars = [...new Set([...text.matchAll(/\{\{\s*([\w.-]+)\s*\}\}/g)].map((m) => m[1]))];

  return (
    <div className={s.root}>
      <PanelHeader
        title={prompt.title}
        editableTitle
        onTitle={(v) => v.trim() && store.update("prompt", promptId, { title: v.trim() })}
        actions={
          <>
            <Button variant="primary" size="sm" icon="chat" onClick={() => usePromptItem(promptId)}>
              Insert into chat
            </Button>
            <IconButton icon="copy" title="Copy" onClick={() => { copyText(prompt.body); toast("Copied", "ok"); }} />
            <IconButton icon={prompt.favorite ? "starFill" : "star"} active={prompt.favorite} title="Favorite" onClick={() => store.toggleFav("prompt", promptId)} />
            <IconButton icon={prompt.pinned ? "pin" : "pinOutline"} active={prompt.pinned} title="Pin" onClick={() => store.togglePin("prompt", promptId)} />
            <IconButton icon="tag" title="Tags" onClick={() => editTags("prompt", promptId)} />
            <IconButton icon="more" title="More" onClick={(e) => openMenu(itemMenuItems("prompt", promptId), e.currentTarget)} />
          </>
        }
      />
      <div className={s.scroll}>
        <div className={s.doc}>
          {prompt.tags.length > 0 && <TagChips tags={prompt.tags} onRemove={(t) => store.setTags("prompt", promptId, prompt.tags.filter((x) => x !== t))} />}
          <textarea className={s.editor} placeholder="Write a reusable prompt. Use {{variables}} for placeholders…" value={text} onChange={(e) => change(e.target.value)} />
          {vars.length > 0 && (
            <div className={s.vars}>
              <div className={s.varsHead}>
                <Icon name="tag" /> Variables
              </div>
              <div className={s.varsList}>
                {vars.map((v) => (
                  <span key={v} className={s.var}>
                    <Icon name="code" />
                    {v}
                  </span>
                ))}
              </div>
            </div>
          )}
          <div className={s.meta}>
            <Icon name="clock" />
            <span>
              Used {prompt.uses} {prompt.uses === 1 ? "time" : "times"} · updated {fmtRelative(prompt.updatedAt)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
