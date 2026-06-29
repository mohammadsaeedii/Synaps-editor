"use client";
import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import { IconButton } from "@/components/atoms/IconButton/IconButton";
import { Typing } from "@/components/atoms/Typing/Typing";
import { EmptyState } from "@/components/molecules/EmptyState/EmptyState";
import { PanelHeader } from "@/components/molecules/PanelHeader/PanelHeader";
import { Icon, type IconName } from "@/design/icons";
import { apiHistory, isLive, runAI, statusText } from "@/lib/ai";
import { md as renderMarkdown } from "@/lib/markdown";
import { useItemActions } from "@/lib/item-actions";
import { store, useStoreVersion } from "@/lib/store/store";
import type { ChatMessage } from "@/lib/store/types";
import type { MenuItem } from "@/lib/ui-types";
import { copyText, cx, deriveTitle } from "@/lib/utils";
import { useWorkspace } from "@/lib/workspace";
import s from "./ChatPanel.module.css";

const MODELS: [string, string][] = [
  ["", "Workspace default"],
  ["claude-opus-4-8", "Claude Opus 4.8"],
  ["claude-sonnet-4-6", "Claude Sonnet 4.6"],
  ["claude-haiku-4-5", "Claude Haiku 4.5"],
];

const QUICK: { label: string; text: string; icon: IconName }[] = [
  { label: "Summarize", text: "Summarize this for me:\n\n", icon: "book" },
  { label: "Brainstorm", text: "Brainstorm 5 ideas for ", icon: "bulb" },
  { label: "Write code", text: "Write a function that ", icon: "code" },
  { label: "Explain", text: "Explain simply: ", icon: "info" },
];

export function ChatPanel({ chatId }: { chatId: string }) {
  useStoreVersion();
  const { toast, openMenu, requestInsert, insertRequest, clearInsertRequest, newItem } = useWorkspace();
  const { itemMenuItems } = useItemActions();
  const [draft, setDraft] = useState("");
  const [streaming, setStreaming] = useState<{ text: string } | null>(null);
  const ctrlRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const conv = store.get("chat", chatId);

  const autoscroll = () => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  };

  // auto-grow composer
  useEffect(() => {
    const ta = taRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = Math.min(200, ta.scrollHeight) + "px";
    }
  }, [draft]);

  // consume a prompt-insert request targeted at this chat
  useEffect(() => {
    if (insertRequest && insertRequest.chatId === chatId) {
      setDraft((d) => (d ? d + "\n" + insertRequest.text : insertRequest.text));
      clearInsertRequest();
      setTimeout(() => taRef.current?.focus(), 0);
    }
  }, [insertRequest, chatId, clearInsertRequest]);

  useEffect(() => {
    setTimeout(autoscroll, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!conv) return <EmptyState icon="chat" title="Chat not found" sub="It may have been deleted." />;

  const md = renderMarkdown;

  async function stream() {
    const c = store.get("chat", chatId);
    if (!c) return;
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;
    setStreaming({ text: "" });
    let acc = "";
    try {
      await runAI(apiHistory(c.messages), {
        system: c.system || store.settings().systemPrompt || undefined,
        model: c.model || undefined,
        signal: ctrl.signal,
        onChunk: (t) => {
          acc += t;
          setStreaming({ text: acc });
          requestAnimationFrame(autoscroll);
        },
      });
      store.pushMessage(chatId, { role: "assistant", text: acc || "…" });
    } catch (e) {
      const err = e as { name?: string; message?: string };
      if (err?.name === "AbortError") {
        store.pushMessage(chatId, { role: "assistant", text: acc || "_(stopped)_" });
      } else {
        store.pushMessage(chatId, { role: "assistant", text: "⚠ " + (err?.message || "Request failed") });
        toast("AI error: " + (err?.message || "failed"), "err");
      }
    } finally {
      ctrlRef.current = null;
      setStreaming(null);
      store.logActivity("opened", "chat", store.get("chat", chatId));
      store.flush();
      setTimeout(autoscroll, 0);
      taRef.current?.focus();
    }
  }

  function send() {
    if (ctrlRef.current) {
      ctrlRef.current.abort();
      return;
    }
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    store.pushMessage(chatId, { role: "user", text });
    if (conv!.title === "New chat" || !conv!.title) store.update("chat", chatId, { title: deriveTitle(text) }, { silent: true });
    store.flush();
    setTimeout(autoscroll, 0);
    void stream();
  }

  function regenerate(idx: number) {
    if (ctrlRef.current) return;
    const c = store.get("chat", chatId);
    if (!c) return;
    c.messages = c.messages.slice(0, idx);
    store.flush();
    void stream();
  }
  function editUser(idx: number) {
    if (ctrlRef.current) return;
    const c = store.get("chat", chatId);
    if (!c) return;
    const t = c.messages[idx].text;
    c.messages = c.messages.slice(0, idx);
    store.flush();
    setDraft(t);
    setTimeout(() => taRef.current?.focus(), 0);
  }

  const setModel = (e: ReactMouseEvent<HTMLButtonElement>) => {
    openMenu(
      MODELS.map(([v, l]) => ({ label: l, check: conv!.model === v, onClick: () => store.update("chat", chatId, { model: v }) })),
      e.currentTarget,
    );
  };
  const modelLabel = MODELS.find((x) => x[0] === conv.model)?.[1] || "Default";

  const promptMenu = (e: ReactMouseEvent<HTMLButtonElement>) => {
    const ps = store.byProject("prompt", conv.projectId);
    const items: MenuItem[] = ps.length
      ? ps.map((p) => ({ label: p.title, icon: "prompts", onClick: () => requestInsert(p.body) }))
      : [{ label: "No prompts — create one", icon: "plus", onClick: () => newItem("prompt") }];
    openMenu(items, e.currentTarget);
  };

  const quick = (() => {
    const lib = store.byProject("prompt", conv.projectId).filter((p) => p.pinned).slice(0, 4);
    return lib.length ? lib.map((p) => ({ label: p.title, text: p.body, icon: "prompts" as IconName })) : QUICK;
  })();

  const fav = (
    <IconButton key="fav" icon={conv.favorite ? "starFill" : "star"} title={conv.favorite ? "Unfavorite" : "Favorite"} active={conv.favorite} onClick={() => store.toggleFav("chat", chatId)} />
  );
  const pin = (
    <IconButton key="pin" icon={conv.pinned ? "pin" : "pinOutline"} title={conv.pinned ? "Unpin" : "Pin"} active={conv.pinned} onClick={() => store.togglePin("chat", chatId)} />
  );

  return (
    <div className={s.root}>
      <PanelHeader
        title={conv.title}
        editableTitle
        onTitle={(v) => v.trim() && store.update("chat", chatId, { title: v.trim() })}
        actions={
          <>
            <button type="button" className={s.model} title="Model for this chat" onClick={setModel}>
              <Icon name="cpu" />
              <span>{modelLabel}</span>
            </button>
            {fav}
            {pin}
            <IconButton icon="share" title="Copy share link" onClick={() => { copyText(location.href); toast("Link copied", "ok"); }} />
            <IconButton icon="more" title="More" onClick={(e) => openMenu(itemMenuItems("chat", chatId), e.currentTarget)} />
          </>
        }
      />

      <div className={s.scroll} ref={scrollRef}>
        <div className={s.inner}>
          <div className={s.msgs}>
            {!conv.messages.length && !streaming ? (
              <div className={s.empty}>
                <div className={s.emptyMark}>
                  <Icon name="sparkle" size={40} />
                </div>
                <h2>Start the conversation</h2>
                <p>{isLive() ? "Connected to the Claude API." : "Offline demo mode — answers are simulated."}</p>
                <div className={s.chips}>
                  {quick.map((q) => (
                    <button key={q.label} type="button" className={s.chip} onClick={() => { setDraft(q.text); setTimeout(() => taRef.current?.focus(), 0); }}>
                      <Icon name={q.icon} />
                      <span>{q.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {conv.messages.map((m, i) => (
                  <Message key={m.id} m={m} idx={i} onEdit={editUser} onRegen={regenerate} onCopy={(t) => copyText(t)} toast={toast} md={md} />
                ))}
                {streaming && (
                  <div className={s.msg}>
                    <span className={s.avatar}>
                      <Icon name="bot" size={17} />
                    </span>
                    <div className={cx(s.bubble, s.bubbleBot)}>
                      {streaming.text ? <div className={cx(s.text, "md")} dangerouslySetInnerHTML={{ __html: md(streaming.text) }} /> : <Typing />}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <div className={s.composer}>
        <div className={s.bar}>
          <IconButton icon="attach" title="Attach (demo)" size={34} iconSize={18} onClick={() => toast("Attachments are a demo stub", "info")} />
          <textarea
            ref={taRef}
            className={s.input}
            rows={1}
            placeholder="Ask synapse anything…  (⏎ to send, ⇧⏎ for newline)"
            aria-label="Message"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
          />
          <IconButton icon="prompts" title="Insert a prompt" size={34} iconSize={18} onClick={promptMenu} />
          <button type="button" className={cx(s.send, ctrlRef.current && s.sendStop)} aria-label={ctrlRef.current ? "Stop" : "Send"} onClick={send}>
            <Icon name={ctrlRef.current ? "stop" : "send"} size={18} />
          </button>
        </div>
        <p className={s.hint}>{statusText() === "Live · Claude API" ? "Connected to Claude." : "Offline demo — add a Claude key in Settings for real answers."}</p>
      </div>
    </div>
  );
}

function Message({
  m,
  idx,
  onEdit,
  onRegen,
  onCopy,
  toast,
  md,
}: {
  m: ChatMessage;
  idx: number;
  onEdit: (i: number) => void;
  onRegen: (i: number) => void;
  onCopy: (t: string) => void;
  toast: (msg: string, kind?: "ok" | "err" | "info" | "") => void;
  md: (t: string) => string;
}) {
  if (m.role === "user") {
    return (
      <div className={cx(s.msg, s.msgUser)}>
        <div className={cx(s.bubble, s.bubbleUser)}>
          <div className={s.text}>
            <div className={s.plain}>{m.text}</div>
          </div>
          <div className={s.tools}>
            <IconButton icon="edit" title="Edit & resend" size={26} iconSize={15} onClick={() => onEdit(idx)} />
            <IconButton icon="copy" title="Copy" size={26} iconSize={15} onClick={() => onCopy(m.text)} />
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className={s.msg}>
      <span className={s.avatar}>
        <Icon name="bot" size={17} />
      </span>
      <div className={cx(s.bubble, s.bubbleBot)}>
        <div className={cx(s.text, "md")} dangerouslySetInnerHTML={{ __html: md(m.text) }} />
        {!m.meta && (
          <div className={s.tools}>
            <IconButton icon="copy" title="Copy" size={26} iconSize={15} onClick={() => onCopy(m.text)} />
            <IconButton icon="up" title="Good" size={26} iconSize={15} onClick={() => toast("Thanks for the feedback", "ok")} />
            <IconButton icon="down" title="Bad" size={26} iconSize={15} onClick={() => toast("Noted", "ok")} />
            <IconButton icon="regen" title="Regenerate" size={26} iconSize={15} onClick={() => onRegen(idx)} />
          </div>
        )}
      </div>
    </div>
  );
}
