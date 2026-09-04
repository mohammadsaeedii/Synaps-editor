/* =========================================================================
   synapse · store — seed + blank
   A believable, lived-in demo workspace (four projects, nested chat folders, a
   file tree, notes, a kanban backlog, a prompt library, memory cards, a git
   history and a few agents) plus the empty `blank()` tree. Ported from the
   original store.js seed so the Next.js app boots with identical content.
   ========================================================================= */
import { uid } from "../utils";
import { emptyApiKeys } from "../ai/catalog";
import { ACCENTS } from "./kinds";
import type {
  Activity,
  AppState,
  Chat,
  ChatMessage,
  FileItem,
  Memory,
  Note,
  Prompt,
  Project,
  Settings,
  Task,
} from "./types";

export function defaultSettings(): Settings {
  return {
    theme: "dark",
    accent: "violet",
    density: "comfortable",
    name: "Navid",
    plan: "Pro plan",
    model: "claude-opus-4-8",
    provider: "anthropic",
    apiKey: "",
    apiKeys: emptyApiKeys(),
    systemPrompt: "",
    reduceMotion: false,
  };
}

export function blank(): AppState {
  return {
    version: 2,
    ui: { activeProjectId: null, activeChatId: null },
    session: {
      sideView: "explorer",
      sideOpen: true,
      dockOpen: false,
      rightOpen: false,
      dockTab: "terminal",
      groups: null,
      activeGroup: 0,
      sideWidth: 264,
      dockHeight: 220,
      rightWidth: 360,
      explorer: { groups: {}, query: "", tag: "", favOnly: false },
    },
    settings: defaultSettings(),
    projects: {},
    projectOrder: [],
    folders: {},
    chats: {},
    files: {},
    notes: {},
    tasks: {},
    prompts: {},
    memory: {},
    git: {},
    terminals: {},
    agents: {},
    activity: [],
  };
}

export function seed(): AppState {
  const S = blank();
  const now = Date.now();
  const min = 60000;
  const hr = 3600000;
  const day = 86400000;

  const colorKeys = Object.keys(ACCENTS);
  const logActivity = (action: string, kind: string, obj: { id: string; projectId?: string | null; title?: string; name?: string }) => {
    S.activity.unshift({
      id: uid(),
      action,
      kind,
      refId: obj.id,
      projectId: obj.projectId ?? null,
      title: obj.title || obj.name || "Untitled",
      ts: Date.now(),
    } as Activity);
  };

  const project = (name: string, color: string, description: string): Project => {
    const id = uid();
    const p: Project = { id, name, color, icon: "project", description, pinned: false, createdAt: now, updatedAt: now };
    S.projects[id] = p;
    S.projectOrder.push(id);
    S.git[id] = { branch: "main", branches: [{ name: "main", head: null }], commits: [], working: [] };
    S.terminals[id] = { cwd: "/", history: [] };
    return p;
  };

  const base = (projectId: string) => ({
    id: uid(),
    projectId,
    pinned: false,
    favorite: false,
    tags: [] as string[],
    createdAt: now,
    updatedAt: now,
  });

  const P = project("AI Chatbot", "violet", "Vanilla-JS AI workspace — the app you're looking at.");
  const Pcrm = project("CRM Revamp", "blue", "Customer dashboard redesign + pipeline automation.");
  const Pp = project("Personal", "green", "Notes, reading list and life admin.");
  project("Experiments", "amber", "Throwaway spikes and prototypes.");
  S.ui.activeProjectId = P.id;

  /* folders + chats under AI Chatbot */
  const folder = (name: string, projectId: string, parentId: string | null = null) => {
    const id = uid();
    S.folders[id] = { id, name, projectId, parentId, expanded: true, order: Date.now() };
    return S.folders[id];
  };
  const fArch = folder("Architecture", P.id);
  const fBack = folder("Backend", P.id);
  const fFront = folder("Frontend", P.id);

  const chat = (
    title: string,
    folderId: string | null,
    msgs: { r: "user" | "assistant"; t: string; meta?: boolean }[],
    ageMin: number,
    extra: Partial<Chat> = {},
  ): Chat => {
    const c: Chat = {
      ...base(extra.projectId ?? P.id),
      title,
      folderId: folderId || null,
      archived: false,
      system: "",
      persona: "",
      model: "",
      messages: [],
      ...extra,
    };
    c.createdAt = now - ageMin * min;
    c.updatedAt = now - ageMin * min;
    c.messages = msgs.map((m, i): ChatMessage => ({ id: uid(), role: m.r, text: m.t, ts: now - ageMin * min + i * 1000, meta: m.meta || false }));
    S.chats[c.id] = c;
    logActivity("opened", "chat", c);
    return c;
  };

  chat(
    "Panel layout system",
    fArch.id,
    [
      { r: "user", t: "How should I structure a resizable multi-panel IDE layout in vanilla JS?" },
      { r: "assistant", t: "Use a fixed set of dock regions (side, editor, right, bottom) separated by draggable splitters. Persist each region's size to localStorage, and let the editor area hold tab groups so you can split it. Keep panel content lazy — only mount when a tab activates." },
    ],
    18,
  );
  chat(
    "State + persistence",
    fArch.id,
    [
      { r: "user", t: "What's a clean way to keep all panels in sync with one store?" },
      { r: "assistant", t: "One state tree, a tiny pub/sub bus, and a generic collection layer keyed by item kind. Every mutator saves then emits a `changed` event; panels subscribe and re-render the slice they care about." },
    ],
    64,
    { pinned: true },
  );
  const cStream = chat(
    "Streaming SSE parser",
    fBack.id,
    [
      { r: "user", t: "Parse Anthropic SSE in the browser without a library." },
      { r: "assistant", t: "Read `res.body.getReader()`, decode chunks, split on newlines, and for each `data:` line JSON-parse it. Forward `content_block_delta` text deltas to your renderer; throw on `error` events." },
    ],
    120,
  );
  chat(
    "Composer keyboard UX",
    fFront.id,
    [
      { r: "user", t: "Enter to send, Shift+Enter for newline — how?" },
      { r: "assistant", t: "Listen on keydown: if Enter and not shiftKey, preventDefault and send; otherwise let the textarea insert a newline. Auto-grow the textarea by syncing its height to scrollHeight." },
    ],
    240,
  );
  chat(
    "Dark theme tokens",
    fFront.id,
    [
      { r: "user", t: "Pick a calm dark palette for an IDE." },
      { r: "assistant", t: "Anchor on a near-black blue-grey background (#0e1116), one elevated surface (#171b22), a hairline border (rgba white 8%), and a single accent for selection. Keep text at ~#e6e9ef with a dimmer ~#9aa4b2 for secondary." },
    ],
    30,
    { favorite: true },
  );
  chat(
    "Welcome to synapse",
    null,
    [{ r: "assistant", t: "This is your AI workspace. Open files, take notes, track tasks, run the terminal, and chat — all in one place. Add a Claude API key in Settings to get real answers.", meta: true }],
    5,
  );
  S.ui.activeChatId = cStream.id;

  chat(
    "Pipeline stages",
    null,
    [
      { r: "user", t: "Sketch a lead pipeline." },
      { r: "assistant", t: "New → Contacted → Qualified → Proposal → Won/Lost. Track stage age and owner; flag anything stuck >7 days." },
    ],
    300,
    { projectId: Pcrm.id },
  );
  const personalChat = chat("Reading list ideas", null, [], 200, { projectId: Pp.id });
  personalChat.title = "Reading list ideas";

  /* files (a small tree under AI Chatbot) */
  const dir = (name: string, parentId: string | null): FileItem => {
    const f: FileItem = { ...base(P.id), name, parentId: parentId || null, dir: true, content: "", language: "text" };
    S.files[f.id] = f;
    return f;
  };
  const file = (name: string, parentId: string | null, language: string, content: string, extra: Partial<FileItem> = {}): FileItem => {
    const f: FileItem = { ...base(P.id), name, parentId: parentId || null, dir: false, content, language, ...extra };
    S.files[f.id] = f;
    logActivity("opened", "file", f);
    return f;
  };
  const srcDir = dir("src", null);
  file("app.js", srcDir.id, "javascript", "// synapse bootstrap\nApp.dock.start();\nApp.store.ready();\n\nconsole.log('workspace ready');\n", { favorite: true });
  file("store.js", srcDir.id, "javascript", "// one state tree, pub/sub, generic collections\nexport const store = createStore();\n");
  file("theme.css", srcDir.id, "css", ":root{\n  --bg:#0e1116;\n  --surface:#171b22;\n  --accent:#8b5cf6;\n}\n");
  file("README.md", null, "markdown", "# AI Chatbot\n\nA vanilla-JS AI **workspace** — chat, files, notes, tasks, terminal and git in one place.\n\n- No build step\n- Runs from `file://`\n- State in localStorage\n", { pinned: true });
  file("package.json", null, "json", '{\n  "name": "synapse",\n  "version": "2.0.0",\n  "private": true\n}\n');
  file("notes.txt", null, "text", "Scratch space.\n- try a command palette\n- ship the dock\n");

  /* notes */
  const note = (title: string, content: string, ageHr: number, extra: Partial<Note> = {}): Note => {
    const nn: Note = { ...base(P.id), title, content, ...extra };
    nn.updatedAt = now - ageHr * hr;
    nn.createdAt = now - ageHr * hr - day;
    S.notes[nn.id] = nn;
    logActivity("edited", "note", nn);
    return nn;
  };
  note("Architecture decisions", "# Architecture\n\n- **No bundler.** Several classic scripts share `window.App`.\n- **One store.** All panels read/write the same tree.\n- **Dock manager** owns layout + persistence.\n\n## Open questions\n- [ ] Virtualize very long lists\n- [x] Splitter drag math\n", 2, { pinned: true, tags: ["architecture", "design"] });
  note("Meeting — design review", "Discussed the activity-bar model and split editor.\n\nNext: wire the command palette to global search.", 26, { tags: ["meeting"] });
  note("Color palette", "Accent options: violet (default), blue, green, amber.\nKeep one accent per workspace for calm.", 50, { favorite: true, tags: ["design"] });

  /* tasks */
  const task = (title: string, status: Task["status"], priority: Task["priority"], tags: string[], ageHr: number, extra: Partial<Task> = {}): Task => {
    const t: Task = { ...base(P.id), title, status, priority, due: null, notes: "", order: now - ageHr * hr, tags, ...extra };
    t.updatedAt = now - ageHr * hr;
    S.tasks[t.id] = t;
    return t;
  };
  task("Build resizable dock layout", "done", "high", ["frontend"], 40);
  task("Generic collection store", "done", "high", ["architecture"], 30);
  task("Command palette (⌘K)", "doing", "high", ["frontend", "urgent"], 4, { favorite: true });
  task("Drag & drop in explorer", "doing", "med", ["frontend"], 2);
  task("Git graph rendering", "todo", "med", ["git"], 1);
  task("Virtualize long lists", "todo", "low", ["perf"], 8);
  task("Write README", "todo", "low", ["docs"], 12);
  task("Terminal command emulator", "doing", "med", ["terminal"], 6);

  /* prompts */
  const prompt = (title: string, body: string, tags: string[], extra: Partial<Prompt> = {}): Prompt => {
    const p: Prompt = { ...base(P.id), title, body, uses: 0, tags, ...extra };
    S.prompts[p.id] = p;
    return p;
  };
  prompt("Code reviewer", "Review the following code for correctness, readability and edge cases. Be concrete and suggest concise fixes:\n\n", ["dev"], { pinned: true, uses: 12 });
  prompt("Explain like I'm five", "Explain the following concept in simple terms with a short analogy:\n\n", ["learning"], { uses: 7 });
  prompt("Refactor for clarity", "Refactor this code to be clearer and simpler without changing behavior. Keep the same public API:\n\n", ["dev"], { uses: 4, favorite: true });
  prompt("Commit message", "Write a concise conventional-commit message for this diff:\n\n", ["git", "dev"], { uses: 9 });
  prompt("Brainstorm names", "Brainstorm 10 short, memorable names for: ", ["ideas"]);

  /* memory */
  const memory = (title: string, body: string, tags: string[], extra: Partial<Memory> = {}): Memory => {
    const m: Memory = { ...base(P.id), title, body, scope: "project", tags, ...extra };
    S.memory[m.id] = m;
    return m;
  };
  memory("Stack", "Vanilla HTML/CSS/JS, no build step, runs from file://. Multiple classic scripts share window.App.", ["project"], { pinned: true });
  memory("Voice & tone", "Prefer concise, direct answers. Code first, explanation second.", ["style"]);
  memory("Constraints", "No backend. Terminal/Git/Agents are believable simulations over local state.", ["project"]);

  /* git history under AI Chatbot */
  const g = S.git[P.id];
  const commit = (msg: string, author: string, ageHr: number, files: string[]) => {
    const hash = uid().slice(0, 7);
    g.commits.unshift({ hash, msg, author, ts: now - ageHr * hr, files: files || [] });
    return hash;
  };
  commit("Seed a believable workspace", "Navid", 1, ["js/store.js"]);
  commit("Add resizable dock + activity bar", "Navid", 6, ["js/dock.js", "styles.css"]);
  commit("Generic collection layer", "Navid", 28, ["js/store.js"]);
  commit("Project scaffold", "Navid", 52, ["index.html", "js/core.js"]);
  g.branches = [
    { name: "main", head: g.commits[0].hash },
    { name: "feature/agents", head: g.commits[1].hash },
  ];
  g.working = [
    { path: "js/dock.js", status: "M" },
    { path: "styles.css", status: "M" },
    { path: "js/panel-agents.js", status: "A" },
  ];

  /* agents */
  const agent = (name: string, role: string, model: string, status: "idle" | "running" | "done" | "stopped", runs: import("./types").AgentRun[] = []) => {
    const id = uid();
    S.agents[id] = { id, name, role, model, status, projectId: P.id, system: "", createdAt: now, runs };
    return S.agents[id];
  };
  agent("Refactor Bot", "Refactors and simplifies code on request", "claude-opus-4-8", "idle", [
    { id: uid(), goal: "Simplify dock.js splitter math", status: "done", ts: now - 3 * hr, log: ["Read js/dock.js (320 lines)", "Identified duplicated clamp logic", "Extracted clampSize() helper", "Applied to 3 call sites", "Done — 11 lines removed"] },
  ]);
  agent("Docs Writer", "Keeps the README and inline docs current", "claude-sonnet-4-6", "idle");
  agent("Test Runner", "Runs the jsdom smoke suite and reports failures", "claude-haiku-4-5", "idle", [
    { id: uid(), goal: "Smoke test boot", status: "done", ts: now - day, log: ["Booting jsdom…", "Store seeded ✓", "Dock mounted ✓", "5 panels registered ✓", "All checks passed"] },
  ]);

  return S;
}
