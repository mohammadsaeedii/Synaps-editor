"use client";
import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import { IconButton } from "@/components/atoms/IconButton/IconButton";
import { EmptyState } from "@/components/molecules/EmptyState/EmptyState";
import { PanelHeader } from "@/components/molecules/PanelHeader/PanelHeader";
import { Icon } from "@/design/icons";
import { md } from "@/lib/markdown";
import { useItemActions } from "@/lib/item-actions";
import { store, useStoreVersion } from "@/lib/store/store";
import { cx } from "@/lib/utils";
import { useWorkspace } from "@/lib/workspace";
import s from "./FilesPanel.module.css";

const LANGS = ["text", "markdown", "javascript", "typescript", "json", "css", "html", "python"];

export function FilesPanel({ fileId }: { fileId: string }) {
  useStoreVersion();
  const { openMenu, openRight } = useWorkspace();
  const { itemMenuItems } = useItemActions();
  const file = store.get("file", fileId);
  const [text, setText] = useState(file?.content ?? "");
  const gutterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setText(store.get("file", fileId)?.content ?? "");
  }, [fileId]);

  if (!file) return <EmptyState icon="file" title="File not found" sub="It may have been deleted." />;

  const change = (v: string) => {
    setText(v);
    store.update("file", fileId, { content: v }, { silent: true });
  };

  const lines = text.split("\n").length;
  const gutter = Array.from({ length: lines }, (_, i) => i + 1).join("\n");

  const preview = () => {
    if (file.language === "markdown") openRight(<div className="md" style={{ padding: 22 }} dangerouslySetInnerHTML={{ __html: md(text) }} />, "Preview");
    else if (file.language === "html") openRight(<iframe title="preview" srcDoc={text} sandbox="" style={{ width: "100%", height: "100%", border: 0, background: "var(--surface)" }} />, "Preview");
    else openRight(<pre style={{ padding: 16, margin: 0, fontFamily: "var(--mono)", fontSize: 12.5, whiteSpace: "pre-wrap" }}>{text}</pre>, "Preview");
  };

  const langMenu = (e: ReactMouseEvent<HTMLButtonElement>) => {
    openMenu(
      LANGS.map((l) => ({ label: l, check: file.language === l, onClick: () => store.update("file", fileId, { language: l }, { silent: true }) })),
      e.currentTarget,
    );
  };

  return (
    <div className={s.root}>
      <PanelHeader
        title={file.name}
        editableTitle
        onTitle={(v) => v.trim() && store.update("file", fileId, { name: v.trim() })}
        actions={
          <>
            <button type="button" className={s.lang} title="Language" onClick={langMenu}>
              <span className={s.langIco}>
                <Icon name="code" />
              </span>
              <span>{file.language}</span>
            </button>
            <IconButton icon="eye" title="Preview" onClick={preview} />
            <IconButton icon={file.favorite ? "starFill" : "star"} active={file.favorite} title="Favorite" onClick={() => store.toggleFav("file", fileId)} />
            <IconButton icon={file.pinned ? "pin" : "pinOutline"} active={file.pinned} title="Pin" onClick={() => store.togglePin("file", fileId)} />
            <IconButton icon="more" title="More" onClick={(e) => openMenu(itemMenuItems("file", fileId), e.currentTarget)} />
          </>
        }
      />
      <div className={s.editor}>
        <div className={s.gutter} ref={gutterRef} aria-hidden="true">
          {gutter}
        </div>
        <textarea
          className={s.code}
          spellCheck={false}
          value={text}
          onChange={(e) => change(e.target.value)}
          onScroll={(e) => {
            if (gutterRef.current) gutterRef.current.scrollTop = e.currentTarget.scrollTop;
          }}
        />
      </div>
      <div className={s.status}>
        <span className={s.statusLang}>{file.language}</span>
        <span className={s.sep}>·</span>
        <span>
          {lines} {lines === 1 ? "line" : "lines"}
        </span>
        <span className={s.sep}>·</span>
        <span>{text.length} chars</span>
      </div>
    </div>
  );
}
