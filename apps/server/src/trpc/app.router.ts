import { router } from "./trpc";
import { identityRouter } from "./routers/identity.router";
import { projectsRouter } from "./routers/projects.router";
import { foldersRouter } from "./routers/folders.router";
import { filesRouter } from "./routers/files.router";
import { chatsRouter } from "./routers/chats.router";
import {
  tasksRouter,
  notesRouter,
  promptsRouter,
  memoryRouter,
  agentsRouter,
  activityRouter,
  searchRouter,
  syncRouter,
} from "./routers/stubs.router";

export const appRouter = router({
  identity: identityRouter,
  projects: projectsRouter,
  folders: foldersRouter,
  files: filesRouter,
  chats: chatsRouter,
  tasks: tasksRouter,
  notes: notesRouter,
  prompts: promptsRouter,
  memory: memoryRouter,
  agents: agentsRouter,
  activity: activityRouter,
  search: searchRouter,
  sync: syncRouter,
});

export type AppRouter = typeof appRouter;
