"use client";
import { IconButton } from "@/components/atoms/IconButton/IconButton";
import { Icon } from "@/design/icons";
import { DOCK_PANELS } from "@/lib/panels";
import { useStore } from "@/lib/store/store";
import { cx } from "@/lib/utils";
import { useWorkspace } from "@/lib/workspace";
import { renderDockPanel } from "@/components/organisms/panels/registry";
import s from "./BottomDock.module.css";

export function BottomDock() {
  const { openDock, toggleDock } = useWorkspace();
  const dockTab = useStore((st) => st.session.dockTab);
  const dockHeight = useStore((st) => st.session.dockHeight);

  return (
    <div className={s.dock} style={{ height: dockHeight }}>
      <div className={s.head}>
        <div className={s.tabs}>
          {DOCK_PANELS.map((d) => (
            <button key={d.id} type="button" className={cx(s.tab, dockTab === d.id && s.tabActive)} onClick={() => openDock(d.id)}>
              <Icon name={d.icon} />
              <span>{d.title}</span>
            </button>
          ))}
        </div>
        <div className={s.actions}>
          <IconButton icon="close" size={28} iconSize={16} title="Close panel (⌘J)" onClick={() => toggleDock(false)} />
        </div>
      </div>
      <div className={s.body}>{renderDockPanel(dockTab)}</div>
    </div>
  );
}
