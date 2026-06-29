"use client";
import { Icon } from "@/design/icons";
import { SIDE_VIEWS } from "@/lib/panels";
import { useStore } from "@/lib/store/store";
import { cx } from "@/lib/utils";
import { useWorkspace } from "@/lib/workspace";
import s from "./ActivityBar.module.css";

export function ActivityBar() {
  const { activateSide, openTab } = useWorkspace();
  const sideView = useStore((st) => st.session.sideView);
  const sideOpen = useStore((st) => st.session.sideOpen);

  return (
    <nav className={s.activitybar} aria-label="Activity">
      <div className={s.group}>
        {SIDE_VIEWS.map((v) => (
          <button
            key={v.id}
            type="button"
            className={cx(s.btn, sideView === v.id && sideOpen && s.active)}
            title={v.title + (v.hint ? ` (${v.hint})` : "")}
            aria-label={v.title}
            onClick={() => activateSide(v.id)}
          >
            <Icon name={v.icon} />
          </button>
        ))}
      </div>
      <div className={s.group}>
        <button type="button" className={s.btn} title="Settings" aria-label="Settings" onClick={() => openTab("settings", null)}>
          <Icon name="settings" />
        </button>
      </div>
    </nav>
  );
}
