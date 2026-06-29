"use client";
import { useState } from "react";
import { Icon } from "@/design/icons";
import { hi } from "@/lib/fuzzy";
import { KINDS } from "@/lib/store/kinds";
import { store, useStoreVersion } from "@/lib/store/store";
import type { Kind } from "@/lib/store/types";
import { pluralize } from "@/lib/utils";
import { useWorkspace } from "@/lib/workspace";
import s from "./SearchView.module.css";

export function SearchView() {
  useStoreVersion();
  const { open } = useWorkspace();
  const [query, setQuery] = useState("");
  const [allScope, setAllScope] = useState(true);
  const q = query.trim();
  const results = store.search(q, { pid: allScope ? "all" : store.getState().ui.activeProjectId });

  return (
    <div className={s.searchside}>
      <div className={s.bar}>
        <span className={s.icon}>
          <Icon name="search" />
        </span>
        <input
          className={s.input}
          type="search"
          placeholder="Search everything…"
          aria-label="Global search"
          value={query}
          autoFocus
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <label className={s.scope}>
        <input type="checkbox" checked={allScope} onChange={(e) => setAllScope(e.target.checked)} />
        <span>All projects</span>
      </label>
      <div className={s.results}>
        {!q ? (
          <div className={s.empty}>Type to search chats, files, notes, tasks, prompts &amp; memory.</div>
        ) : !results.length ? (
          <div className={s.empty}>No results</div>
        ) : (
          <>
            <div className={s.count}>
              {results.length} {pluralize(results.length, "result")}
            </div>
            {results.map((r) => {
              const proj = store.project(r.projectId);
              return (
                <div
                  key={r.kind + r.id}
                  className={s.item}
                  onClick={() => (r.kind === "project" ? store.setActiveProject(r.id) : open(r.kind, r.id))}
                >
                  <span className={s.itemIco}>
                    <Icon name={r.kind === "project" ? "project" : KINDS[r.kind as Kind]?.icon ?? "file"} />
                  </span>
                  <div className={s.body}>
                    <div className={s.title}>{hi(r.title, r.idx)}</div>
                    <div className={s.snip}>{r.snippet}</div>
                    <div className={s.meta}>{(proj ? proj.name + " · " : "") + (KINDS[r.kind as Kind]?.label || r.kind)}</div>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
