"use client";
import { memo, useCallback, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import type { editor } from "monaco-editor";
import type { OnMount } from "@monaco-editor/react";
import { restoreViewState, saveViewState } from "@/lib/files/editor-state";
import { bindEditorModel, installMonacoBridge, registerFileUri } from "@/lib/engine";

const Monaco = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => <div style={{ padding: 16, color: "var(--text-faint)", fontFamily: "var(--mono)", fontSize: 12 }}>Loading editor…</div>,
});

export interface MonacoEditorProps {
  fileId: string;
  value: string;
  language: string;
  onChange: (value: string) => void;
  className?: string;
}

function getMonacoTheme(): "vs-dark" | "vs" {
  if (typeof document === "undefined") return "vs-dark";
  return document.documentElement.getAttribute("data-theme") === "light" ? "vs" : "vs-dark";
}

export const MonacoEditor = memo(function MonacoEditor({ fileId, value, language, onChange, className }: MonacoEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const fileIdRef = useRef(fileId);

  useEffect(() => {
    if (fileIdRef.current !== fileId && editorRef.current) {
      saveViewState(fileIdRef.current, editorRef.current);
      fileIdRef.current = fileId;
    }
  }, [fileId]);

  useEffect(() => {
    const root = document.documentElement;
    const sync = () => {
      import("monaco-editor").then((monaco) => monaco.editor.setTheme(getMonacoTheme()));
    };
    const obs = new MutationObserver(sync);
    obs.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    return () => obs.disconnect();
  }, []);

  const handleMount: OnMount = useCallback(
    (ed, monaco) => {
      editorRef.current = ed;
      void installMonacoBridge(monaco);
      registerFileUri(fileId);
      const model = bindEditorModel(monaco, fileId, language, value);
      ed.setModel(model);
      restoreViewState(fileId, ed);
      ed.onDidBlurEditorText(() => saveViewState(fileId, ed));
      ed.onDidChangeCursorSelection(() => saveViewState(fileId, ed));
      ed.onDidScrollChange(() => saveViewState(fileId, ed));
    },
    [fileId, language, value],
  );

  const handleChange = useCallback(
    (v: string | undefined) => {
      onChange(v ?? "");
    },
    [onChange],
  );

  useEffect(() => {
    return () => {
      if (editorRef.current) saveViewState(fileIdRef.current, editorRef.current);
    };
  }, []);

  useEffect(() => {
    if (!editorRef.current) return;
    import("monaco-editor").then((monaco) => {
      registerFileUri(fileId);
      const model = bindEditorModel(monaco, fileId, language, value);
      if (editorRef.current?.getModel()?.uri.toString() !== model.uri.toString()) {
        editorRef.current?.setModel(model);
      }
    });
  }, [fileId, language]);

  return (
    <Monaco
      className={className}
      value={value}
      language={language}
      theme={getMonacoTheme()}
      onChange={handleChange}
      onMount={handleMount}
      options={{
        minimap: { enabled: true },
        wordWrap: "on",
        automaticLayout: true,
        scrollBeyondLastLine: false,
        smoothScrolling: true,
        lineNumbers: "on",
        bracketPairColorization: { enabled: true },
        autoClosingBrackets: "always",
        autoClosingQuotes: "always",
        folding: true,
        autoIndent: "full",
        tabSize: 2,
        fontFamily: "ui-monospace, SF Mono, JetBrains Mono, Cascadia Code, Menlo, Consolas, monospace",
        fontSize: 12.5,
        lineHeight: 21,
        padding: { top: 14, bottom: 14 },
        renderLineHighlight: "all",
        cursorBlinking: "smooth",
        cursorSmoothCaretAnimation: "on",
        multiCursorModifier: "alt",
        find: { addExtraSpaceOnTop: false },
        quickSuggestions: true,
        suggestOnTriggerCharacters: true,
        parameterHints: { enabled: true },
        formatOnPaste: true,
        formatOnType: true,
      }}
    />
  );
});
