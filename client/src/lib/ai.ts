/* =========================================================================
   synapse · AI engine (pluggable)
   Offline mock by default; the real Claude API when a key is set in Settings.
   Browser-direct streaming (SSE) via fetch — no backend. Shared by the Chat
   panel and the simulated Agents panel. Ported from the original ai.js.
   ========================================================================= */
import { store } from "./store/store";

export interface ApiMessage {
  role: "user" | "assistant";
  content: string;
}

export interface RunOptions {
  system?: string;
  model?: string;
  signal?: AbortSignal;
  onChunk: (text: string) => void;
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function isLive(): boolean {
  const k = store.settings().apiKey;
  return !!(k && k.trim());
}

export function statusText(): string {
  return isLive() ? "Live · Claude API" : "Offline demo";
}

/** Build an API-shaped history from a chat's messages (drop meta + leading assistant). */
export function apiHistory(messages: { role: "user" | "assistant"; text: string; meta?: boolean }[]): ApiMessage[] {
  const msgs = messages.filter((m) => !m.meta).map((m) => ({ role: m.role, content: m.text }));
  while (msgs.length && msgs[0].role === "assistant") msgs.shift();
  return msgs;
}

async function streamClaude(history: ApiMessage[], { system, model, onChunk, signal }: RunOptions): Promise<void> {
  const s = store.settings();
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    signal,
    headers: {
      "content-type": "application/json",
      "x-api-key": s.apiKey.trim(),
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: model || s.model || "claude-opus-4-8",
      max_tokens: 2048,
      stream: true,
      ...(system ? { system } : {}),
      messages: history,
    }),
  });
  if (!res.ok || !res.body) {
    let msg = "HTTP " + res.status;
    try {
      const j = await res.json();
      if (j?.error?.message) msg = j.error.message;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let i: number;
    while ((i = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, i);
      buf = buf.slice(i + 1);
      if (!line.startsWith("data:")) continue;
      const data = line.slice(5).trim();
      if (!data) continue;
      let ev: { type?: string; delta?: { type?: string; text?: string }; error?: { message?: string } };
      try {
        ev = JSON.parse(data);
      } catch {
        continue;
      }
      if (ev.type === "content_block_delta" && ev.delta?.type === "text_delta") onChunk(ev.delta.text || "");
      else if (ev.type === "error") throw new Error(ev.error?.message || "stream error");
    }
  }
}

function mockReply(prompt: string): string {
  const p = (prompt || "").toLowerCase();
  const has = (...k: string[]) => k.some((w) => p.includes(w));
  if (has("hello", "hi ", "hey", "good morning", "good evening") || p.trim() === "hi")
    return "Hello! I'm running in offline demo mode, but I'm happy to help. Ask me to summarize text, brainstorm, explain a concept, or draft some code.\n\nTip: add your Claude API key in Settings → AI for real answers.";
  if (has("summar", "tl;dr", "shorten"))
    return "Here's a concise summary:\n\n• The core idea in a sentence or two.\n• Supporting details trimmed to what matters.\n• The takeaway, stated plainly.\n\n(Demo mode — connect a Claude API key in Settings for a real summary.)";
  if (has("code", "function", "bug", "refactor", "javascript", "python", "react"))
    return 'Here\'s a small example to start from:\n\n```js\nfunction greet(name) {\n  return `Hello, ${name}!`;\n}\nconsole.log(greet("world"));\n```\n\nTell me what you\'re building and I\'ll tailor it. (Demo mode — add a Claude key in Settings for full coding help.)';
  if (has("idea", "brainstorm", "suggest", "name"))
    return "A few directions to spark things:\n\n1. Start from the user's biggest frustration and remove a step.\n2. Combine two familiar things in an unexpected way.\n3. Make the boring part delightful.\n\nWant me to expand any of these? (Offline demo.)";
  if (has("explain", "what is", "how does", "why"))
    return "Good question. The short version:\n\nThink of it as a tool that takes an input, applies a clear rule, and returns a useful output — the value is choosing the right rule for the job. Tell me the specific case and I'll go deeper.\n\n(Demo mode — add a Claude API key for a precise answer.)";
  return "Got it — I'm in offline demo mode, so this is a placeholder reply that streams in like the real thing. Add your Claude API key in Settings → AI and I'll answer for real, with full context from this conversation.\n\nWhat would you like to do next?";
}

async function streamMock(history: ApiMessage[], { onChunk, signal }: RunOptions): Promise<void> {
  const lastUser = [...history].reverse().find((m) => m.role === "user");
  await delay(260 + Math.random() * 240);
  const text = mockReply(lastUser ? lastUser.content : "");
  const tokens = text.match(/\s+|\S+/g) || [text];
  for (const t of tokens) {
    if (signal?.aborted) throw new DOMException("aborted", "AbortError");
    onChunk(t);
    await delay(10 + Math.random() * 24);
  }
}

/** Run the engine: real Claude if a key is set, otherwise the offline mock. */
export async function runAI(history: ApiMessage[], opts: RunOptions): Promise<void> {
  if (isLive()) return streamClaude(history, opts);
  return streamMock(history, opts);
}
