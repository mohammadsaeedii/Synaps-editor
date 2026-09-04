import type { editor } from "monaco-editor";

/** Custom Monaco themes aligned with synapse design tokens. */
export const SYNAPSE_DARK = "synapse-dark";
export const SYNAPSE_LIGHT = "synapse-light";

export function registerSynapseThemes(monaco: typeof import("monaco-editor")): void {
  monaco.editor.defineTheme(SYNAPSE_DARK, {
    base: "vs-dark",
    inherit: true,
    rules: [],
    colors: {
      "editor.background": "#0e1116",
      "editor.foreground": "#e7eaf0",
      "editorLineNumber.foreground": "#6a7484",
      "editorLineNumber.activeForeground": "#9aa4b2",
      "editorCursor.foreground": "#8b5cf6",
      "editor.selectionBackground": "#8b5cf633",
      "editor.inactiveSelectionBackground": "#8b5cf622",
      "editor.lineHighlightBackground": "#151a2180",
      "editor.lineHighlightBorder": "#00000000",
      "editorGutter.background": "#0e1116",
      "editorWidget.background": "#151a21",
      "editorSuggestWidget.background": "#151a21",
      "editorSuggestWidget.border": "#ffffff14",
      "editorHoverWidget.background": "#151a21",
      "editorHoverWidget.border": "#ffffff14",
      "minimap.background": "#0a0d11",
      "scrollbarSlider.background": "#ffffff14",
      "scrollbarSlider.hoverBackground": "#ffffff22",
      "scrollbarSlider.activeBackground": "#ffffff33",
      "editorBracketMatch.background": "#8b5cf622",
      "editorBracketMatch.border": "#8b5cf655",
    },
  });

  monaco.editor.defineTheme(SYNAPSE_LIGHT, {
    base: "vs",
    inherit: true,
    rules: [],
    colors: {
      "editor.background": "#f6f7f9",
      "editor.foreground": "#1c2430",
      "editorLineNumber.foreground": "#8b95a3",
      "editorLineNumber.activeForeground": "#5a6473",
      "editorCursor.foreground": "#7c3aed",
      "editor.selectionBackground": "#8b5cf633",
      "editor.inactiveSelectionBackground": "#8b5cf622",
      "editor.lineHighlightBackground": "#eceef280",
      "editor.lineHighlightBorder": "#00000000",
      "editorGutter.background": "#f6f7f9",
      "editorWidget.background": "#ffffff",
      "editorSuggestWidget.background": "#ffffff",
      "editorSuggestWidget.border": "#1118271a",
      "editorHoverWidget.background": "#ffffff",
      "editorHoverWidget.border": "#1118271a",
      "minimap.background": "#eceef2",
      "scrollbarSlider.background": "#11182714",
      "scrollbarSlider.hoverBackground": "#11182722",
      "scrollbarSlider.activeBackground": "#11182733",
    },
  });
}

export function getSynapseMonacoTheme(): typeof SYNAPSE_DARK | typeof SYNAPSE_LIGHT {
  if (typeof document === "undefined") return SYNAPSE_DARK;
  return document.documentElement.getAttribute("data-theme") === "light"
    ? SYNAPSE_LIGHT
    : SYNAPSE_DARK;
}

export function applySynapseTheme(monaco: typeof import("monaco-editor")): void {
  registerSynapseThemes(monaco);
  monaco.editor.setTheme(getSynapseMonacoTheme());
}
