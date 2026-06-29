"use client";
import { Splitter } from "@/components/molecules/Splitter/Splitter";
import { ActivityBar } from "@/components/organisms/ActivityBar/ActivityBar";
import { BottomDock } from "@/components/organisms/BottomDock/BottomDock";
import { CommandPalette } from "@/components/organisms/CommandPalette/CommandPalette";
import { EditorArea } from "@/components/organisms/EditorArea/EditorArea";
import { RightPreview } from "@/components/organisms/RightPreview/RightPreview";
import { SidePanel } from "@/components/organisms/SidePanel/SidePanel";
import { StatusBar } from "@/components/organisms/StatusBar/StatusBar";
import { TopBar } from "@/components/organisms/TopBar/TopBar";
import { ContextMenu } from "@/components/organisms/overlays/ContextMenu";
import { Dialog } from "@/components/organisms/overlays/Dialog";
import { Toasts } from "@/components/organisms/overlays/Toasts";
import { store, useStore } from "@/lib/store/store";
import { useWorkspace } from "@/lib/workspace";
import s from "./WorkspaceShell.module.css";

/**
 * The IDE shell: top bar · [activity bar · side panel · editor + dock · preview]
 * · status bar, plus the floating overlay surfaces. Layout sizes and open/closed
 * state come from the persisted session; the splitters write back to it.
 */
export function WorkspaceShell() {
  const { setSideWidth, setRightWidth, setDockHeight } = useWorkspace();
  const sideOpen = useStore((st) => st.session.sideOpen);
  const dockOpen = useStore((st) => st.session.dockOpen);
  const rightOpen = useStore((st) => st.session.rightOpen);

  return (
    <div className={s.ws}>
      <TopBar />
      <div className={s.body}>
        <ActivityBar />
        {sideOpen && <SidePanel />}
        {sideOpen && <Splitter orientation="v" getSize={() => store.session().sideWidth} setSize={setSideWidth} onEnd={() => store.saveNow()} />}
        <div className={s.editorzone}>
          <EditorArea />
          {dockOpen && <Splitter orientation="h" getSize={() => store.session().dockHeight} setSize={setDockHeight} invert onEnd={() => store.saveNow()} />}
          {dockOpen && <BottomDock />}
        </div>
        {rightOpen && <Splitter orientation="v" getSize={() => store.session().rightWidth} setSize={setRightWidth} invert onEnd={() => store.saveNow()} />}
        {rightOpen && <RightPreview />}
      </div>
      <StatusBar />

      {/* floating overlay surfaces */}
      <Toasts />
      <ContextMenu />
      <Dialog />
      <CommandPalette />
    </div>
  );
}
