"use client";
import { useEffect, useRef } from "react";
import { Button } from "@/components/atoms/Button/Button";
import { IconButton } from "@/components/atoms/IconButton/IconButton";
import { useWorkspace } from "@/lib/workspace";
import s from "./Dialog.module.css";

export function Dialog() {
  const { dialog, resolveDialog } = useWorkspace();
  const inputRef = useRef<HTMLInputElement>(null);
  const okRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!dialog) return;
    const t = setTimeout(() => {
      if (dialog.input) {
        inputRef.current?.focus();
        inputRef.current?.select();
      } else {
        okRef.current?.focus();
      }
    }, 10);
    return () => clearTimeout(t);
  }, [dialog]);

  if (!dialog) return null;

  const cancel = () => resolveDialog(dialog.input ? null : false);
  const confirm = () => resolveDialog(dialog.input ? (inputRef.current?.value ?? "") : true);

  return (
    <div className={s.overlay} onMouseDown={(e) => e.target === e.currentTarget && cancel()}>
      <div className={s.modal} role="dialog" aria-modal="true" aria-label={dialog.title}>
        <header className={s.head}>
          <div className={s.title}>{dialog.title}</div>
          <IconButton icon="close" aria-label="Close" onClick={cancel} />
        </header>
        <div className={s.body}>
          {dialog.message && <p className={s.msg}>{dialog.message}</p>}
          {dialog.input && (
            <input
              ref={inputRef}
              className={s.input}
              type="text"
              defaultValue={dialog.value}
              placeholder={dialog.placeholder}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  resolveDialog(e.currentTarget.value);
                }
                if (e.key === "Escape") cancel();
              }}
            />
          )}
        </div>
        <footer className={s.foot}>
          <Button onClick={cancel}>Cancel</Button>
          <Button ref={okRef} variant={dialog.danger ? "danger" : "primary"} onClick={confirm}>
            {dialog.okText ?? "OK"}
          </Button>
        </footer>
      </div>
    </div>
  );
}
