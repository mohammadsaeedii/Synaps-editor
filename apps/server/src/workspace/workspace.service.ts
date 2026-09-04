import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type {
  UpdateFileDto,
  WorkspaceAgent,
  WorkspaceChat,
  WorkspaceFile,
  WorkspaceFolder,
  WorkspaceMemory,
  WorkspaceNote,
  WorkspaceProject,
  WorkspacePrompt,
  WorkspaceSettings,
  WorkspaceSnapshot,
  WorkspaceTask,
} from './workspace.types';

const emptyMeta = (): Pick<
  WorkspaceSnapshot,
  'ui' | 'session' | 'settings' | 'projectOrder' | 'git' | 'terminals' | 'activity'
> => ({
  ui: { activeProjectId: null, activeChatId: null },
  session: {},
  settings: {
    theme: 'system',
    accent: 'blue',
    density: 'comfortable',
    name: '',
    plan: 'Free plan',
    model: 'claude-opus-4-8',
    provider: 'anthropic',
    systemPrompt: '',
    reduceMotion: false,
  },
  projectOrder: [],
  git: {},
  terminals: {},
  activity: [],
});

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((t): t is string => typeof t === 'string');
}

function num(value: bigint | number | null | undefined): number | null {
  if (value == null) return null;
  return typeof value === 'bigint' ? Number(value) : value;
}

@Injectable()
export class WorkspaceService {
  constructor(private readonly prisma: PrismaService) {}

  async getSnapshot(): Promise<WorkspaceSnapshot | null> {
    const projects = await this.prisma.project.findMany({
      include: {
        files: true,
        chats: { include: { messages: { orderBy: { sortOrder: 'asc' } } } },
        notes: true,
        tasks: true,
        prompts: true,
        memories: true,
        folders: true,
        agents: true,
      },
      orderBy: { sortOrder: 'asc' },
    });

    const meta = await this.prisma.workspaceMeta.findUnique({ where: { id: 1 } });

    if (!projects.length && !meta) return null;

    const defaults = emptyMeta();
    const projectOrder =
      (meta?.projectOrder as string[] | undefined) ??
      projects.map((p) => p.id);

    const snapshot: WorkspaceSnapshot = {
      version: meta?.version ?? 2,
      ui: (meta?.ui as WorkspaceSnapshot['ui']) ?? defaults.ui,
      session: (meta?.session as Record<string, unknown>) ?? defaults.session,
      settings: this.stripApiKey(
        (meta?.settings as unknown as WorkspaceSettings) ?? defaults.settings,
      ),
      projects: {},
      projectOrder,
      folders: {},
      chats: {},
      files: {},
      notes: {},
      tasks: {},
      prompts: {},
      memory: {},
      git: (meta?.git as Record<string, unknown>) ?? defaults.git,
      terminals: (meta?.terminals as Record<string, unknown>) ?? defaults.terminals,
      agents: {},
      activity: (meta?.activity as unknown[]) ?? defaults.activity,
    };

    for (const p of projects) {
      snapshot.projects[p.id] = {
        id: p.id,
        name: p.name,
        color: p.color,
        icon: p.icon,
        description: p.description,
        pinned: p.pinned,
        createdAt: Number(p.createdAt),
        updatedAt: Number(p.updatedAt),
      };

      for (const f of p.files) {
        snapshot.files[f.id] = {
          id: f.id,
          projectId: f.projectId,
          name: f.name,
          parentId: f.parentId,
          dir: f.dir,
          content: f.content,
          language: f.language,
          encoding: (f.encoding as 'text' | 'base64') || 'text',
          mimeType: f.mimeType ?? undefined,
          size: f.size ?? undefined,
          expanded: f.expanded,
          pinned: f.pinned,
          favorite: f.favorite,
          tags: asStringArray(f.tags),
          createdAt: Number(f.createdAt),
          updatedAt: Number(f.updatedAt),
        };
      }

      for (const c of p.chats) {
        snapshot.chats[c.id] = {
          id: c.id,
          projectId: c.projectId,
          title: c.title,
          folderId: c.folderId,
          archived: c.archived,
          system: c.system,
          persona: c.persona,
          model: c.model,
          pinned: c.pinned,
          favorite: c.favorite,
          tags: asStringArray(c.tags),
          createdAt: Number(c.createdAt),
          updatedAt: Number(c.updatedAt),
          messages: c.messages.map((m) => ({
            id: m.id,
            role: m.role as 'user' | 'assistant',
            text: m.text,
            ts: Number(m.ts),
            meta: m.meta,
          })),
        };
      }

      for (const n of p.notes) {
        snapshot.notes[n.id] = {
          id: n.id,
          projectId: n.projectId,
          title: n.title,
          content: n.content,
          pinned: n.pinned,
          favorite: n.favorite,
          tags: asStringArray(n.tags),
          createdAt: Number(n.createdAt),
          updatedAt: Number(n.updatedAt),
        };
      }

      for (const t of p.tasks) {
        snapshot.tasks[t.id] = {
          id: t.id,
          projectId: t.projectId,
          title: t.title,
          status: t.status as WorkspaceTask['status'],
          priority: t.priority as WorkspaceTask['priority'],
          due: num(t.due),
          notes: t.notes,
          order: t.sortOrder,
          pinned: t.pinned,
          favorite: t.favorite,
          tags: asStringArray(t.tags),
          createdAt: Number(t.createdAt),
          updatedAt: Number(t.updatedAt),
        };
      }

      for (const pr of p.prompts) {
        snapshot.prompts[pr.id] = {
          id: pr.id,
          projectId: pr.projectId,
          title: pr.title,
          body: pr.body,
          uses: pr.uses,
          pinned: pr.pinned,
          favorite: pr.favorite,
          tags: asStringArray(pr.tags),
          createdAt: Number(pr.createdAt),
          updatedAt: Number(pr.updatedAt),
        };
      }

      for (const m of p.memories) {
        snapshot.memory[m.id] = {
          id: m.id,
          projectId: m.projectId,
          title: m.title,
          body: m.body,
          scope: m.scope as WorkspaceMemory['scope'],
          pinned: m.pinned,
          favorite: m.favorite,
          tags: asStringArray(m.tags),
          createdAt: Number(m.createdAt),
          updatedAt: Number(m.updatedAt),
        };
      }

      for (const folder of p.folders) {
        snapshot.folders[folder.id] = {
          id: folder.id,
          name: folder.name,
          projectId: folder.projectId,
          parentId: folder.parentId,
          expanded: folder.expanded,
          order: folder.sortOrder,
        };
      }

      for (const a of p.agents) {
        snapshot.agents[a.id] = {
          id: a.id,
          name: a.name,
          role: a.role,
          model: a.model,
          status: a.status,
          projectId: a.projectId,
          system: a.system,
          createdAt: Number(a.createdAt),
          runs: Array.isArray(a.runs) ? (a.runs as unknown[]) : [],
        };
      }
    }

    return snapshot;
  }

  async saveSnapshot(raw: Record<string, unknown>): Promise<WorkspaceSnapshot> {
    const snapshot = this.normalizeSnapshot(raw);

    await this.prisma.$transaction(async (tx) => {
      // Wipe domain tables (SQLite: delete children via cascade from projects)
      await tx.chatMessage.deleteMany();
      await tx.chat.deleteMany();
      await tx.workspaceFile.deleteMany();
      await tx.note.deleteMany();
      await tx.task.deleteMany();
      await tx.prompt.deleteMany();
      await tx.memory.deleteMany();
      await tx.chatFolder.deleteMany();
      await tx.agent.deleteMany();
      await tx.project.deleteMany();

      const order = snapshot.projectOrder.length
        ? snapshot.projectOrder
        : Object.keys(snapshot.projects);

      for (let i = 0; i < order.length; i++) {
        const id = order[i];
        const p = snapshot.projects[id];
        if (!p) continue;
        await tx.project.create({
          data: {
            id: p.id,
            name: p.name,
            color: p.color,
            icon: p.icon || 'project',
            description: p.description || '',
            pinned: !!p.pinned,
            sortOrder: i,
            createdAt: BigInt(p.createdAt || Date.now()),
            updatedAt: BigInt(p.updatedAt || Date.now()),
          },
        });
      }

      // Orphan projects not in order
      for (const p of Object.values(snapshot.projects)) {
        if (order.includes(p.id)) continue;
        await tx.project.create({
          data: {
            id: p.id,
            name: p.name,
            color: p.color,
            icon: p.icon || 'project',
            description: p.description || '',
            pinned: !!p.pinned,
            sortOrder: order.length,
            createdAt: BigInt(p.createdAt || Date.now()),
            updatedAt: BigInt(p.updatedAt || Date.now()),
          },
        });
      }

      await this.insertFiles(tx, snapshot.files);
      await this.insertChats(tx, snapshot.chats);
      await this.insertNotes(tx, snapshot.notes);
      await this.insertTasks(tx, snapshot.tasks);
      await this.insertPrompts(tx, snapshot.prompts);
      await this.insertMemories(tx, snapshot.memory);
      await this.insertFolders(tx, snapshot.folders);
      await this.insertAgents(tx, snapshot.agents);

      const settings = this.stripApiKey(snapshot.settings);
      await tx.workspaceMeta.upsert({
        where: { id: 1 },
        create: {
          id: 1,
          version: snapshot.version || 2,
          ui: snapshot.ui as Prisma.InputJsonValue,
          session: snapshot.session as Prisma.InputJsonValue,
          settings: settings as unknown as Prisma.InputJsonValue,
          projectOrder: order as Prisma.InputJsonValue,
          git: snapshot.git as Prisma.InputJsonValue,
          terminals: snapshot.terminals as Prisma.InputJsonValue,
          activity: snapshot.activity as Prisma.InputJsonValue,
        },
        update: {
          version: snapshot.version || 2,
          ui: snapshot.ui as Prisma.InputJsonValue,
          session: snapshot.session as Prisma.InputJsonValue,
          settings: settings as unknown as Prisma.InputJsonValue,
          projectOrder: order as Prisma.InputJsonValue,
          git: snapshot.git as Prisma.InputJsonValue,
          terminals: snapshot.terminals as Prisma.InputJsonValue,
          activity: snapshot.activity as Prisma.InputJsonValue,
        },
      });
    });

    const saved = await this.getSnapshot();
    if (!saved) throw new Error('Failed to persist workspace');
    return saved;
  }

  async updateFile(id: string, patch: UpdateFileDto): Promise<WorkspaceFile> {
    const existing = await this.prisma.workspaceFile.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`File ${id} not found`);

    const updated = await this.prisma.workspaceFile.update({
      where: { id },
      data: {
        ...(patch.name !== undefined ? { name: patch.name } : {}),
        ...(patch.parentId !== undefined ? { parentId: patch.parentId } : {}),
        ...(patch.dir !== undefined ? { dir: patch.dir } : {}),
        ...(patch.content !== undefined ? { content: patch.content } : {}),
        ...(patch.language !== undefined ? { language: patch.language } : {}),
        ...(patch.encoding !== undefined ? { encoding: patch.encoding } : {}),
        ...(patch.mimeType !== undefined ? { mimeType: patch.mimeType } : {}),
        ...(patch.size !== undefined ? { size: patch.size } : {}),
        ...(patch.expanded !== undefined ? { expanded: patch.expanded } : {}),
        ...(patch.pinned !== undefined ? { pinned: patch.pinned } : {}),
        ...(patch.favorite !== undefined ? { favorite: patch.favorite } : {}),
        ...(patch.tags !== undefined
          ? { tags: patch.tags as Prisma.InputJsonValue }
          : {}),
        updatedAt: BigInt(Date.now()),
      },
    });

    return {
      id: updated.id,
      projectId: updated.projectId,
      name: updated.name,
      parentId: updated.parentId,
      dir: updated.dir,
      content: updated.content,
      language: updated.language,
      encoding: (updated.encoding as 'text' | 'base64') || 'text',
      mimeType: updated.mimeType ?? undefined,
      size: updated.size ?? undefined,
      expanded: updated.expanded,
      pinned: updated.pinned,
      favorite: updated.favorite,
      tags: asStringArray(updated.tags),
      createdAt: Number(updated.createdAt),
      updatedAt: Number(updated.updatedAt),
    };
  }

  private stripApiKey(settings: WorkspaceSettings): WorkspaceSettings {
    const { apiKey: _ignored, apiKeys: _keys, ...rest } = settings as WorkspaceSettings & {
      apiKeys?: unknown;
    };
    return rest;
  }

  private normalizeSnapshot(raw: Record<string, unknown>): WorkspaceSnapshot {
    const defaults = emptyMeta();
    return {
      version: typeof raw.version === 'number' ? raw.version : 2,
      ui: (raw.ui as WorkspaceSnapshot['ui']) ?? defaults.ui,
      session: (raw.session as Record<string, unknown>) ?? defaults.session,
      settings: this.stripApiKey(
        (raw.settings as WorkspaceSettings) ?? defaults.settings,
      ),
      projects: (raw.projects as Record<string, WorkspaceProject>) ?? {},
      projectOrder: Array.isArray(raw.projectOrder)
        ? (raw.projectOrder as string[])
        : [],
      folders: (raw.folders as Record<string, WorkspaceFolder>) ?? {},
      chats: (raw.chats as Record<string, WorkspaceChat>) ?? {},
      files: (raw.files as Record<string, WorkspaceFile>) ?? {},
      notes: (raw.notes as Record<string, WorkspaceNote>) ?? {},
      tasks: (raw.tasks as Record<string, WorkspaceTask>) ?? {},
      prompts: (raw.prompts as Record<string, WorkspacePrompt>) ?? {},
      memory: (raw.memory as Record<string, WorkspaceMemory>) ?? {},
      git: (raw.git as Record<string, unknown>) ?? {},
      terminals: (raw.terminals as Record<string, unknown>) ?? {},
      agents: (raw.agents as Record<string, WorkspaceAgent>) ?? {},
      activity: Array.isArray(raw.activity) ? raw.activity : [],
    };
  }

  private async insertFiles(
    tx: Prisma.TransactionClient,
    files: Record<string, WorkspaceFile>,
  ): Promise<void> {
    for (const f of Object.values(files)) {
      if (!f?.id || !f.projectId) continue;
      await tx.workspaceFile.create({
        data: {
          id: f.id,
          projectId: f.projectId,
          name: f.name || 'untitled.txt',
          parentId: f.parentId ?? null,
          dir: !!f.dir,
          content: f.content ?? '',
          language: f.language || 'plaintext',
          encoding: f.encoding || 'text',
          mimeType: f.mimeType ?? null,
          size: f.size ?? null,
          expanded: !!f.expanded,
          pinned: !!f.pinned,
          favorite: !!f.favorite,
          tags: (f.tags || []) as Prisma.InputJsonValue,
          createdAt: BigInt(f.createdAt || Date.now()),
          updatedAt: BigInt(f.updatedAt || Date.now()),
        },
      });
    }
  }

  private async insertChats(
    tx: Prisma.TransactionClient,
    chats: Record<string, WorkspaceChat>,
  ): Promise<void> {
    for (const c of Object.values(chats)) {
      if (!c?.id || !c.projectId) continue;
      await tx.chat.create({
        data: {
          id: c.id,
          projectId: c.projectId,
          title: c.title || 'Chat',
          folderId: c.folderId ?? null,
          archived: !!c.archived,
          system: c.system || '',
          persona: c.persona || '',
          model: c.model || '',
          pinned: !!c.pinned,
          favorite: !!c.favorite,
          tags: (c.tags || []) as Prisma.InputJsonValue,
          createdAt: BigInt(c.createdAt || Date.now()),
          updatedAt: BigInt(c.updatedAt || Date.now()),
          messages: {
            create: (c.messages || []).map((m, i) => ({
              id: m.id,
              role: m.role,
              text: m.text ?? '',
              ts: BigInt(m.ts || Date.now()),
              meta: !!m.meta,
              sortOrder: i,
            })),
          },
        },
      });
    }
  }

  private async insertNotes(
    tx: Prisma.TransactionClient,
    notes: Record<string, WorkspaceNote>,
  ): Promise<void> {
    for (const n of Object.values(notes)) {
      if (!n?.id || !n.projectId) continue;
      await tx.note.create({
        data: {
          id: n.id,
          projectId: n.projectId,
          title: n.title || 'Note',
          content: n.content || '',
          pinned: !!n.pinned,
          favorite: !!n.favorite,
          tags: (n.tags || []) as Prisma.InputJsonValue,
          createdAt: BigInt(n.createdAt || Date.now()),
          updatedAt: BigInt(n.updatedAt || Date.now()),
        },
      });
    }
  }

  private async insertTasks(
    tx: Prisma.TransactionClient,
    tasks: Record<string, WorkspaceTask>,
  ): Promise<void> {
    for (const t of Object.values(tasks)) {
      if (!t?.id || !t.projectId) continue;
      await tx.task.create({
        data: {
          id: t.id,
          projectId: t.projectId,
          title: t.title || 'Task',
          status: t.status || 'todo',
          priority: t.priority || 'med',
          due: t.due != null ? BigInt(t.due) : null,
          notes: t.notes || '',
          sortOrder: t.order ?? 0,
          pinned: !!t.pinned,
          favorite: !!t.favorite,
          tags: (t.tags || []) as Prisma.InputJsonValue,
          createdAt: BigInt(t.createdAt || Date.now()),
          updatedAt: BigInt(t.updatedAt || Date.now()),
        },
      });
    }
  }

  private async insertPrompts(
    tx: Prisma.TransactionClient,
    prompts: Record<string, WorkspacePrompt>,
  ): Promise<void> {
    for (const p of Object.values(prompts)) {
      if (!p?.id || !p.projectId) continue;
      await tx.prompt.create({
        data: {
          id: p.id,
          projectId: p.projectId,
          title: p.title || 'Prompt',
          body: p.body || '',
          uses: p.uses ?? 0,
          pinned: !!p.pinned,
          favorite: !!p.favorite,
          tags: (p.tags || []) as Prisma.InputJsonValue,
          createdAt: BigInt(p.createdAt || Date.now()),
          updatedAt: BigInt(p.updatedAt || Date.now()),
        },
      });
    }
  }

  private async insertMemories(
    tx: Prisma.TransactionClient,
    memories: Record<string, WorkspaceMemory>,
  ): Promise<void> {
    for (const m of Object.values(memories)) {
      if (!m?.id || !m.projectId) continue;
      await tx.memory.create({
        data: {
          id: m.id,
          projectId: m.projectId,
          title: m.title || 'Memory',
          body: m.body || '',
          scope: m.scope || 'project',
          pinned: !!m.pinned,
          favorite: !!m.favorite,
          tags: (m.tags || []) as Prisma.InputJsonValue,
          createdAt: BigInt(m.createdAt || Date.now()),
          updatedAt: BigInt(m.updatedAt || Date.now()),
        },
      });
    }
  }

  private async insertFolders(
    tx: Prisma.TransactionClient,
    folders: Record<string, WorkspaceFolder>,
  ): Promise<void> {
    for (const f of Object.values(folders)) {
      if (!f?.id || !f.projectId) continue;
      await tx.chatFolder.create({
        data: {
          id: f.id,
          projectId: f.projectId,
          name: f.name || 'Folder',
          parentId: f.parentId ?? null,
          expanded: f.expanded ?? true,
          sortOrder: f.order ?? 0,
        },
      });
    }
  }

  private async insertAgents(
    tx: Prisma.TransactionClient,
    agents: Record<string, WorkspaceAgent>,
  ): Promise<void> {
    for (const a of Object.values(agents)) {
      if (!a?.id || !a.projectId) continue;
      await tx.agent.create({
        data: {
          id: a.id,
          projectId: a.projectId,
          name: a.name || 'Agent',
          role: a.role || '',
          model: a.model || '',
          status: a.status || 'idle',
          system: a.system || '',
          createdAt: BigInt(a.createdAt || Date.now()),
          runs: (a.runs || []) as Prisma.InputJsonValue,
        },
      });
    }
  }
}
