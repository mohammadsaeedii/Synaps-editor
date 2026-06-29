# synapse — Next.js + atomic design system

A migration of the vanilla-JS **synapse** AI workspace (in the repo root) to
**Next.js (App Router) + TypeScript**, rebuilt as a **token-driven design system**
organised by **atomic design**. The original markup and CSS were ported
faithfully — the dark/light themes, six accents, and IDE layout are
pixel-for-pixel — but every view is now a typed React component with a scoped
CSS Module.

```
✓ next build           ✓ tsc --noEmit            ✓ logic smoke-tested
44 kB route            zero runtime UI deps      dark + light + 6 accents
```

## Stack

- **Next.js 15** App Router, **React 19**, **TypeScript** (strict).
- **Styling:** the original CSS custom-property tokens are the design-system
  core (`src/design/tokens.css`); every component ships a scoped
  `*.module.css`. No Tailwind, no CSS-in-JS, no UI libraries.
- **State:** the original "one store, one bus" ported to a singleton wired into
  React with `useSyncExternalStore`, persisted to `localStorage["synapse:v2"]`.

## Run it

```bash
cd next
npm install
npm run dev      # http://localhost:3000
# or
npm run build && npm run start
```

`npm run typecheck` runs `tsc --noEmit`.

## Atomic design structure

```
next/
├── app/
│   ├── layout.tsx            # <html data-theme> shell + global css
│   ├── page.tsx              # client-mounted workspace (SPA)
│   └── globals.css           # imports tokens + markdown; base reset only
└── src/
    ├── design/               # ── the design system ──
    │   ├── tokens.css         #   colour / type / radius / shadow / layout vars
    │   ├── markdown.css       #   styles for rendered markdown (global)
    │   └── icons.tsx          #   the typed <Icon name=…> set (~80 glyphs)
    ├── components/
    │   ├── atoms/             #   Button, IconButton, Input, Select, Toggle,
    │   │                      #   Badge, TagChip, Swatch, Dot, Typing, Kbd, Icon
    │   ├── molecules/         #   Field, Segmented, TagChips, EmptyState,
    │   │                      #   PanelHeader, Brand, PaletteTrigger, StatusItem,
    │   │                      #   Splitter
    │   ├── organisms/         #   TopBar, ActivityBar, SidePanel, Explorer,
    │   │   ├── …               #   SearchView, EditorArea, BottomDock, StatusBar,
    │   │   ├── overlays/       #   RightPreview, ProjectSwitcher, CommandPalette,
    │   │   └── panels/         #   overlays (Toasts/ContextMenu/Dialog) + 11 panels
    │   └── templates/
    │       └── WorkspaceShell # the IDE layout that composes every organism
    └── lib/                   # ── non-visual core ──
        ├── store/             #   types, kinds, seed, store (+ React bindings)
        ├── ai.ts              #   pluggable engine: offline mock + Claude SSE
        ├── markdown.ts · fuzzy.ts · utils.ts
        ├── panels.ts          #   panel metadata (title/icon/kind/single)
        ├── workspace.tsx      #   orchestrator: tabs, dock, theme, toasts, menus
        └── item-actions.ts    #   shared rename/duplicate/delete/tag menus
```

Each component is one folder: `Component.tsx` + `Component.module.css`. Atoms and
molecules are re-exported from barrels (`components/atoms/index.ts`,
`components/molecules/index.ts`).

## Design system

- **Tokens** — every colour, radius, shadow, font and IDE metric is a CSS
  custom property, ported verbatim. `[data-theme="light"]` overrides the palette;
  the `WorkspaceProvider` applies `data-theme`, the accent vars and
  `data-motion` from Settings.
- **Icons** — a single typed `<Icon name="chat" />` component backed by the
  original 24-grid stroke set.
- **Components** scale up atoms → molecules → organisms → the `WorkspaceShell`
  template → the `app/` page.

## State & data flow

`lib/store/store.ts` is the single source of truth: a v2 state tree, a generic
collection layer keyed by KIND (`chat file note task prompt memory`), an activity
log, global fuzzy search and project/folder management — identical surface to the
original `store.js`. Every mutator persists (debounced) and bumps a version
counter; components subscribe through `useStore(selector)` /
`useStoreVersion()`. On first load the store seeds a believable demo workspace
(four projects, nested chat folders, a file tree, a kanban backlog, prompts,
memory, git history, agents).

`lib/workspace.tsx` is the React replacement for the old `dock.js` + `ui.js`
hosts + `app.js`: it owns editor tab groups, the side/bottom/right regions
(persisted in `session`), theming, and the transient surfaces (toasts, dialogs,
context menu, command palette).

## Depth

Per the migration brief this pass goes **deep on the shell + Chat** and ships the
other panels as faithful, lighter-logic organisms:

| Area | State |
|---|---|
| Design system, tokens, theming (dark/light/accents/motion) | ✅ full |
| IDE shell — top bar, activity bar, resizable side/dock/right, status bar | ✅ full |
| Editor tab groups, split view, ⌘K command palette + global search | ✅ full |
| Explorer tree (nest, expand, filter, context menus, open) | ✅ (drag-reorder omitted) |
| **Chat** — streaming, regenerate, edit-and-resend, model picker, prompt insert | ✅ full |
| Files · Notes · Prompts · Memory · Settings | ✅ functional editors |
| Tasks (board + list + detail drawer), Terminal (emulator), Git, Agents | ✅ faithful markup + core actions |

### Parity notes (intentional simplifications)

- **Drag-and-drop** reordering (explorer rows, editor tabs, kanban cards) is not
  ported; the equivalent actions live in context menus / status pickers.
- **Split editor** groups are a fixed 50/50; the side, dock and preview regions
  are fully resizable (and persisted).
- Store updates use **coarse invalidation** (a version bump re-renders
  subscribers) — the same "re-render the slice" model as the original, fine at
  this scale.
- The one-time **`synapse:v1` → v2 migration** is not carried over; this app
  seeds a fresh v2 workspace.

## Keyboard

`⌘K` search · `⌘⇧P` commands · `⌘B` side · `⌘J` dock · `⌥⌘B` preview ·
`⌘\` split · `⌘N` new chat · `⌃\`` terminal · `⇧⌘E` explorer · `⇧⌘F` search.

## Using a real Claude model

Offline mock by default. In **Settings → AI engine**, paste an Anthropic key
(`sk-ant-…`) — it is stored only in this browser and sent directly to
`api.anthropic.com` with the `anthropic-dangerous-direct-browser-access` header
and SSE streaming. Chat, the terminal's `ai <prompt>`, and Agents all stream real
replies once a key is set.
