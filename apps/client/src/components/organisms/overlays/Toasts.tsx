"use client";
import { Icon, type IconName } from "@/design/icons";
import { useWorkspace } from "@/lib/workspace";
import { cx } from "@/lib/utils";
import type { ToastKind } from "@/lib/ui-types";
import s from "./Toasts.module.css";

const ICON: Record<Exclude<ToastKind, "">, IconName> = { ok: "check", err: "warn", info: "info" };

export function Toasts() {
  const { toasts } = useWorkspace();
  if (!toasts.length) return null;
  return (
    <div className={s.toasts}>
      {toasts.map((t) => (
        <div key={t.id} className={cx(s.toast, t.kind && s[t.kind])}>
          {t.kind && <Icon name={ICON[t.kind]} />}
          <span>{t.msg}</span>
        </div>
      ))}
    </div>
  );
}
