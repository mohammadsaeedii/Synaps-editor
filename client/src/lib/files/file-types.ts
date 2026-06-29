/* =========================================================================
   synapse · file type detection
   Extension / basename → category, Monaco language, editability, MIME hints.
   ========================================================================= */

export type FileCategory =
  | "javascript"
  | "typescript"
  | "react"
  | "html"
  | "css"
  | "json"
  | "yaml"
  | "markdown"
  | "go"
  | "rust"
  | "java"
  | "kotlin"
  | "php"
  | "ruby"
  | "python"
  | "c"
  | "cpp"
  | "csharp"
  | "swift"
  | "dart"
  | "shell"
  | "sql"
  | "xml"
  | "config"
  | "image"
  | "document"
  | "archive"
  | "unknown";

export type FileEncoding = "text" | "base64";

export interface FileTypeInfo {
  category: FileCategory;
  language: string;
  editable: boolean;
  previewable: boolean;
  mimeType: string;
}

const EXT_MAP: Record<string, Omit<FileTypeInfo, "mimeType"> & { mimeType?: string }> = {
  js: { category: "javascript", language: "javascript", editable: true, previewable: false },
  mjs: { category: "javascript", language: "javascript", editable: true, previewable: false },
  cjs: { category: "javascript", language: "javascript", editable: true, previewable: false },
  ts: { category: "typescript", language: "typescript", editable: true, previewable: false },
  tsx: { category: "react", language: "typescript", editable: true, previewable: false },
  jsx: { category: "react", language: "javascript", editable: true, previewable: false },
  html: { category: "html", language: "html", editable: true, previewable: false, mimeType: "text/html" },
  htm: { category: "html", language: "html", editable: true, previewable: false, mimeType: "text/html" },
  css: { category: "css", language: "css", editable: true, previewable: false, mimeType: "text/css" },
  scss: { category: "css", language: "scss", editable: true, previewable: false },
  sass: { category: "css", language: "scss", editable: true, previewable: false },
  less: { category: "css", language: "less", editable: true, previewable: false },
  json: { category: "json", language: "json", editable: true, previewable: false, mimeType: "application/json" },
  yaml: { category: "yaml", language: "yaml", editable: true, previewable: false },
  yml: { category: "yaml", language: "yaml", editable: true, previewable: false },
  md: { category: "markdown", language: "markdown", editable: true, previewable: false },
  mdx: { category: "markdown", language: "markdown", editable: true, previewable: false },
  go: { category: "go", language: "go", editable: true, previewable: false },
  rs: { category: "rust", language: "rust", editable: true, previewable: false },
  java: { category: "java", language: "java", editable: true, previewable: false },
  kt: { category: "kotlin", language: "kotlin", editable: true, previewable: false },
  php: { category: "php", language: "php", editable: true, previewable: false },
  rb: { category: "ruby", language: "ruby", editable: true, previewable: false },
  py: { category: "python", language: "python", editable: true, previewable: false },
  c: { category: "c", language: "c", editable: true, previewable: false },
  cpp: { category: "cpp", language: "cpp", editable: true, previewable: false },
  cc: { category: "cpp", language: "cpp", editable: true, previewable: false },
  h: { category: "c", language: "c", editable: true, previewable: false },
  hpp: { category: "cpp", language: "cpp", editable: true, previewable: false },
  cs: { category: "csharp", language: "csharp", editable: true, previewable: false },
  swift: { category: "swift", language: "swift", editable: true, previewable: false },
  dart: { category: "dart", language: "dart", editable: true, previewable: false },
  sh: { category: "shell", language: "shell", editable: true, previewable: false },
  bash: { category: "shell", language: "shell", editable: true, previewable: false },
  zsh: { category: "shell", language: "shell", editable: true, previewable: false },
  sql: { category: "sql", language: "sql", editable: true, previewable: false },
  xml: { category: "xml", language: "xml", editable: true, previewable: false },
  env: { category: "config", language: "ini", editable: true, previewable: false },
  png: { category: "image", language: "plaintext", editable: false, previewable: true, mimeType: "image/png" },
  jpg: { category: "image", language: "plaintext", editable: false, previewable: true, mimeType: "image/jpeg" },
  jpeg: { category: "image", language: "plaintext", editable: false, previewable: true, mimeType: "image/jpeg" },
  gif: { category: "image", language: "plaintext", editable: false, previewable: true, mimeType: "image/gif" },
  svg: { category: "image", language: "xml", editable: true, previewable: true, mimeType: "image/svg+xml" },
  webp: { category: "image", language: "plaintext", editable: false, previewable: true, mimeType: "image/webp" },
  ico: { category: "image", language: "plaintext", editable: false, previewable: true, mimeType: "image/x-icon" },
  pdf: { category: "document", language: "plaintext", editable: false, previewable: true, mimeType: "application/pdf" },
  docx: { category: "document", language: "plaintext", editable: false, previewable: false, mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" },
  xlsx: { category: "document", language: "plaintext", editable: false, previewable: false, mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
  pptx: { category: "document", language: "plaintext", editable: false, previewable: false, mimeType: "application/vnd.openxmlformats-officedocument.presentationml.presentation" },
  zip: { category: "archive", language: "plaintext", editable: false, previewable: false, mimeType: "application/zip" },
  rar: { category: "archive", language: "plaintext", editable: false, previewable: false, mimeType: "application/x-rar-compressed" },
  "7z": { category: "archive", language: "plaintext", editable: false, previewable: false, mimeType: "application/x-7z-compressed" },
  tar: { category: "archive", language: "plaintext", editable: false, previewable: false, mimeType: "application/x-tar" },
  gz: { category: "archive", language: "plaintext", editable: false, previewable: false, mimeType: "application/gzip" },
  txt: { category: "unknown", language: "plaintext", editable: true, previewable: false },
};

const BASENAME_MAP: Record<string, Omit<FileTypeInfo, "mimeType"> & { mimeType?: string }> = {
  ".gitignore": { category: "config", language: "ini", editable: true, previewable: false },
  ".dockerignore": { category: "config", language: "ini", editable: true, previewable: false },
  dockerfile: { category: "config", language: "dockerfile", editable: true, previewable: false },
  "package.json": { category: "json", language: "json", editable: true, previewable: false, mimeType: "application/json" },
  "tsconfig.json": { category: "json", language: "json", editable: true, previewable: false, mimeType: "application/json" },
};

const CONFIG_PATTERNS = [
  /^vite\.config\./i,
  /^next\.config\./i,
  /^tailwind\.config\./i,
  /^eslint\.config\./i,
  /^webpack\.config\./i,
  /^rollup\.config\./i,
];

export function getExtension(filename: string): string {
  const base = filename.split(/[/\\]/).pop() ?? filename;
  const dot = base.lastIndexOf(".");
  if (dot <= 0) return "";
  return base.slice(dot + 1).toLowerCase();
}

export function getBasename(filename: string): string {
  return (filename.split(/[/\\]/).pop() ?? filename).toLowerCase();
}

export function detectFileType(filename: string): FileTypeInfo {
  const base = getBasename(filename);
  const ext = getExtension(filename);

  if (BASENAME_MAP[base]) {
    const m = BASENAME_MAP[base];
    return { ...m, mimeType: m.mimeType ?? "text/plain" };
  }

  if (CONFIG_PATTERNS.some((p) => p.test(base))) {
    const lang = ext === "ts" || ext === "mts" ? "typescript" : ext === "js" || ext === "mjs" ? "javascript" : "javascript";
    return { category: "config", language: lang, editable: true, previewable: false, mimeType: "text/plain" };
  }

  const mapped = EXT_MAP[ext];
  if (mapped) {
    return { ...mapped, mimeType: mapped.mimeType ?? "text/plain" };
  }

  return { category: "unknown", language: "plaintext", editable: true, previewable: false, mimeType: "text/plain" };
}

export function isBinaryCategory(category: FileCategory): boolean {
  return category === "image" || category === "document" || category === "archive";
}

export function shouldUseBase64(category: FileCategory, mimeType: string): boolean {
  if (category === "image" || category === "document" || category === "archive") return true;
  if (mimeType.startsWith("image/") || mimeType === "application/pdf") return true;
  return false;
}

export function dataUrl(encoding: FileEncoding, mimeType: string, content: string): string {
  if (encoding === "base64") {
    if (content.startsWith("data:")) return content;
    return `data:${mimeType};base64,${content}`;
  }
  return `data:${mimeType};charset=utf-8,${encodeURIComponent(content)}`;
}
