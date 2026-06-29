"use client";
import { useEffect, useState, type MouseEvent as ReactMouseEvent } from "react";
import { Badge } from "@/components/atoms/Badge/Badge";
import { Button } from "@/components/atoms/Button/Button";
import { IconButton } from "@/components/atoms/IconButton/IconButton";
import { Input } from "@/components/atoms/Input/Input";
import { Field } from "@/components/molecules/Field/Field";
import { Segmented } from "@/components/molecules/Segmented/Segmented";
import { TagChips } from "@/components/molecules/TagChips/TagChips";
import { Icon } from "@/design/icons";
import { useItemActions } from "@/lib/item-actions";
import { PROJECT_COLORS } from "@/lib/store/kinds";
import { store, useStoreVersion } from "@/lib/store/store";
import type { Priority, Task, TaskStatus } from "@/lib/store/types";
import { cx, fmtDate, fmtRelative } from "@/lib/utils";
import { useWorkspace } from "@/lib/workspace";
import s from "./TasksPanel.module.css";

const COLUMNS: { id: TaskStatus; label: string; color: string }[] = [
  { id: "todo", label: "To Do", color: "var(--text-faint)" },
  { id: "doing", label: "In Progress", color: "var(--warn)" },
  { id: "done", label: "Done", color: "var(--ok)" },
];

const flagClass: Record<Priority, string> = { low: s.flagLow, med: s.flagMed, high: s.flagHigh };
const toISO = (ms: number | null) => (ms ? new Date(ms).toISOString().slice(0, 10) : "");

export function TasksPanel() {
  useStoreVersion();
  const { focusTaskId, focusTask, openMenu, newItem } = useWorkspace();
  const { itemMenuItems } = useItemActions();
  const [view, setView] = useState<"board" | "list">("board");
  const p = store.activeProject();
  const pid = p?.id;
  const tasks = store.byProject("task", pid);
  const selected = focusTaskId ? store.get("task", focusTaskId) : null;

  const addTask = (status: TaskStatus) => {
    const t = store.create("task", {});
    store.update("task", t.id, { status }, { silent: true });
    focusTask(t.id);
  };

  const kebab = (e: ReactMouseEvent, t: Task) => {
    e.stopPropagation();
    openMenu(
      [
        { head: "Status" },
        ...COLUMNS.map((c) => ({ label: c.label, check: t.status === c.id, onClick: () => store.update("task", t.id, { status: c.id }) })),
        ...itemMenuItems("task", t.id, { onOpen: () => focusTask(t.id) }),
      ],
      e,
    );
  };

  const Card = ({ t }: { t: Task }) => (
    <div className={cx(s.card, focusTaskId === t.id && s.cardSelected)} onClick={() => focusTask(t.id)}>
      <div className={s.cardTop}>
        <span className={cx(s.flag, flagClass[t.priority])}>
          <Icon name="flag" />
        </span>
        <span className={s.cardTitle}>{t.title}</span>
        <IconButton icon="more" size={24} iconSize={16} title="More" onClick={(e) => kebab(e, t)} />
      </div>
      {(t.due || t.tags.length > 0) && (
        <div className={s.cardMeta}>
          {t.due && (
            <span className={cx(s.due, t.status !== "done" && t.due < Date.now() && s.dueOverdue)}>
              <Icon name="clock" />
              {fmtDate(t.due)}
            </span>
          )}
          {t.tags.length > 0 && <TagChips tags={t.tags.slice(0, 4)} />}
        </div>
      )}
    </div>
  );

  return (
    <div className={s.root}>
      <div className={s.toolbar}>
        <div className={s.title}>
          <span className={s.titleDot} style={{ background: PROJECT_COLORS[p?.color ?? ""] || "#888" }} />
          <span className={s.titleName}>{p?.name}</span>
        </div>
        <div className={s.spacer} />
        <div className={s.tright}>
          <Segmented<"board" | "list">
            options={[
              { value: "board", label: "Board", icon: "grid" },
              { value: "list", label: "List", icon: "list" },
            ]}
            value={view}
            onChange={setView}
          />
          <Badge>
            {tasks.length} {tasks.length === 1 ? "task" : "tasks"}
          </Badge>
          <Button size="sm" variant="primary" icon="plus" onClick={() => newItem("task")}>
            New task
          </Button>
        </div>
      </div>

      <div className={s.main}>
        <div className={s.body}>
          {view === "board" ? (
            <div className={s.board}>
              {COLUMNS.map((c) => {
                const col = tasks.filter((t) => t.status === c.id).sort((a, b) => b.order - a.order);
                return (
                  <div key={c.id} className={s.col}>
                    <div className={s.colhead}>
                      <span className={s.colheadDot} style={{ background: c.color }} />
                      <span className={s.colheadTitle}>{c.label}</span>
                      <span className={s.colheadCount}>{col.length}</span>
                      <IconButton className={s.coladd} icon="plus" size={26} iconSize={16} title="Add task" onClick={() => addTask(c.id)} />
                    </div>
                    <div className={s.collist}>
                      {col.length ? col.map((t) => <Card key={t.id} t={t} />) : <div className={s.colempty}>No tasks</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={s.list}>
              {COLUMNS.map((c) => {
                const col = tasks.filter((t) => t.status === c.id).sort((a, b) => b.order - a.order);
                if (!col.length) return null;
                return (
                  <div key={c.id} className={s.group}>
                    <div className={s.groupHead}>
                      <span className={s.colheadDot} style={{ background: c.color }} />
                      <span className={s.groupTitle}>{c.label}</span>
                      <span className={s.colheadCount}>{col.length}</span>
                    </div>
                    <div className={s.rows}>
                      {col.map((t) => (
                        <div key={t.id} className={cx(s.row, focusTaskId === t.id && s.rowSelected)} onClick={() => focusTask(t.id)}>
                          <button
                            type="button"
                            className={s.rowstatus}
                            onClick={(e) => {
                              e.stopPropagation();
                              const next = t.status === "todo" ? "doing" : t.status === "doing" ? "done" : "todo";
                              store.update("task", t.id, { status: next });
                            }}
                          >
                            <span className={s.colheadDot} style={{ background: c.color }} />
                            <span>{c.label}</span>
                          </button>
                          <span className={cx(s.rowTitle, t.status === "done" && s.rowDone)}>{t.title}</span>
                          <span className={cx(s.flag, flagClass[t.priority])}>
                            <Icon name="flag" />
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              {!tasks.length && <div className={s.colempty}>No tasks yet — create one.</div>}
            </div>
          )}
        </div>

        <div className={cx(s.detail, selected && s.detailOpen)}>
          {selected && <TaskDetail task={selected} onClose={() => focusTask(null)} />}
        </div>
      </div>
    </div>
  );
}

function TaskDetail({ task, onClose }: { task: Task; onClose: () => void }) {
  const { openMenu } = useWorkspace();
  const { itemMenuItems } = useItemActions();
  const [notes, setNotes] = useState(task.notes);
  const [tagDraft, setTagDraft] = useState("");

  useEffect(() => {
    setNotes(store.get("task", task.id)?.notes ?? "");
  }, [task.id]);

  return (
    <div className={s.detailInner}>
      <div className={s.detailHead}>
        <span className={s.detailEyebrow}>Task</span>
        <IconButton icon={task.favorite ? "starFill" : "star"} active={task.favorite} title="Favorite" onClick={() => store.toggleFav("task", task.id)} />
        <IconButton icon={task.pinned ? "pin" : "pinOutline"} active={task.pinned} title="Pin" onClick={() => store.togglePin("task", task.id)} />
        <IconButton icon="more" title="More" onClick={(e) => openMenu(itemMenuItems("task", task.id), e.currentTarget)} />
        <IconButton icon="close" title="Close" onClick={onClose} />
      </div>
      <div className={s.detailBody}>
        <Field label="Title">
          <Input value={task.title} onChange={(e) => store.update("task", task.id, { title: e.target.value }, { silent: true })} />
        </Field>
        <Field label="Status">
          <Segmented<TaskStatus>
            className={s.segFull}
            options={COLUMNS.map((c) => ({ value: c.id, label: c.label }))}
            value={task.status}
            onChange={(v) => store.update("task", task.id, { status: v })}
          />
        </Field>
        <Field label="Priority">
          <Segmented<Priority>
            className={s.segFull}
            options={[
              { value: "low", label: "Low" },
              { value: "med", label: "Medium" },
              { value: "high", label: "High" },
            ]}
            value={task.priority}
            onChange={(v) => store.update("task", task.id, { priority: v })}
          />
        </Field>
        <Field label="Due date">
          <Input type="date" value={toISO(task.due)} onChange={(e) => store.update("task", task.id, { due: e.target.value ? new Date(e.target.value).getTime() : null })} />
        </Field>
        <Field label="Tags">
          <TagChips tags={task.tags} onRemove={(t) => store.setTags("task", task.id, task.tags.filter((x) => x !== t))} />
          <Input
            placeholder="Add a tag and press Enter"
            value={tagDraft}
            onChange={(e) => setTagDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && tagDraft.trim()) {
                store.setTags("task", task.id, [...task.tags, tagDraft]);
                setTagDraft("");
              }
            }}
          />
        </Field>
        <Field label="Notes">
          <textarea
            className={cx("md", s.notes)}
            style={{ width: "100%", background: "var(--bg-deep)", border: "1px solid var(--border)", borderRadius: "var(--r-sm)", padding: "8px 11px", color: "var(--text)", outline: "none" }}
            value={notes}
            placeholder="Add details…"
            onChange={(e) => {
              setNotes(e.target.value);
              store.update("task", task.id, { notes: e.target.value }, { silent: true });
            }}
          />
        </Field>
      </div>
      <div className={s.detailFoot}>
        <Icon name="clock" />
        <span>Updated {fmtRelative(task.updatedAt)}</span>
      </div>
    </div>
  );
}
