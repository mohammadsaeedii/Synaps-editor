"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Icon, isIconName } from "@/design/icons";
import { useWorkspace } from "@/lib/workspace";
import { clamp, cx } from "@/lib/utils";
import s from "./ContextMenu.module.css";

export function ContextMenu() {
  const { menu, closeMenu } = useWorkspace();
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number; ready: boolean }>({ left: 0, top: 0, ready: false });

  useLayoutEffect(() => {
    if (!menu || !ref.current) {
      setPos((p) => ({ ...p, ready: false }));
      return;
    }
    const m = ref.current;
    const mw = m.offsetWidth;
    const mh = m.offsetHeight;
    let x = menu.anchor.alignRight ? menu.anchor.x - mw : menu.anchor.x;
    let y = menu.anchor.y;
    x = clamp(x, 8, window.innerWidth - mw - 8);
    if (y + mh > window.innerHeight - 8) y = Math.max(8, y - mh - (menu.anchor.alignRight ? 12 : 0));
    y = clamp(y, 8, window.innerHeight - mh - 8);
    setPos({ left: x, top: y, ready: true });
  }, [menu]);

  useEffect(() => {
    if (!menu) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) closeMenu();
    };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("resize", closeMenu);
    window.addEventListener("blur", closeMenu);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("resize", closeMenu);
      window.removeEventListener("blur", closeMenu);
    };
  }, [menu, closeMenu]);

  if (!menu) return null;
  return (
    <div ref={ref} className={s.ctxmenu} style={{ left: pos.left, top: pos.top, visibility: pos.ready ? "visible" : "hidden" }} role="menu">
      {menu.items.map((it, i) => {
        if (it.sep) return <div key={i} className={s.sep} />;
        if (it.head)
          return (
            <div key={i} className={s.head}>
              {it.head}
            </div>
          );
        return (
          <button
            key={i}
            type="button"
            className={cx(s.item, it.danger && s.danger, it.disabled && s.disabled)}
            onClick={(e) => {
              e.stopPropagation();
              if (it.disabled) return;
              closeMenu();
              it.onClick?.();
            }}
          >
            <span className={s.ico}>{it.icon != null && (isIconName(it.icon) ? <Icon name={it.icon} /> : it.icon)}</span>
            <span className={s.lbl}>{it.label}</span>
            {it.check && (
              <span className={s.chk}>
                <Icon name="check" />
              </span>
            )}
            {it.hint && <kbd>{it.hint}</kbd>}
          </button>
        );
      })}
    </div>
  );
}
