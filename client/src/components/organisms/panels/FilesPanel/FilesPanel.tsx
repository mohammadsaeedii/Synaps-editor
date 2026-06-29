"use client";
import { useEffect, useRef, useState, useCallback, type MouseEvent as ReactMouseEvent } from "react";
import { IconButton } from "@/components/atoms/IconButton/IconButton";
import { EmptyState } from "@/components/molecules/EmptyState/EmptyState";
import { MonacoEditor } from "@/components/molecules/MonacoEditor/MonacoEditor";
import { PanelHeader } from "@/components/molecules/PanelHeader/PanelHeader";
import { Icon } from "@/design/icons";
import { dataUrl, detectFileType, isBinaryCategory } from "@/lib/files/file-types";
import { diagnosticsService } from "@/lib/engine";
import { useEngineEvent } from "@/lib/engine/hooks";
import { md } from "@/lib/markdown";
import { useItemActions } from "@/lib/item-actions";
import { store, useStoreVersion } from "@/lib/store/store";
import { cx } from "@/lib/utils";
import { useWorkspace } from "@/lib/workspace";
import s from "./FilesPanel.module.css";

const LANGS = ["plaintext", "markdown", "javascript", "typescript", "json", "css", "html", "python", "go", "rust", "java", "php", "ruby", "sql", "yaml", "xml", "scss", "less", "shell", "csharp", "kotlin", "swift", "dart", "c", "cpp"];

export function FilesPanel({ fileId }: { fileId: string }) {
  useStoreVersion();
  useEngineEvent("DiagnosticsChanged");
  const { openMenu, openRight } = useWorkspace();
  const { itemMenuItems } = useItemActions();
  const file = store.get("file", fileId);
  const [text, setText] = useState(file?.content ?? "");

  useEffect(() => {
    setText(store.get("file", fileId)?.content ?? "");
  }, [fileId]);

  const change = useCallback(
    (v: string) => {
      setText(v);
      store.update("file", fileId, { content: v }, { silent: true });
    },
    [fileId],
  );

  if (!file) return <EmptyState icon="file" title="File not found" sub="It may have been deleted." />;

  const typeInfo = detectFileType(file.name);
  const encoding = file.encoding ?? "text";
  const mime = file.mimeType || typeInfo.mimeType;
  const isBinary = encoding === "base64" || isBinaryCategory(typeInfo.category);
  const canEdit = typeInfo.editable && encoding === "text";
  const isImage = typeInfo.category === "image" && encoding === "base64";
  const isPdf = file.name.toLowerCase().endsWith(".pdf") && encoding === "base64";

  const lines = canEdit ? text.split("\n").length : 0;
  const fileDiags = diagnosticsService.getForFile(fileId);
  const errors = fileDiags.filter((d) => d.severity === "error").length;
  const warnings = fileDiags.filter((d) => d.severity === "warning").length;

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

  const renderBody = () => {
    if (isImage) {
      return (
        <div className={s.preview}>
          <img src={dataUrl("base64", mime, file.content)} alt={file.name} className={s.previewImg} />
        </div>
      );
    }
    if (isPdf) {
      return (
        <div className={s.preview}>
          <iframe title={file.name} src={dataUrl("base64", mime, file.content)} className={s.previewPdf} />
        </div>
      );
    }
    if (isBinary && !canEdit) {
      return (
        <div className={s.unsupported}>
          <Icon name="file" size={40} />
          <p>This file type cannot be edited.</p>
        </div>
      );
    }
    return <MonacoEditor fileId={fileId} value={text} language={file.language || typeInfo.language} onChange={change} className={s.monaco} />;
  };

  return (
    <div className={s.root}>
      <PanelHeader
        title={file.name}
        editableTitle
        onTitle={(v) => v.trim() && store.update("file", fileId, { name: v.trim() })}
        actions={
          <>
            {canEdit && (
              <button type="button" className={s.lang} title="Language" onClick={langMenu}>
                <span className={s.langIco}>
                  <Icon name="code" />
                </span>
                <span>{file.language}</span>
              </button>
            )}
            {canEdit && <IconButton icon="eye" title="Preview" onClick={preview} />}
            <IconButton icon={file.favorite ? "starFill" : "star"} active={file.favorite} title="Favorite" onClick={() => store.toggleFav("file", fileId)} />
            <IconButton icon={file.pinned ? "pin" : "pinOutline"} active={file.pinned} title="Pin" onClick={() => store.togglePin("file", fileId)} />
            <IconButton icon="more" title="More" onClick={(e) => openMenu(itemMenuItems("file", fileId), e.currentTarget)} />
          </>
        }
      />
      <div className={cx(s.editor, !canEdit && s.editorPreview)}>{renderBody()}</div>
      {canEdit && (
        <div className={s.status}>
          <span className={s.statusLang}>{file.language}</span>
          <span className={s.sep}>·</span>
          <span>
            {lines} {lines === 1 ? "line" : "lines"}
          </span>
          <span className={s.sep}>·</span>
          <span>{text.length} chars</span>
          {(errors > 0 || warnings > 0) && (
            <>
              <span className={s.sep}>·</span>
              <span className={errors > 0 ? s.diagError : s.diagWarn}>
                {errors > 0 ? `${errors} error${errors === 1 ? "" : "s"}` : ""}
                {errors > 0 && warnings > 0 ? ", " : ""}
                {warnings > 0 ? `${warnings} warning${warnings === 1 ? "" : "s"}` : ""}
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
