"use client";
import { Icon } from "@/design/icons";
import { SIDE_VIEWS } from "@/lib/panels";
import { store, useStore } from "@/lib/store/store";
import { useWorkspace } from "@/lib/workspace";
import { Explorer } from "@/components/organisms/Explorer/Explorer";
import { SearchView } from "@/components/organisms/SearchView/SearchView";
import { AgentsSide } from "@/components/organisms/panels/AgentsPanel/AgentsPanel";
import { GitPanel } from "@/components/organisms/panels/GitPanel/GitPanel";
import s from "./SidePanel.module.css";

export function SidePanel() {
  const { newChat, newItem, promptDialog } = useWorkspace();
  const sideView = useStore((st) => st.session.sideView);
  const sideWidth = useStore((st) => st.session.sideWidth);
  const meta = SIDE_VIEWS.find((v) => v.id === sideView) ?? SIDE_VIEWS[0];

  const explorerActions = (
    <>
      <button type="button" className={s.headBtn} title="New chat" onClick={() => newChat()}>
        <Icon name="newChat" size={16} />
      </button>
      <button type="button" className={s.headBtn} title="New file" onClick={() => newItem("file")}>
        <Icon name="newFile" size={16} />
      </button>
      <button
        type="button"
        className={s.headBtn}
        title="New folder"
        onClick={async () => {
          const nm = await promptDialog("New folder", { placeholder: "Name", okText: "Create" });
          if (nm?.trim()) store.createFolder({ name: nm.trim() });
        }}
      >
        <Icon name="newFolder" size={16} />
      </button>
      <button
        type="button"
        className={s.headBtn}
        title="Collapse all"
        onClick={() => {
          const ex = store.session().explorer ?? { groups: {}, query: "", tag: "", favOnly: false };
          store.setSession({ explorer: { ...ex, groups: {} } });
        }}
      >
        <Icon name="refresh" size={16} />
      </button>
    </>
  );

  return (
    <aside className={s.sidepanel} style={{ width: sideWidth }}>
      <div className={s.head}>
        <span className={s.title}>{meta.title}</span>
        <div className={s.headActions}>{sideView === "explorer" && explorerActions}</div>
      </div>
      <div className={s.body}>
        {sideView === "explorer" && <Explorer />}
        {sideView === "search" && <SearchView />}
        {sideView === "git" && <GitPanel compact />}
        {sideView === "agents" && <AgentsSide />}
      </div>
    </aside>
  );
}
