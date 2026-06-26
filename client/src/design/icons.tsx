/* =========================================================================
   synapse · design system — icons
   The complete 24-grid stroke icon set from the original core.js, exposed as a
   typed <Icon name="…" /> component. Each entry stores the inner SVG markup;
   the wrapper normalises viewBox + sizing so CSS (`… svg { width }`) keeps full
   control, exactly like the original. A few glyphs fill from the <svg> element
   itself and are listed in FILLED.
   ========================================================================= */
import type { CSSProperties } from "react";

export const ICONS = {
  /* brand / chrome */
  logo: `<path d="M12 2c.6 2.2 2 3.6 4.2 4.2C14 6.8 12.6 8.2 12 10.4 11.4 8.2 10 6.8 7.8 6.2 10 5.6 11.4 4.2 12 2Zm6.5 6.5c.4 1.5 1.4 2.5 2.9 2.9-1.5.4-2.5 1.4-2.9 2.9-.4-1.5-1.4-2.5-2.9-2.9 1.5-.4 2.5-1.4 2.9-2.9ZM6 11c.4 1.6 1.5 2.7 3.1 3.1C7.5 14.5 6.4 15.6 6 17.2 5.6 15.6 4.5 14.5 2.9 14.1 4.5 13.7 5.6 12.6 6 11Z" fill="currentColor"/>`,
  sparkle: `<path d="M12 4c.5 1.8 1.6 2.9 3.4 3.4C13.6 7.9 12.5 9 12 10.8 11.5 9 10.4 7.9 8.6 7.4 10.4 6.9 11.5 5.8 12 4Zm5 6c.3 1.2 1.1 2 2.3 2.3-1.2.3-2 1.1-2.3 2.3-.3-1.2-1.1-2-2.3-2.3 1.2-.3 2-1.1 2.3-2.3Z" fill="currentColor"/>`,
  bot: `<path d="M12 4c.5 1.8 1.6 2.9 3.4 3.4C13.6 7.9 12.5 9 12 10.8 11.5 9 10.4 7.9 8.6 7.4 10.4 6.9 11.5 5.8 12 4Zm5 6c.3 1.2 1.1 2 2.3 2.3-1.2.3-2 1.1-2.3 2.3-.3-1.2-1.1-2-2.3-2.3 1.2-.3 2-1.1 2.3-2.3Z" fill="currentColor"/>`,

  /* activity-bar / panels */
  explorer: `<path d="M4 7.5A2 2 0 0 1 6 5.5h3.2l1.6 1.6h6.2A2 2 0 0 1 19 9.1v7.4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7.5Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>`,
  search: `<circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="1.7"/><path d="m20 20-3.2-3.2" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>`,
  chat: `<path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v6A2.5 2.5 0 0 1 17.5 15H10l-4.2 3.4A1 1 0 0 1 4 17.6V6.5Z" stroke="currentColor" stroke-width="1.5"/>`,
  files: `<path d="M13 4H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V10l-6-6Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M13 4v6h6" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>`,
  notes: `<path d="M6 3.5h8.5L19 8v12.5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-16a1 1 0 0 1 1-1Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M14 3.5V8h4.5M8.5 12.5h7M8.5 16h5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`,
  tasks: `<rect x="4.5" y="4.5" width="15" height="15" rx="3" stroke="currentColor" stroke-width="1.6"/><path d="m8.5 12 2.2 2.2 4.3-4.4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>`,
  prompts: `<path d="M5 5.5h14M5 10h9M5 14.5h14M5 19h9" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="m18 13 3 3-3 3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`,
  memory: `<path d="M9 4.5A3.5 3.5 0 0 0 5.5 8v.6A3 3 0 0 0 4 11.2c0 1 .5 1.9 1.2 2.5A3 3 0 0 0 8 18.5a3 3 0 0 0 4 .3 3 3 0 0 0 4-.3 3 3 0 0 0 2.8-4.8c.7-.6 1.2-1.5 1.2-2.5a3 3 0 0 0-1.5-2.6V8A3.5 3.5 0 0 0 15 4.5a3 3 0 0 0-3 1 3 3 0 0 0-3-1Z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><path d="M12 6v13" stroke="currentColor" stroke-width="1.3"/>`,
  terminal: `<rect x="3.5" y="5" width="17" height="14" rx="2.5" stroke="currentColor" stroke-width="1.6"/><path d="m7.5 10 2.5 2.2-2.5 2.2M12.5 14.6h4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`,
  git: `<circle cx="6.5" cy="6.5" r="2.4" stroke="currentColor" stroke-width="1.6"/><circle cx="6.5" cy="17.5" r="2.4" stroke="currentColor" stroke-width="1.6"/><circle cx="17.5" cy="9" r="2.4" stroke="currentColor" stroke-width="1.6"/><path d="M6.5 9v6M6.5 12.5h6.5A2.5 2.5 0 0 0 15.5 10v-.4" stroke="currentColor" stroke-width="1.6"/>`,
  agents: `<rect x="5" y="8" width="14" height="11" rx="3" stroke="currentColor" stroke-width="1.6"/><path d="M12 4.5v3M9 13h.01M15 13h.01M9.5 16.5h5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><circle cx="12" cy="4" r="1.3" fill="currentColor"/>`,
  overview: `<rect x="4" y="4" width="7" height="9" rx="1.6" stroke="currentColor" stroke-width="1.6"/><rect x="13" y="4" width="7" height="5" rx="1.6" stroke="currentColor" stroke-width="1.6"/><rect x="13" y="12" width="7" height="8" rx="1.6" stroke="currentColor" stroke-width="1.6"/><rect x="4" y="16" width="7" height="4" rx="1.6" stroke="currentColor" stroke-width="1.6"/>`,
  settings: `<circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.6"/><path d="M19.4 13.5a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V20a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H4a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1A2 2 0 1 1 8 3.3l.1.1a1.6 1.6 0 0 0 1.8.3H10a1.6 1.6 0 0 0 1-1.5V2a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V8a1.6 1.6 0 0 0 1.5 1H20a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1Z" stroke="currentColor" stroke-width="1.4"/>`,

  /* tree / files */
  folder: `<path d="M3.5 7A1.8 1.8 0 0 1 5.3 5.2h3l1.6 1.7h7A1.8 1.8 0 0 1 18.7 8.7V16a1.8 1.8 0 0 1-1.8 1.8H5.3A1.8 1.8 0 0 1 3.5 16V7Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>`,
  folderOpen: `<path d="M3.5 7A1.8 1.8 0 0 1 5.3 5.2h3l1.6 1.7h7A1.8 1.8 0 0 1 18.7 8.7v.8H7.4a1.5 1.5 0 0 0-1.45 1.1L4.2 17M4.2 17l1.6-6.1M4.2 17h12.4a1.5 1.5 0 0 0 1.45-1.1l1.2-4.4A1 1 0 0 0 19.5 10.2H7.4a1.5 1.5 0 0 0-1.45 1.1L4.2 17Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>`,
  file: `<path d="M13 3.5H7.5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V9l-5.5-5.5Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M13 3.5V9h5.5" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>`,
  project: `<rect x="4" y="5" width="16" height="14" rx="2.5" stroke="currentColor" stroke-width="1.6"/><path d="M4 9h16M8 5V3.5M16 5V3.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>`,

  /* actions */
  plus: `<path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>`,
  send: `<path d="M5 12h13M12 5.5 18.5 12 12 18.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`,
  stop: `<rect x="6" y="6" width="12" height="12" rx="2.5" fill="currentColor"/>`,
  close: `<path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>`,
  chevron: `<path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`,
  chevronDown: `<path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`,
  more: `<circle cx="5" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="19" cy="12" r="1.7"/>`,
  edit: `<path d="M4 20h4L18.5 9.5a2 2 0 0 0-2.8-2.8L5 17.2V20Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="m14 8 2.8 2.8" stroke="currentColor" stroke-width="1.6"/>`,
  trash: `<path d="M5 7h14M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m1 0v12a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`,
  copy: `<rect x="8" y="8" width="11" height="12" rx="2" stroke="currentColor" stroke-width="1.6"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" stroke="currentColor" stroke-width="1.6"/>`,
  duplicate: `<rect x="8" y="8" width="11" height="12" rx="2" stroke="currentColor" stroke-width="1.6"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" stroke="currentColor" stroke-width="1.6"/>`,
  pin: `<path d="M14 2 22 10l-3 1-4 4 .5 5L13 22l-4-4-4.5 1.5L6 15 2 11l5-.5 4-4L12 2.5 14 2Z"/>`,
  pinOutline: `<path d="M14 2 22 10l-3 1-4 4 .5 5L13 22l-4-4-4.5 1.5L6 15 2 11l5-.5 4-4L12 2.5 14 2Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>`,
  star: `<path d="m12 3.6 2.5 5.1 5.6.8-4.05 3.95.96 5.58L12 16.4l-5 2.6.96-5.58L3.9 9.5l5.6-.8L12 3.6Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>`,
  starFill: `<path d="m12 3.6 2.5 5.1 5.6.8-4.05 3.95.96 5.58L12 16.4l-5 2.6.96-5.58L3.9 9.5l5.6-.8L12 3.6Z"/>`,
  tag: `<path d="M4 4.5h7l9 9-6.5 6.5-9-9v-6.5Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><circle cx="8" cy="8" r="1.3" fill="currentColor"/>`,
  filter: `<path d="M4 6h16M7 12h10M10 18h4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>`,
  archive: `<rect x="4" y="5" width="16" height="4" rx="1" stroke="currentColor" stroke-width="1.6"/><path d="M5.5 9v8.5a1.5 1.5 0 0 0 1.5 1.5h10a1.5 1.5 0 0 0 1.5-1.5V9M10 13h4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>`,
  share: `<path d="M12 15V4m0 0L8.5 7.5M12 4l3.5 3.5M5 13v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`,
  download: `<path d="M12 4v10m0 0 4-4m-4 4-4-4M5 18.5h14" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`,
  move: `<path d="M12 4v16M4 12h16M12 4 9 7m3-3 3 3M12 20l-3-3m3 3 3-3M4 12l3-3m-3 3 3 3M20 12l-3-3m3 3-3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`,
  check: `<path d="M5 12.5 10 17l9-10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
  play: `<path d="M7 5.5 18 12 7 18.5v-13Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>`,
  regen: `<path d="M20 11a8 8 0 1 0-1.3 5M20 5v6h-6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`,
  up: `<path d="M7 10v10H4V10h3Zm3 0 3-6a2 2 0 0 1 2 2v3h4.2a1.8 1.8 0 0 1 1.8 2.2l-1.3 6A2 2 0 0 1 18 20h-8V10Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>`,
  down: `<path d="M17 14V4h3v10h-3Zm-3 0-3 6a2 2 0 0 1-2-2v-3H4.8A1.8 1.8 0 0 1 3 12.8l1.3-6A2 2 0 0 1 6 4h8v10Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>`,
  attach: `<path d="M20 11.5 12.5 19a4.5 4.5 0 0 1-6.4-6.4l7.4-7.4a3 3 0 0 1 4.3 4.3l-7.4 7.4a1.5 1.5 0 0 1-2.2-2.1l6.6-6.6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`,
  menu: `<path d="M4 6.5h16M4 12h16M4 17.5h16" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>`,
  split: `<rect x="4" y="5" width="16" height="14" rx="2" stroke="currentColor" stroke-width="1.6"/><path d="M12 5v14" stroke="currentColor" stroke-width="1.6"/>`,
  sidebar: `<rect x="3.5" y="4.5" width="17" height="15" rx="2.5" stroke="currentColor" stroke-width="1.6"/><path d="M9.5 4.5v15" stroke="currentColor" stroke-width="1.6"/>`,
  panelBottom: `<rect x="3.5" y="4.5" width="17" height="15" rx="2.5" stroke="currentColor" stroke-width="1.6"/><path d="M3.5 15h17" stroke="currentColor" stroke-width="1.6"/>`,
  command: `<path d="M9 6.5A2.5 2.5 0 1 0 6.5 9H9V6.5ZM15 6.5A2.5 2.5 0 1 1 17.5 9H15V6.5ZM9 17.5A2.5 2.5 0 1 1 6.5 15H9v2.5ZM15 17.5a2.5 2.5 0 1 0 2.5-2.5H15v2.5ZM9 9h6v6H9V9Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>`,
  dot: `<circle cx="12" cy="12" r="4" fill="currentColor"/>`,
  clock: `<circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="1.6"/><path d="M12 8v4.2l2.8 1.8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>`,
  info: `<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.6"/><path d="M12 11v5m0-8.2v.2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>`,
  warn: `<path d="M12 4 21 19H3L12 4Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M12 10v4m0 2.4v.2" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>`,
  user: `<circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="1.6"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>`,
  palette: `<path d="M12 3a9 9 0 0 0 0 18c1.4 0 2-1 2-1.8 0-.5-.2-.8-.5-1.2-.3-.3-.5-.7-.5-1.2 0-.9.8-1.6 1.7-1.6H16a5 5 0 0 0 5-5c0-3.9-4-7-9-7Z" stroke="currentColor" stroke-width="1.6"/><circle cx="7.5" cy="11.5" r="1" fill="currentColor"/><circle cx="12" cy="8" r="1" fill="currentColor"/><circle cx="16.5" cy="11" r="1" fill="currentColor"/>`,
  cpu: `<rect x="6" y="6" width="12" height="12" rx="2.5" stroke="currentColor" stroke-width="1.6"/><rect x="9" y="9" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.6"/><path d="M9 3v2m6-2v2M9 19v2m6-2v2M3 9h2m-2 6h2m14-6h2m-2 6h2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>`,
  db: `<ellipse cx="12" cy="6" rx="7" ry="3" stroke="currentColor" stroke-width="1.6"/><path d="M5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3" stroke="currentColor" stroke-width="1.6"/>`,
  key: `<circle cx="8" cy="8" r="4" stroke="currentColor" stroke-width="1.6"/><path d="M11 11l8 8m-3-3 2-2m-4 0 2-2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>`,
  code: `<path d="m9 8-4 4 4 4m6-8 4 4-4 4M13 5l-2 14" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`,
  bulb: `<path d="M9 18h6M10 21h4M12 3a6 6 0 0 1 3.5 10.9c-.6.5-.9 1-.9 1.6H9.4c0-.6-.3-1.1-.9-1.6A6 6 0 0 1 12 3Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>`,
  book: `<path d="M4 5.5A2 2 0 0 1 6 3.5h5V20H6a2 2 0 0 0-2 2V5.5Zm16 0A2 2 0 0 0 18 3.5h-5V20h5a2 2 0 0 1 2 2V5.5Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>`,
  pen: `<path d="M4 20h4L18.5 9.5a2 2 0 0 0-2.8-2.8L5 17.2V20Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="m14 8 2.8 2.8" stroke="currentColor" stroke-width="1.6"/>`,
  plane: `<path d="M3 11.5 21 4l-4.5 16-4-7-7.5-1.5Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>`,
  branch: `<circle cx="7" cy="6" r="2.2" stroke="currentColor" stroke-width="1.6"/><circle cx="7" cy="18" r="2.2" stroke="currentColor" stroke-width="1.6"/><circle cx="17" cy="9" r="2.2" stroke="currentColor" stroke-width="1.6"/><path d="M7 8.2v7.6M7 12h5a3 3 0 0 0 3-3" stroke="currentColor" stroke-width="1.6"/>`,
  commit: `<circle cx="12" cy="12" r="3.2" stroke="currentColor" stroke-width="1.6"/><path d="M3 12h5.8M15.2 12H21" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>`,
  eye: `<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><circle cx="12" cy="12" r="2.6" stroke="currentColor" stroke-width="1.6"/>`,
  grid: `<rect x="4" y="4" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.6"/><rect x="13" y="4" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.6"/><rect x="4" y="13" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.6"/><rect x="13" y="13" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.6"/>`,
  list: `<path d="M8 6.5h12M8 12h12M8 17.5h12M4 6.5h.01M4 12h.01M4 17.5h.01" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>`,
  flag: `<path d="M6 21V4.5M6 4.5h11l-2 3 2 3H6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`,
  voice: `<rect x="9" y="3" width="6" height="12" rx="3" stroke="currentColor" stroke-width="1.6"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>`,
  refresh: `<path d="M20 11a8 8 0 1 0-1.3 5M20 5v6h-6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`,
  lock: `<rect x="5" y="10.5" width="14" height="9" rx="2" stroke="currentColor" stroke-width="1.7"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" stroke="currentColor" stroke-width="1.7"/>`,
} as const;

export type IconName = keyof typeof ICONS;

/** Narrow an unknown icon prop (a name from the set, or arbitrary JSX). */
export function isIconName(x: unknown): x is IconName {
  return typeof x === "string" && x in ICONS;
}

/** Glyphs whose shapes fill from the <svg fill> rather than per-path. */
const FILLED = new Set<IconName>(["more", "pin", "starFill"]);

export interface IconProps {
  name: IconName;
  /** Falls back to 18; CSS (`… svg { width }`) overrides this when present. */
  size?: number;
  className?: string;
  style?: CSSProperties;
  title?: string;
}

export function Icon({ name, size = 18, className, style, title }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill={FILLED.has(name) ? "currentColor" : "none"}
      className={className}
      style={style}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      dangerouslySetInnerHTML={{ __html: title ? `<title>${title}</title>${ICONS[name]}` : ICONS[name] }}
    />
  );
}
