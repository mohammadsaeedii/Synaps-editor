"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { IconButton } from "@/components/atoms/IconButton/IconButton";
import { runAI } from "@/lib/ai";
import { store, useStoreVersion } from "@/lib/store/store";
import type { FileItem } from "@/lib/store/types";
import { cx } from "@/lib/utils";
import s from "./TerminalPanel.module.css";

interface Line {
  kind: "echo" | "out" | "err" | "ai" | "dim" | "ls";
  text?: string;
  cmd?: string;
  prompt?: string;
  items?: { name: string; dir: boolean }[];
}

const HELP = [
  "Available commands:",
  "  ls            list this directory",
  "  cd <dir>      change directory ( .. up, / root )",
  "  cat <file>    print a file",
  "  pwd           print working directory",
  "  tree          print the file tree",
  "  ai <prompt>   ask the AI (streams a reply)",
  "  clear         clear the screen",
  "  help          show this help",
].join("\n");

export function TerminalPanel() {
  useStoreVersion();
  const p = store.activeProject();
  const pid = p?.id;
  const files = pid ? store.byProject("file", pid) : [];

  const [cwd, setCwd] = useState<string | null>(null); // dir id, null = root
  const [lines, setLines] = useState<Line[]>([{ kind: "dim", text: "synapse terminal — type 'help' for commands." }]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines]);

  const childrenOf = (dirId: string | null) => files.filter((f) => (f.parentId ?? null) === dirId);
  const pathOf = (dirId: string | null): string => {
    if (!dirId) return "/";
    const segs: string[] = [];
    let cur: FileItem | undefined = files.find((f) => f.id === dirId);
    while (cur) {
      segs.unshift(cur.name);
      cur = cur.parentId ? files.find((f) => f.id === cur!.parentId) : undefined;
    }
    return "/" + segs.join("/");
  };

  const promptStr = (dir: string | null) => `${p?.name ?? "synapse"} ${pathOf(dir)} $ `;

  const run = (raw: string) => {
    const cmd = raw.trim();
    const echo: Line = { kind: "echo", prompt: promptStr(cwd), cmd: raw };
    if (!cmd) {
      setLines((l) => [...l, echo]);
      return;
    }
    const [name, ...args] = cmd.split(/\s+/);
    const arg = args.join(" ");
    const add = (...newLines: Line[]) => setLines((l) => [...l, echo, ...newLines]);

    switch (name) {
      case "help":
        add({ kind: "dim", text: HELP });
        break;
      case "clear":
        setLines([]);
        break;
      case "pwd":
        add({ kind: "out", text: pathOf(cwd) });
        break;
      case "ls": {
        const kids = childrenOf(cwd).sort((a, b) => Number(b.dir) - Number(a.dir) || a.name.localeCompare(b.name));
        if (!kids.length) add({ kind: "dim", text: "(empty)" });
        else add({ kind: "ls", items: kids.map((k) => ({ name: k.name, dir: k.dir })) });
        break;
      }
      case "cd": {
        if (!arg || arg === "/") setCwd(null);
        else if (arg === "..") {
          const cur = files.find((f) => f.id === cwd);
          setCwd(cur?.parentId ?? null);
        } else {
          const target = childrenOf(cwd).find((f) => f.dir && f.name === arg);
          if (target) setCwd(target.id);
          else add({ kind: "err", text: `cd: no such directory: ${arg}` });
        }
        setLines((l) => [...l, echo]);
        break;
      }
      case "cat": {
        const f = childrenOf(cwd).find((x) => !x.dir && x.name === arg);
        if (f) add({ kind: "out", text: f.content || "(empty file)" });
        else add({ kind: "err", text: `cat: no such file: ${arg}` });
        break;
      }
      case "tree": {
        const lines2: string[] = [];
        const walk = (dirId: string | null, prefix: string) => {
          childrenOf(dirId)
            .sort((a, b) => Number(b.dir) - Number(a.dir) || a.name.localeCompare(b.name))
            .forEach((k) => {
              lines2.push(prefix + (k.dir ? "📁 " : "📄 ") + k.name);
              if (k.dir) walk(k.id, prefix + "  ");
            });
        };
        walk(cwd, "");
        add({ kind: "out", text: lines2.join("\n") || "(empty)" });
        break;
      }
      case "ai": {
        if (!arg) {
          add({ kind: "err", text: "ai: provide a prompt" });
          break;
        }
        setLines((l) => [...l, echo, { kind: "ai", text: "" }]);
        let acc = "";
        void runAI([{ role: "user", content: arg }], {
          onChunk: (t) => {
            acc += t;
            setLines((l) => {
              const copy = l.slice();
              copy[copy.length - 1] = { kind: "ai", text: acc };
              return copy;
            });
          },
        }).catch((e) => add({ kind: "err", text: "ai error: " + (e as Error).message }));
        break;
      }
      default:
        add({ kind: "err", text: `command not found: ${name} — try 'help'` });
    }
  };

  return (
    <div className={s.root} onClick={() => inputRef.current?.focus()}>
      <div className={s.bar}>
        <span className={s.barDot} />
        <span className={s.cwd}>{pathOf(cwd)}</span>
        <span className={s.barSpacer} />
        <IconButton icon="trash" size={24} iconSize={14} title="Clear" onClick={() => setLines([])} />
      </div>
      <div className={s.scroll} ref={scrollRef}>
        {lines.map((l, i) => (
          <LineView key={i} line={l} />
        ))}
        <div className={s.line}>
          <span className={s.prompt}>
            <span className={s.promptProj}>{p?.name ?? "synapse"}</span>
            <span className={s.promptPath}> {pathOf(cwd)}</span>
            <span className={s.promptSig}> $ </span>
          </span>
          <input
            ref={inputRef}
            className={s.input}
            value={input}
            autoFocus
            spellCheck={false}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                run(input);
                setInput("");
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}

function LineView({ line }: { line: Line }): ReactNode {
  if (line.kind === "echo")
    return (
      <div className={s.echo}>
        <span className={s.echoPrompt}>{line.prompt}</span>
        <span className={s.echoCmd}>{line.cmd}</span>
      </div>
    );
  if (line.kind === "ls")
    return (
      <div className={s.ls}>
        {line.items?.map((it) => (
          <span key={it.name} className={it.dir ? s.lsDir : s.lsFile}>
            {it.dir ? it.name + "/" : it.name}
          </span>
        ))}
      </div>
    );
  return <div className={cx(s.out, line.kind === "err" && s.err, line.kind === "ai" && s.ai, line.kind === "dim" && s.dim)}>{line.text}</div>;
}
