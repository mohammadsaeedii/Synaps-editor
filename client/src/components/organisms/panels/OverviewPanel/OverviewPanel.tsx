"use client";
import { Button } from "@/components/atoms/Button/Button";
import { Icon, type IconName } from "@/design/icons";
import { KINDS, PROJECT_COLORS } from "@/lib/store/kinds";
import { store, useStoreVersion } from "@/lib/store/store";
import type { Kind, Task } from "@/lib/store/types";
import { cx, fmtRelative } from "@/lib/utils";
import { useWorkspace } from "@/lib/workspace";
import s from "./OverviewPanel.module.css";

export function OverviewPanel() {
  useStoreVersion();
  const { newChat, newItem, open, openTab, openDock, activateSide } = useWorkspace();
  const p = store.activeProject();
  if (!p) return null;
  const pid = p.id;

  const count = (k: Kind) => store.byProject(k, pid).length;
  const tasks = store.byProject("task", pid);
  const openTasks = tasks.filter((t) => t.status !== "done").sort((a, b) => b.order - a.order);
  const git = store.getState().git[pid];
  const agents = Object.values(store.getState().agents).filter((a) => a.projectId === pid);
  const recent = store.recent(pid, 6);
  const pinned = store.pinned(pid).slice(0, 6);
  const tags = store.allTags(pid).slice(0, 16);

  const stats: { icon: IconName; value: number; label: string; onClick: () => void }[] = [
    { icon: "chat", value: count("chat"), label: "Chats", onClick: () => activateSide("explorer") },
    { icon: "file", value: count("file"), label: "Files", onClick: () => activateSide("explorer") },
    { icon: "notes", value: count("note"), label: "Notes", onClick: () => activateSide("explorer") },
    { icon: "tasks", value: openTasks.length, label: "Open tasks", onClick: () => openTab("task", null) },
    { icon: "prompts", value: count("prompt"), label: "Prompts", onClick: () => activateSide("explorer") },
    { icon: "memory", value: count("memory"), label: "Memory", onClick: () => activateSide("explorer") },
    { icon: "commit", value: git?.commits.length ?? 0, label: "Commits", onClick: () => openDock("git") },
    { icon: "agents", value: agents.length, label: "Agents", onClick: () => activateSide("agents") },
  ];

  return (
    <div className={s.root}>
      <div className={s.ov}>
        {/* hero */}
        <div className={s.hero}>
          <div className={s.heroTop}>
            <span className={s.heroDot} style={{ background: PROJECT_COLORS[p.color] }} />
            <span className={s.heroName}>{p.name}</span>
            <Button className={s.spacer} icon="project" onClick={() => activateSide("explorer")}>
              Explorer
            </Button>
          </div>
          <div className={cx(s.heroDesc, !p.description && s.heroDescPlaceholder)}>{p.description || "No description yet."}</div>
          <div className={s.heroMeta}>
            <Icon name="clock" />
            <span>Updated {fmtRelative(p.updatedAt)}</span>
          </div>
        </div>

        {/* quick actions */}
        <div className={s.actions}>
          <Button icon="chat" onClick={() => newChat()}>
            New chat
          </Button>
          <Button icon="notes" onClick={() => newItem("note")}>
            Note
          </Button>
          <Button icon="tasks" onClick={() => newItem("task")}>
            Task
          </Button>
          <Button icon="file" onClick={() => newItem("file")}>
            File
          </Button>
          <Button icon="prompts" onClick={() => newItem("prompt")}>
            Prompt
          </Button>
        </div>

        {/* stats */}
        <div className={s.stats}>
          {stats.map((st) => (
            <button key={st.label} type="button" className={s.stat} onClick={st.onClick}>
              <span className={s.statIcon}>
                <Icon name={st.icon} />
              </span>
              <span className={s.statValue}>{st.value}</span>
              <span className={s.statLabel}>{st.label}</span>
            </button>
          ))}
        </div>

        {/* grid */}
        <div className={s.grid}>
          <Card icon="tasks" title="Active tasks">
            {openTasks.length ? (
              openTasks.slice(0, 6).map((t) => (
                <div key={t.id} className={s.task}>
                  <button
                    type="button"
                    className={cx(s.check, t.status === "doing" && s.checkDoing)}
                    aria-label="Toggle"
                    onClick={() => store.update("task", t.id, { status: t.status === "done" ? "todo" : "done" })}
                  >
                    {t.status === "done" && <Icon name="check" />}
                  </button>
                  <span className={s.taskTitle} onClick={() => open("task", t.id)}>
                    {t.title}
                  </span>
                  <span className={cx(s.prio, prioClass(t))} />
                </div>
              ))
            ) : (
              <div className={s.empty}>No open tasks 🎉</div>
            )}
          </Card>

          <Card icon="clock" title="Recent activity">
            {recent.length ? (
              <div className={s.list}>
                {recent.map(({ kind, o, ts }) => (
                  <button key={kind + o.id} type="button" className={s.row} onClick={() => open(kind, o.id)}>
                    <span className={s.rowIco}>
                      <Icon name={KINDS[kind].icon} />
                    </span>
                    <span className={s.rowTitle}>{store.titleOf(kind, o)}</span>
                    <span className={s.rowTime}>{fmtRelative(ts)}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className={s.empty}>Nothing yet.</div>
            )}
          </Card>

          <Card icon="pin" title="Pinned">
            {pinned.length ? (
              <div className={s.list}>
                {pinned.map(({ kind, o }) => (
                  <button key={kind + o.id} type="button" className={s.row} onClick={() => open(kind, o.id)}>
                    <span className={s.rowIco}>
                      <Icon name={KINDS[kind].icon} />
                    </span>
                    <span className={s.rowTitle}>{store.titleOf(kind, o)}</span>
                    <span className={s.rowBadge}>{KINDS[kind].label}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className={s.empty}>Pin items to see them here.</div>
            )}
          </Card>

          <Card icon="tag" title="Tags">
            {tags.length ? (
              <div className={s.tags}>
                {tags.map((t) => (
                  <span key={t.tag} className={s.tag}>
                    #{t.tag}
                    <span className={s.tagN}>{t.count}</span>
                  </span>
                ))}
              </div>
            ) : (
              <div className={s.empty}>Tag items to see them here.</div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function prioClass(t: Task): string {
  return t.priority === "high" ? s.prioHigh : t.priority === "med" ? s.prioMed : s.prioLow;
}

function Card({ icon, title, children }: { icon: IconName; title: string; children: React.ReactNode }) {
  return (
    <div className={s.card}>
      <div className={s.cardHead}>
        <span className={s.cardIco}>
          <Icon name={icon} />
        </span>
        <span className={s.cardTitle}>{title}</span>
      </div>
      {children}
    </div>
  );
}
