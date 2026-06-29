/* =========================================================================
   synapse · engine · initialization
   Bootstraps all IDE engine modules. Called once from WorkspaceProvider.
   ========================================================================= */
import { store } from "@/lib/store/store";
import { astManager } from "./ast/ast-manager";
import { dependencyGraph } from "./dependency-graph/dependency-graph";
import { diagnosticsService } from "./diagnostics/diagnostics-service";
import { eventBus } from "./event-bus/event-bus";
import { fileWatcher } from "./file-watcher/file-watcher";
import { languageService } from "./lsp/language-service";
import { projectIndex } from "./project-index/project-index";
import { runtimeManager } from "./runtime/runtime-manager";
import { symbolIndex } from "./symbols/symbol-index";

let booted = false;

export async function initEngine(): Promise<void> {
  if (booted) return;
  booted = true;

  fileWatcher.install();
  astManager.install();
  symbolIndex.install();
  dependencyGraph.install();
  diagnosticsService.install();
  languageService.install();
  projectIndex.install();
  runtimeManager.setup();

  const project = store.activeProject();
  if (project) {
    await bootstrapProject(project.id);
  }

  store.setActiveProject = ((original) => (id: string) => {
    original(id);
    void bootstrapProject(id);
  })(store.setActiveProject.bind(store));
}

async function bootstrapProject(projectId: string): Promise<void> {
  fileWatcher.bootstrapProject(projectId);
  astManager.bootstrapProject(projectId);
  symbolIndex.rebuild(projectId);
  dependencyGraph.rebuild(projectId);
  projectIndex.rebuild(projectId);
  await languageService.bootstrapProject(projectId);
}

export { eventBus };
