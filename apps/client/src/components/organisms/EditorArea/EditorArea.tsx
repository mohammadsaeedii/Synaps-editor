"use client";
import { Fragment } from "react";
import { Button } from "@/components/atoms/Button/Button";
import { IconButton } from "@/components/atoms/IconButton/IconButton";
import { FileIcon } from "@/components/molecules/FileIcon/FileIcon";
import { Icon, type IconName } from "@/design/icons";
import { PANEL_META, tabKey } from "@/lib/panels";
import { store, useStore } from "@/lib/store/store";
import { cx } from "@/lib/utils";
import { useWorkspace } from "@/lib/workspace";
import { renderPanel } from "../panels/registry";
import s from "./EditorArea.module.css";

export function EditorArea() {
  const { closeTab, closeOthers, setActiveTab, focusGroup, splitActive, closeGroup, newChat, newItem, pickFiles, openTab, openMenu } = useWorkspace();
  const groups = useStore((st) => st.session.groups) ?? [{ active: -1, tabs: [] }];
  const activeGroup = useStore((st) => st.session.activeGroup);

  const tabTitle = (panel: string, refId: string | null): string => {
    const m = PANEL_META[panel];
    if (!m) return panel;
    if (m.single) return m.title;
    const o = m.kind ? store.get(m.kind, refId) : null;
    return o ? store.titleOf(m.kind!, o) : m.title;
  };
  const tabIcon = (panel: string, refId: string | null): IconName | "file-icon" => {
    if (panel === "file" && refId) {
      const f = store.get("file", refId);
      if (f) return "file-icon";
    }
    return PANEL_META[panel]?.icon ?? "file";
  };
  const tabFileName = (panel: string, refId: string | null): string | null => {
    if (panel !== "file" || !refId) return null;
    return store.get("file", refId)?.name ?? null;
  };

  return (
    <div className={s.stack}>
      {groups.map((g, gi) => (
        <Fragment key={gi}>
          <div className={cx(s.group, gi === activeGroup && groups.length > 1 && s.groupFocused)} onMouseDown={() => focusGroup(gi)}>
            <div className={s.tabbar} role="tablist">
              {g.tabs.map((t, ti) => {
                const id = tabKey(t.panel, t.refId);
                const active = ti === g.active;
                return (
                  <div
                    key={id}
                    role="tab"
                    aria-selected={active}
                    className={cx(s.tab, active && s.tabActive)}
                    title={tabTitle(t.panel, t.refId)}
                    onClick={() => setActiveTab(gi, ti)}
                    onAuxClick={(e) => {
                      if (e.button === 1) {
                        e.preventDefault();
                        closeTab(id);
                      }
                    }}
                    onContextMenu={(e) =>
                      openMenu(
                        [
                          { label: "Close", icon: "close", hint: "⌘W", onClick: () => closeTab(id) },
                          { label: "Close others", onClick: () => closeOthers(id) },
                          { sep: true },
                          { label: groups.length < 2 ? "Split editor" : "Editor groups", icon: "split", onClick: () => splitActive() },
                        ],
                        e,
                      )
                    }
                  >
                    <span className={s.tabIcon}>
                      {tabIcon(t.panel, t.refId) === "file-icon" && tabFileName(t.panel, t.refId) ? (
                        <FileIcon filename={tabFileName(t.panel, t.refId)!} size={14} />
                      ) : (
                        <Icon name={tabIcon(t.panel, t.refId) as IconName} />
                      )}
                    </span>
                    <span className={s.tabLabel}>{tabTitle(t.panel, t.refId)}</span>
                    <button
                      type="button"
                      className={s.tabClose}
                      aria-label="Close"
                      onClick={(e) => {
                        e.stopPropagation();
                        closeTab(id);
                      }}
                    >
                      <Icon name="close" />
                    </button>
                  </div>
                );
              })}
              <div className={s.tabActions}>
                <IconButton icon="split" size={28} iconSize={16} title="Split editor (⌘\)" onClick={() => splitActive()} />
                {groups.length > 1 && <IconButton icon="close" size={28} iconSize={16} title="Close group" onClick={() => closeGroup(gi)} />}
              </div>
            </div>

            <div className={s.groupbody}>
              {g.tabs.length ? (
                g.tabs.map((t, ti) => {
                  const id = tabKey(t.panel, t.refId);
                  return (
                    <div key={id} className={s.mount} style={{ display: ti === g.active ? "flex" : "none" }}>
                      {renderPanel(t.panel, t.refId)}
                    </div>
                  );
                })
              ) : (
                <div className={s.groupEmpty}>
                  <div className={s.groupEmptyMark}>
                    <Icon name="sparkle" size={40} />
                  </div>
                  <p>Open a file, chat or note — or press ⌘K.</p>
                  <div className={s.groupEmptyRow}>
                    <Button icon="chat" onClick={() => newChat()}>
                      New chat
                    </Button>
                    <Button icon="notes" onClick={() => newItem("note")}>
                      New note
                    </Button>
                    <Button icon="file" onClick={() => pickFiles()}>
                      Add file
                    </Button>
                    <Button icon="overview" onClick={() => openTab("overview", null)}>
                      Open overview
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
          {gi < groups.length - 1 && <div className={s.divider} />}
        </Fragment>
      ))}
    </div>
  );
}
