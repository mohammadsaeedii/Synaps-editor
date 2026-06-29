"use client";
import { useState, type MouseEvent as ReactMouseEvent } from "react";
import { IconButton } from "@/components/atoms/IconButton/IconButton";
import { Icon } from "@/design/icons";
import { store, useStoreVersion } from "@/lib/store/store";
import type { Commit, WorkingChange } from "@/lib/store/types";
import { cx, fmtRelative, uid } from "@/lib/utils";
import { useWorkspace } from "@/lib/workspace";
import s from "./GitPanel.module.css";

const splitPath = (path: string) => {
  const i = path.lastIndexOf("/");
  return { name: i >= 0 ? path.slice(i + 1) : path, dir: i >= 0 ? path.slice(0, i) : "" };
};

export function GitPanel({ compact = false }: { compact?: boolean }) {
  useStoreVersion();
  const { openMenu } = useWorkspace();
  const [msg, setMsg] = useState("");
  const p = store.activeProject();
  const git = p ? store.getState().git[p.id] : null;
  if (!git) return null;

  const staged = git.working.filter((w) => w.staged);
  const unstaged = git.working.filter((w) => !w.staged);

  const flush = () => store.flush();
  const setStaged = (path: string, v: boolean) => { const w = git.working.find((x) => x.path === path); if (w) w.staged = v; flush(); };
  const discard = (path: string) => { git.working = git.working.filter((x) => x.path !== path); flush(); };
  const stageAll = () => { git.working.forEach((w) => (w.staged = true)); flush(); };
  const unstageAll = () => { git.working.forEach((w) => (w.staged = false)); flush(); };
  const commit = () => {
    if (!staged.length || !msg.trim()) return;
    const c: Commit = { hash: uid().slice(0, 7), msg: msg.trim(), author: store.settings().name || "You", ts: Date.now(), files: staged.map((w) => w.path) };
    git.commits.unshift(c);
    git.working = git.working.filter((w) => !w.staged);
    const b = git.branches.find((x) => x.name === git.branch);
    if (b) b.head = c.hash;
    setMsg("");
    flush();
  };

  const branchMenu = (e: ReactMouseEvent<HTMLButtonElement>) => {
    openMenu(
      git.branches.map((b) => ({ label: b.name, icon: "branch", check: b.name === git.branch, onClick: () => { git.branch = b.name; flush(); } })),
      e.currentTarget,
    );
  };

  const Row = ({ w }: { w: WorkingChange }) => {
    const { name, dir } = splitPath(w.path);
    return (
      <div className={s.row}>
        <IconButton className={s.stage} icon={w.staged ? "close" : "plus"} size={26} iconSize={16} title={w.staged ? "Unstage" : "Stage"} onClick={() => setStaged(w.path, !w.staged)} />
        <span className={s.badge} data-s={w.status}>
          {w.status}
        </span>
        <span className={s.path}>
          <span className={s.fname}>{name}</span>
          {dir && <span className={s.fdir}>{dir}</span>}
        </span>
        <span className={s.rowActs}>
          <IconButton icon="trash" size={26} iconSize={15} title="Discard" onClick={() => discard(w.path)} />
        </span>
      </div>
    );
  };

  const CommitNode = ({ c, i }: { c: Commit; i: number }) => {
    const isHead = i === 0;
    return (
      <div className={cx(s.commit, i === 0 && s.commitFirst, i === git.commits.length - 1 && s.commitLast)}>
        {!compact && (
          <div className={s.gutter}>
            <span className={cx(s.node, isHead && s.nodeHead)} />
          </div>
        )}
        <div className={s.cbody}>
          <div className={s.crow}>
            <span className={s.hash}>{c.hash}</span>
            <span className={s.cmsg}>{c.msg}</span>
            {isHead && git.branches.filter((b) => b.head === c.hash).map((b) => (
              <span key={b.name} className={cx(s.headbadge, b.name === git.branch && s.headbadgeCurrent)}>
                <Icon name="branch" />
                {b.name}
              </span>
            ))}
          </div>
          <div className={s.cmeta}>
            <span className={s.author}>{c.author}</span>
            <span>·</span>
            <span>{fmtRelative(c.ts)}</span>
            <span className={s.mfiles}>{c.files.length} files</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={cx(s.root, compact && s.compact)}>
      <div className={s.head}>
        <button type="button" className={s.branch} title="Switch branch" onClick={branchMenu}>
          <span className={s.branchIco}>
            <Icon name="branch" />
          </span>
          <span className={s.branchName}>{git.branch}</span>
          <span className={s.branchChev}>
            <Icon name="chevronDown" />
          </span>
        </button>
        {!compact && (
          <span className={s.headActs}>
            <IconButton icon="refresh" title="Refresh" onClick={flush} />
          </span>
        )}
      </div>

      <div className={s.commitbox}>
        <textarea className={cx("md", s.msg)} style={{ width: "100%", background: "var(--bg-deep)", border: "1px solid var(--border)", borderRadius: "var(--r-sm)", padding: "8px 11px", color: "var(--text)", outline: "none" }} placeholder="Commit message…" value={msg} onChange={(e) => setMsg(e.target.value)} />
        <div className={s.commitbar}>
          <span className={s.commitHint}>{staged.length} staged</span>
          <IconButton className={s.commitBtn} icon="check" title="Commit" iconSize={15} onClick={commit} disabled={!staged.length || !msg.trim()} style={{ opacity: !staged.length || !msg.trim() ? 0.45 : 1 }} />
        </div>
      </div>

      <div className={s.scroll}>
        {!compact && staged.length > 0 && (
          <div className={s.sec}>
            <div className={s.secHead}>
              <span className={s.secTitle}>Staged Changes</span>
              <span className={s.count}>{staged.length}</span>
              <span className={s.secActs}>
                <button type="button" className={s.link} onClick={unstageAll}>
                  Unstage all
                </button>
              </span>
            </div>
            <div className={s.list}>{staged.map((w) => <Row key={w.path} w={w} />)}</div>
          </div>
        )}

        <div className={s.sec}>
          <div className={s.secHead}>
            <span className={s.secTitle}>Changes</span>
            <span className={s.count}>{(compact ? git.working : unstaged).length}</span>
            <span className={s.secActs}>
              <button type="button" className={s.link} onClick={stageAll}>
                Stage all
              </button>
            </span>
          </div>
          {(compact ? git.working : unstaged).length ? (
            <div className={s.list}>{(compact ? git.working : unstaged).map((w) => <Row key={w.path} w={w} />)}</div>
          ) : (
            <div className={s.clean}>
              <span className={s.cleanIco}>
                <Icon name="check" />
              </span>
              No changes
            </div>
          )}
        </div>

        <div className={cx(s.sec, s.history)}>
          <div className={s.secHead}>
            <span className={s.secTitle}>{compact ? "Recent Commits" : "History"}</span>
          </div>
          <div className={cx(s.graph, compact && s.recent)}>
            {git.commits.map((c, i) => (
              <CommitNode key={c.hash} c={c} i={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
