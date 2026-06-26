"use client";
import { type CSSProperties, type MouseEvent as ReactMouseEvent, type ReactNode } from "react";
import { Icon, type IconName } from "@/design/icons";
import { fuzzy, hi } from "@/lib/fuzzy";
import { useItemActions } from "@/lib/item-actions";
import { KINDS } from "@/lib/store/kinds";
import { store, useStoreVersion } from "@/lib/store/store";
import type { AnyItem, Chat, FileItem, Folder, Kind } from "@/lib/store/types";
import type { MenuItem } from "@/lib/ui-types";
import { cx, fmtRelative } from "@/lib/utils";
import { useWorkspace } from "@/lib/workspace";
import s from "./Explorer.module.css";

const depthStyle = (d: number): CSSProperties => ({ ["--depth" as string]: String(d) }) as CSSProperties;

export function Explorer() {
  useStoreVersion();
  const { open, newChat, newItem, openMenu, openTab } = useWorkspace();
  const { itemMenuItems } = useItemActions();

  const pid = store.getState().ui.activeProjectId;
  const session = store.session();
  const xf = session.explorer ?? { groups: {}, query: "", tag: "", favOnly: false };
  const activeChatId = store.getState().ui.activeChatId;

  const setExplorer = (p: Partial<typeof xf>) => store.setSession({ explorer: { ...xf, ...p } });
  const groupOpen = (id: string, def = true) => (id in xf.groups ? xf.groups[id] : def);
  const setGroupOpen = (id: string, v: boolean) => setExplorer({ groups: { ...xf.groups, [id]: v } });

  const matches = (kind: Kind, o: AnyItem): boolean => {
    if (xf.favOnly && !o.favorite) return false;
    if (xf.tag && !(o.tags || []).includes(xf.tag)) return false;
    if (xf.query) return !!fuzzy(xf.query, store.titleOf(kind, o));
    return true;
  };

  const rowMenu = (e: ReactMouseEvent, kind: Kind, o: AnyItem, extra: MenuItem[] = []) => {
    openMenu(itemMenuItems(kind, o.id, { onOpen: () => open(kind, o.id), extra }), e);
  };

  /* ---- a leaf row ---- */
  const Leaf = ({ kind, o, depth, icon, time }: { kind: Kind; o: AnyItem; depth: number; icon?: IconName; time?: number }) => {
    const title = store.titleOf(kind, o);
    const active = activeChatId === o.id && kind === "chat";
    return (
      <div
        className={cx(s.row, active && s.rowActive)}
        style={depthStyle(depth)}
        title={title}
        onClick={() => open(kind, o.id)}
        onContextMenu={(e) => rowMenu(e, kind, o, chatMoveItems(kind, o))}
      >
        <span className={s.rowIcon}>
          <Icon name={icon ?? KINDS[kind].icon} />
        </span>
        <span className={s.rowLabel}>{xf.query ? hi(title, fuzzy(xf.query, title)?.idx ?? []) : title}</span>
        {o.pinned && (
          <span className={s.flag} title="Pinned">
            <Icon name="pin" />
          </span>
        )}
        {o.favorite && (
          <span className={cx(s.flag, s.flagFav)} title="Favorite">
            <Icon name="starFill" />
          </span>
        )}
        {time != null && <span className={s.time}>{fmtRelative(time)}</span>}
        <button
          type="button"
          className={s.more}
          aria-label="More"
          onClick={(e) => {
            e.stopPropagation();
            rowMenu(e, kind, o, chatMoveItems(kind, o));
          }}
        >
          <Icon name="more" />
        </button>
      </div>
    );
  };

  const chatMoveItems = (kind: Kind, o: AnyItem): MenuItem[] => {
    if (kind !== "chat") return [];
    const fs = store.folders(o.projectId);
    if (!fs.length) return [];
    return [
      { sep: true },
      { head: "Move to folder" },
      ...fs.map((f) => ({ label: f.name, icon: "folder" as IconName, check: (o as Chat).folderId === f.id, onClick: () => store.move("chat", o.id, { folderId: f.id }) })),
      { label: "No folder", icon: "chat" as IconName, check: !(o as Chat).folderId, onClick: () => store.move("chat", o.id, { folderId: null }) },
    ];
  };

  /* ---- a collapsible group section ---- */
  const Section = ({ id, label, count, onAdd, children }: { id: string; label: string; count?: number; onAdd?: () => void; children: ReactNode }) => {
    const isOpen = groupOpen(id);
    return (
      <div>
        <div className={s.groupHead} onClick={() => setGroupOpen(id, !isOpen)}>
          <span className={cx(s.caret, isOpen && s.caretOpen)}>
            <Icon name="chevron" />
          </span>
          <span className={s.groupLabel}>{label}</span>
          {count != null && <span className={s.count}>{count}</span>}
          {onAdd && (
            <button
              type="button"
              className={s.add}
              title={"New " + label}
              aria-label={"New " + label}
              onClick={(e) => {
                e.stopPropagation();
                onAdd();
              }}
            >
              <Icon name="plus" />
            </button>
          )}
        </div>
        {isOpen && <div className={s.groupBody}>{children}</div>}
      </div>
    );
  };

  /* ---- chats (nested folders) ---- */
  const allChats = store.byProject("chat", pid).filter((c) => !c.archived);
  const visibleChats = allChats.filter((c) => matches("chat", c));
  const sortC = (a: Chat, b: Chat) => Number(b.pinned) - Number(a.pinned) || b.updatedAt - a.updatedAt;

  const folderMenu = (e: ReactMouseEvent, f: Folder) => {
    openMenu(
      [
        { label: "New chat here", icon: "chat", onClick: () => { const c = store.create("chat", { projectId: f.projectId }); store.move("chat", c.id, { folderId: f.id }); openTab("chat", c.id); } },
        { label: "Rename", icon: "edit", onClick: () => void renameFolder(f) },
        { sep: true },
        { label: "Delete folder", icon: "trash", danger: true, onClick: () => void deleteFolder(f) },
      ],
      e,
    );
  };
  const { promptDialog, confirm } = useWorkspace();
  const renameFolder = async (f: Folder) => {
    const nm = await promptDialog("Rename folder", { value: f.name, okText: "Rename" });
    if (nm?.trim()) store.updateFolder(f.id, { name: nm.trim() });
  };
  const deleteFolder = async (f: Folder) => {
    if (await confirm(`Delete “${f.name}”? Chats inside move out.`, { title: "Delete folder", okText: "Delete", danger: true })) store.deleteFolder(f.id);
  };

  const renderFolder = (folder: Folder, depth: number): ReactNode => {
    const isOpen = folder.expanded !== false;
    const childChats = visibleChats.filter((c) => c.folderId === folder.id).sort(sortC);
    const childFolders = store.folders(pid).filter((f) => f.parentId === folder.id);
    return (
      <div key={"f" + folder.id}>
        <div
          className={cx(s.row, s.folder)}
          style={depthStyle(depth)}
          title={folder.name}
          onClick={() => store.updateFolder(folder.id, { expanded: !isOpen })}
          onContextMenu={(e) => folderMenu(e, folder)}
        >
          <span className={cx(s.caret, isOpen && s.caretOpen)}>
            <Icon name="chevron" />
          </span>
          <span className={s.rowIcon}>
            <Icon name={isOpen ? "folderOpen" : "folder"} />
          </span>
          <span className={s.rowLabel}>{folder.name}</span>
          <span className={s.count}>{childChats.length}</span>
        </div>
        {isOpen && (
          <div>
            {childFolders.map((cf) => renderFolder(cf, depth + 1))}
            {childChats.map((c) => (
              <Leaf key={c.id} kind="chat" o={c} depth={depth + 1} />
            ))}
            {!childChats.length && !childFolders.length && (
              <div className={s.empty} style={depthStyle(depth + 1)}>
                empty
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const rootFolders = store.folders(pid).filter((f) => !f.parentId);
  const rootChats = visibleChats.filter((c) => !c.folderId).sort(sortC);

  /* ---- files (nested dirs) ---- */
  const allFiles = store.byProject("file", pid);
  const renderDir = (d: FileItem, depth: number): ReactNode => {
    const isOpen = d.expanded !== false;
    const kidDirs = allFiles.filter((f) => f.dir && f.parentId === d.id).sort((a, b) => a.name.localeCompare(b.name));
    const kidFiles = allFiles.filter((f) => !f.dir && f.parentId === d.id && matches("file", f)).sort((a, b) => a.name.localeCompare(b.name));
    return (
      <div key={"d" + d.id}>
        <div
          className={cx(s.row, s.folder)}
          style={depthStyle(depth)}
          title={d.name}
          onClick={() => store.update("file", d.id, { expanded: !isOpen }, { silent: true })}
          onContextMenu={(e) => rowMenu(e, "file", d)}
        >
          <span className={cx(s.caret, isOpen && s.caretOpen)}>
            <Icon name="chevron" />
          </span>
          <span className={s.rowIcon}>
            <Icon name={isOpen ? "folderOpen" : "folder"} />
          </span>
          <span className={s.rowLabel}>{d.name}</span>
        </div>
        {isOpen && (
          <div>
            {kidDirs.map((cd) => renderDir(cd, depth + 1))}
            {kidFiles.map((f) => (
              <Leaf key={f.id} kind="file" o={f} depth={depth + 1} icon="file" />
            ))}
          </div>
        )}
      </div>
    );
  };
  const rootDirs = allFiles.filter((f) => f.dir && !f.parentId).sort((a, b) => a.name.localeCompare(b.name));
  const rootFiles = allFiles.filter((f) => !f.dir && !f.parentId && matches("file", f)).sort((a, b) => a.name.localeCompare(b.name));

  /* ---- simple list groups ---- */
  const listGroup = (kind: Kind, label: string) => {
    const items = store
      .byProject(kind, pid)
      .filter((o) => matches(kind, o))
      .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt - a.updatedAt);
    return (
      <Section id={kind} label={label} count={store.byProject(kind, pid).length} onAdd={() => newItem(kind)}>
        {items.length ? (
          items.map((o) => <Leaf key={o.id} kind={kind} o={o} depth={1} icon={kind === "task" ? taskIcon(o) : undefined} />)
        ) : (
          <div className={s.empty} style={depthStyle(1)}>
            {xf.query ? "no matches" : "Empty"}
          </div>
        )}
      </Section>
    );
  };
  const taskIcon = (t: AnyItem): IconName => {
    const status = (t as { status?: string }).status;
    return status === "done" ? "check" : status === "doing" ? "dot" : "tasks";
  };

  const pinnedItems = store.pinned(pid);
  const recentItems = store.recent(pid, 8);

  return (
    <div className={s.explorer}>
      {/* filter bar */}
      <div className={s.filter}>
        <div className={s.search}>
          <span className={s.searchIcon}>
            <Icon name="search" />
          </span>
          <input
            className={s.searchInput}
            type="search"
            placeholder="Search this project…"
            value={xf.query}
            aria-label="Search project"
            onChange={(e) => setExplorer({ query: e.target.value })}
          />
          <button
            type="button"
            className={cx("iconbtn", s.searchFilter, (xf.tag || xf.favOnly) && s.searchFilterOn)}
            title="Filters"
            onClick={(e) => {
              const tags = store.allTags(pid);
              openMenu(
                [
                  { label: "Favorites only", icon: "star", check: xf.favOnly, onClick: () => setExplorer({ favOnly: !xf.favOnly }) },
                  ...(tags.length ? [{ sep: true } as MenuItem, { head: "Tags" } as MenuItem, ...tags.slice(0, 12).map((t) => ({ label: `#${t.tag} (${t.count})`, icon: "tag" as IconName, check: xf.tag === t.tag, onClick: () => setExplorer({ tag: xf.tag === t.tag ? "" : t.tag }) }))] : []),
                ],
                e.currentTarget,
              );
            }}
          >
            <Icon name="filter" />
          </button>
        </div>
        {(xf.favOnly || xf.tag) && (
          <div className={s.chips}>
            {xf.favOnly && (
              <button type="button" className={s.chip} onClick={() => setExplorer({ favOnly: false })}>
                <span>★ Favorites</span>
                <span className={s.chipX}>
                  <Icon name="close" />
                </span>
              </button>
            )}
            {xf.tag && (
              <button type="button" className={s.chip} onClick={() => setExplorer({ tag: "" })}>
                <span>#{xf.tag}</span>
                <span className={s.chipX}>
                  <Icon name="close" />
                </span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* tree */}
      <div className={s.scroll}>
        {pinnedItems.length > 0 && (
          <Section id="pinned" label="Pinned" count={pinnedItems.length}>
            {pinnedItems.map(({ kind, o }) => (
              <Leaf key={"p" + o.id} kind={kind} o={o} depth={1} />
            ))}
          </Section>
        )}

        <Section id="chats" label="Chats" count={visibleChats.length} onAdd={() => newChat()}>
          {rootFolders.map((f) => renderFolder(f, 1))}
          {rootChats.map((c) => (
            <Leaf key={c.id} kind="chat" o={c} depth={1} />
          ))}
          {!rootFolders.length && !rootChats.length && (
            <div className={s.empty} style={depthStyle(1)}>
              {xf.query ? "no matches" : "No chats yet"}
            </div>
          )}
        </Section>

        <Section id="files" label="Files" count={allFiles.filter((f) => !f.dir).length} onAdd={() => newItem("file")}>
          {rootDirs.map((d) => renderDir(d, 1))}
          {rootFiles.map((f) => (
            <Leaf key={f.id} kind="file" o={f} depth={1} icon="file" />
          ))}
          {!rootDirs.length && !rootFiles.length && (
            <div className={s.empty} style={depthStyle(1)}>
              {xf.query ? "no matches" : "No files yet"}
            </div>
          )}
        </Section>

        {listGroup("note", "Notes")}
        {listGroup("task", "Tasks")}
        {listGroup("prompt", "Prompts")}
        {listGroup("memory", "Memory")}

        {recentItems.length > 0 && (
          <Section id="recent" label="Recent">
            {recentItems.map(({ kind, o, ts }) => (
              <Leaf key={"r" + o.id} kind={kind} o={o} depth={1} time={ts} />
            ))}
          </Section>
        )}
      </div>
    </div>
  );
}
