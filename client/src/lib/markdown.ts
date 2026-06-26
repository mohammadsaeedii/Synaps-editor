/* =========================================================================
   synapse · markdown (safe subset)
   The same hand-rolled renderer used by the original chat + notes panels.
   Input text is HTML-escaped first, then formatted, so the resulting string
   is safe to inject. Supports headings, lists, task lists, fenced code,
   blockquotes, rules, and inline bold / italic / code / links.
   ========================================================================= */
import { esc } from "./utils";

function inline(s: string): string {
  // s is already HTML-escaped. Protect inline code, then format.
  const codes: string[] = [];
  s = s.replace(/`([^`]+)`/g, (_, c) => {
    codes.push(c);
    return " " + (codes.length - 1) + " ";
  });
  s = s
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[\s(])\*([^*\n]+)\*(?=[\s).,!?]|$)/g, "$1<em>$2</em>")
    .replace(/\b_([^_\n]+)_\b/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+|mailto:[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  s = s.replace(/ (\d+) /g, (_, i) => `<code>${codes[+i]}</code>`);
  return s;
}

export function md(text: string): string {
  const lines = String(text || "").replace(/\r\n/g, "\n").split("\n");
  let html = "";
  let i = 0;
  const stack: string[] = [];
  const closeList = (st: string[]) => {
    while (st.length) html += st.pop() === "ul" ? "</ul>" : "</ol>";
  };
  while (i < lines.length) {
    const line = lines[i];
    // fenced code
    const fence = line.match(/^```(\w+)?\s*$/);
    if (fence) {
      closeList(stack);
      const lang = fence[1] || "";
      const buf: string[] = [];
      i++;
      while (i < lines.length && !/^```\s*$/.test(lines[i])) buf.push(lines[i++]);
      i++;
      html += `<pre class="md-pre"${lang ? ` data-lang="${esc(lang)}"` : ""}><code>${esc(buf.join("\n"))}</code></pre>`;
      continue;
    }
    const esc1 = esc(line);
    let m: RegExpMatchArray | null;
    if (/^\s*$/.test(line)) {
      closeList(stack);
      i++;
      continue;
    }
    if ((m = line.match(/^(#{1,4})\s+(.*)$/))) {
      closeList(stack);
      html += `<h${m[1].length} class="md-h">${inline(esc(m[2]))}</h${m[1].length}>`;
      i++;
      continue;
    }
    if (/^\s*([-*_])\1{2,}\s*$/.test(line)) {
      closeList(stack);
      html += "<hr/>";
      i++;
      continue;
    }
    if ((m = line.match(/^\s*>\s?(.*)$/))) {
      closeList(stack);
      const buf: string[] = [];
      while (i < lines.length && (m = lines[i].match(/^\s*>\s?(.*)$/))) {
        buf.push(inline(esc(m[1])));
        i++;
      }
      html += `<blockquote>${buf.join("<br/>")}</blockquote>`;
      continue;
    }
    if ((m = line.match(/^\s*[-*]\s+\[([ xX])\]\s+(.*)$/))) {
      if (stack[stack.length - 1] !== "ul") {
        closeList(stack);
        html += '<ul class="md-ul md-task">';
        stack.push("ul");
      }
      html += `<li class="md-li"><input type="checkbox" disabled ${/[xX]/.test(m[1]) ? "checked" : ""}/> ${inline(esc(m[2]))}</li>`;
      i++;
      continue;
    }
    if ((m = line.match(/^\s*[-*+]\s+(.*)$/))) {
      if (stack[stack.length - 1] !== "ul") {
        closeList(stack);
        html += '<ul class="md-ul">';
        stack.push("ul");
      }
      html += `<li>${inline(esc(m[1]))}</li>`;
      i++;
      continue;
    }
    if ((m = line.match(/^\s*\d+\.\s+(.*)$/))) {
      if (stack[stack.length - 1] !== "ol") {
        closeList(stack);
        html += '<ol class="md-ol">';
        stack.push("ol");
      }
      html += `<li>${inline(esc(m[1]))}</li>`;
      i++;
      continue;
    }
    closeList(stack);
    html += `<p>${inline(esc1)}</p>`;
    i++;
  }
  closeList(stack);
  return html;
}
