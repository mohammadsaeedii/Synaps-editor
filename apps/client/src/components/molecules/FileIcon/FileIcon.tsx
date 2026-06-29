"use client";
import { memo, type CSSProperties } from "react";
import {
  SiC,
  SiCplusplus,
  SiCss,
  SiDart,
  SiDocker,
  SiDotenv,
  SiGo,
  SiHtml5,
  SiJavascript,
  SiJson,
  SiKotlin,
  SiLess,
  SiMarkdown,
  SiMongodb,
  SiPhp,
  SiPython,
  SiReact,
  SiRuby,
  SiRust,
  SiSass,
  SiSwift,
  SiTypescript,
  SiYaml,
} from "react-icons/si";
import { FaFileExcel, FaFilePowerpoint, FaFileWord } from "react-icons/fa";
import { VscFile, VscFileBinary, VscFileCode, VscFileMedia, VscFilePdf, VscFileZip, VscGear, VscJson, VscTerminalBash } from "react-icons/vsc";
import { DiJava } from "react-icons/di";
import { detectFileType, type FileCategory } from "@/lib/files/file-types";

const SIZE = 16;

const CATEGORY_ICON: Record<FileCategory, React.ComponentType<{ size?: number; style?: CSSProperties }>> = {
  javascript: SiJavascript,
  typescript: SiTypescript,
  react: SiReact,
  html: SiHtml5,
  css: SiCss,
  json: SiJson,
  yaml: SiYaml,
  markdown: SiMarkdown,
  go: SiGo,
  rust: SiRust,
  java: DiJava,
  kotlin: SiKotlin,
  php: SiPhp,
  ruby: SiRuby,
  python: SiPython,
  c: SiC,
  cpp: SiCplusplus,
  csharp: VscFileCode,
  swift: SiSwift,
  dart: SiDart,
  shell: VscTerminalBash,
  sql: SiMongodb,
  xml: VscFileCode,
  config: VscGear,
  image: VscFileMedia,
  document: VscFilePdf,
  archive: VscFileZip,
  unknown: VscFile,
};

const EXT_COLOR: Record<string, string> = {
  javascript: "#f7df1e",
  typescript: "#3178c6",
  react: "#61dafb",
  html: "#e34c26",
  css: "#264de4",
  json: "#cbcb41",
  yaml: "#cb171e",
  markdown: "#519aba",
  go: "#00add8",
  rust: "#dea584",
  java: "#b07219",
  kotlin: "#7f52ff",
  php: "#777bb4",
  ruby: "#cc342d",
  python: "#3572a5",
  c: "#555555",
  cpp: "#f34b7d",
  csharp: "#178600",
  swift: "#f05138",
  dart: "#00b4ab",
  shell: "#89e051",
  sql: "#e38c00",
  xml: "#e37933",
  config: "#6a7484",
  image: "#a074c4",
  document: "#d44",
  archive: "#6a7484",
  unknown: "#6a7484",
};

function pickIcon(filename: string) {
  const info = detectFileType(filename);
  const base = filename.toLowerCase();
  if (base.endsWith(".scss") || base.endsWith(".sass")) return { Icon: SiSass, category: "css" as FileCategory };
  if (base.endsWith(".less")) return { Icon: SiLess, category: "css" as FileCategory };
  if (base === ".env" || base.endsWith("/.env")) return { Icon: SiDotenv, category: "config" as FileCategory };
  if (base === "dockerfile") return { Icon: SiDocker, category: "config" as FileCategory };
  if (base.endsWith(".docx")) return { Icon: FaFileWord, category: "document" as FileCategory };
  if (base.endsWith(".xlsx")) return { Icon: FaFileExcel, category: "document" as FileCategory };
  if (base.endsWith(".pptx")) return { Icon: FaFilePowerpoint, category: "document" as FileCategory };
  if (base.endsWith(".json")) return { Icon: VscJson, category: "json" as FileCategory };
  return { Icon: CATEGORY_ICON[info.category], category: info.category };
}

export const FileIcon = memo(function FileIcon({ filename, size = SIZE, className }: { filename: string; size?: number; className?: string }) {
  const { Icon, category } = pickIcon(filename);
  const color = EXT_COLOR[category] ?? EXT_COLOR.unknown;
  return (
    <span className={className} style={{ display: "inline-flex", alignItems: "center", flexShrink: 0, color }}>
      {category === "unknown" && filename.includes(".") ? <VscFileBinary size={size} /> : <Icon size={size} />}
    </span>
  );
});
