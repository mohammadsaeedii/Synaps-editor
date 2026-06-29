/* =========================================================================
   synapse · fuzzy matcher
   The subsequence scorer that powers the command palette and global search,
   ported verbatim. `hi()` returns React nodes (instead of a DOM fragment) so
   matched characters can be wrapped in <mark>.
   ========================================================================= */
import { Fragment, createElement, type ReactNode } from "react";

export interface FuzzyMatch {
  score: number;
  idx: number[];
}

/** Returns null on no-match, else { score, idx } (matched char positions). */
export function fuzzy(needle: string, haystack: string): FuzzyMatch | null {
  const q = needle.toLowerCase();
  const s = (haystack || "").toLowerCase();
  if (!q) return { score: 1, idx: [] };
  if (!s) return null;
  let qi = 0;
  let score = 0;
  let run = 0;
  const idx: number[] = [];
  for (let i = 0; i < s.length && qi < q.length; i++) {
    if (s[i] === q[qi]) {
      idx.push(i);
      run += 1;
      let bonus = 1 + run; // consecutive matches score higher
      if (i === 0 || /[\s/\-_.]/.test(s[i - 1])) bonus += 6; // word-boundary bonus
      score += bonus;
      qi++;
    } else {
      run = 0;
    }
  }
  if (qi < q.length) return null; // not all chars matched
  score -= (s.length - q.length) * 0.04; // mild brevity preference
  if (s.startsWith(q)) score += 12;
  if (s === q) score += 24;
  return { score, idx };
}

/** Build highlighted React nodes from text + matched indices. */
export function hi(text: string, idx: number[]): ReactNode {
  if (!idx || !idx.length) return text;
  const set = new Set(idx);
  const out: ReactNode[] = [];
  let buf = "";
  let mark = false;
  let key = 0;
  const flush = () => {
    if (!buf) return;
    out.push(mark ? createElement("mark", { key: key++ }, buf) : createElement(Fragment, { key: key++ }, buf));
    buf = "";
  };
  for (let i = 0; i < text.length; i++) {
    const m = set.has(i);
    if (m !== mark) {
      flush();
      mark = m;
    }
    buf += text[i];
  }
  flush();
  return out;
}
