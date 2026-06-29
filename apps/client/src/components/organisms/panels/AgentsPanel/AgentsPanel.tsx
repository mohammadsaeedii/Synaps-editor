"use client";
import { useRef, useState } from "react";
import { Button } from "@/components/atoms/Button/Button";
import { Input } from "@/components/atoms/Input/Input";
import { EmptyState } from "@/components/molecules/EmptyState/EmptyState";
import { PanelHeader } from "@/components/molecules/PanelHeader/PanelHeader";
import { Icon } from "@/design/icons";
import { runAI } from "@/lib/ai";
import { store, useStoreVersion } from "@/lib/store/store";
import type { Agent, AgentRun } from "@/lib/store/types";
import { cx, fmtRelative, uid } from "@/lib/utils";
import { useWorkspace } from "@/lib/workspace";
import s from "./AgentsPanel.module.css";

const dotClass = (status: string) =>
  cx(s.dot, status === "running" ? s.dotRunning : status === "done" ? s.dotDone : status === "stopped" ? s.dotStopped : s.dotIdle);

const modelShort = (m: string) => m.replace("claude-", "").replace(/-\d.*/, "").replace(/^\w/, (c) => c.toUpperCase());

/* ---- side list ---- */
export function AgentsSide() {
  useStoreVersion();
  const { openAgent } = useWorkspace();
  const p = store.activeProject();
  const agents = Object.values(store.getState().agents).filter((a) => a.projectId === p?.id);
  const running = agents.filter((a) => a.status === "running").length;

  return (
    <div className={s.side}>
      <div className={s.sideBar}>
        <span>
          {agents.length} {agents.length === 1 ? "agent" : "agents"}
        </span>
        {running > 0 && (
          <span className={s.sideRunning}>
            <span className={cx(s.dot, s.dotRunning)} />
            {running} running
          </span>
        )}
      </div>
      <div className={s.sideScroll}>
        {agents.map((a) => (
          <button key={a.id} type="button" className={s.card} onClick={() => openAgent(a.id)}>
            <span className={dotClass(a.status)} />
            <span className={s.cardMain}>
              <span className={s.cardName}>{a.name}</span>
              <span className={s.cardRole}>{a.role}</span>
            </span>
            <span className={s.cardModel}>
              <Icon name="cpu" />
              {modelShort(a.model)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---- console (editor panel) ---- */
export function AgentsConsole() {
  useStoreVersion();
  const { focusAgentId } = useWorkspace();
  const p = store.activeProject();
  const agents = Object.values(store.getState().agents).filter((a) => a.projectId === p?.id);
  const agent = (focusAgentId ? store.getState().agents[focusAgentId] : null) ?? agents[0];
  const [goal, setGoal] = useState("");
  const ctrlRef = useRef<AbortController | null>(null);

  if (!agent) return <EmptyState icon="agents" title="No agents" sub="Agents run goals over this project." />;

  const run = async () => {
    if (ctrlRef.current) {
      ctrlRef.current.abort();
      return;
    }
    const g = goal.trim();
    if (!g) return;
    setGoal("");
    const r: AgentRun = { id: uid(), goal: g, status: "running", ts: Date.now(), log: [] };
    agent.runs.unshift(r);
    agent.status = "running";
    store.flush();
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;
    let acc = "";
    try {
      await runAI([{ role: "user", content: g }], {
        system: agent.system || `You are ${agent.name}. ${agent.role}.`,
        model: agent.model,
        signal: ctrl.signal,
        onChunk: (t) => {
          acc += t;
          r.log = acc.split("\n");
          store.flush();
        },
      });
      r.status = "done";
      agent.status = "idle";
    } catch (e) {
      const err = e as { name?: string };
      r.status = err?.name === "AbortError" ? "stopped" : "done";
      agent.status = "idle";
    } finally {
      ctrlRef.current = null;
      store.flush();
    }
  };

  return (
    <div className={s.root}>
      <PanelHeader
        title={agent.name}
        sub={agent.role}
        actions={
          <>
            <span className={s.model}>
              <Icon name="cpu" />
              {modelShort(agent.model)}
            </span>
            <span className={cx(s.badge, agent.status === "running" ? s.badgeRunning : agent.status === "done" ? s.badgeDone : s.badgeIdle)}>
              <span className={dotClass(agent.status)} />
              {agent.status}
            </span>
          </>
        }
      />
      <div className={s.instr}>
        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-dim)" }}>Instructions</span>
        <textarea
          className={s.instrTa}
          placeholder="System instructions for this agent…"
          value={agent.system}
          onChange={(e) => {
            agent.system = e.target.value;
            store.flush();
          }}
        />
      </div>
      <div className={s.goal}>
        <span className={s.goalIco}>
          <Icon name="sparkle" />
        </span>
        <Input
          className={s.goalInput}
          placeholder="Give the agent a goal…"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") run();
          }}
        />
        <Button variant="primary" icon={ctrlRef.current ? "stop" : "play"} onClick={run}>
          {ctrlRef.current ? "Stop" : "Run"}
        </Button>
      </div>
      <div className={s.runsHead}>Run history</div>
      <div className={s.runsScroll}>
        {agent.runs.length ? (
          <div className={s.runs}>
            {agent.runs.map((r) => (
              <details key={r.id} className={s.run} open={r.status === "running"}>
                <summary className={s.runSum}>
                  <span className={dotClass(r.status)} />
                  <span className={s.runGoal}>{r.goal}</span>
                  <span className={s.runMeta}>{fmtRelative(r.ts)}</span>
                </summary>
                <pre className={s.log}>
                  {r.log.join("\n")}
                  {r.status === "running" && <span className={s.logCursor} />}
                </pre>
              </details>
            ))}
          </div>
        ) : (
          <div className={s.runsEmpty}>
            <Icon name="bot" size={30} />
            <p>Give this agent a goal to see a streamed run log.</p>
          </div>
        )}
      </div>
    </div>
  );
}
