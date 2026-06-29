/* =========================================================================
   synapse · engine · file watcher
   Emits typed file events on every store mutation. All IDE modules subscribe.
   ========================================================================= */
import { store } from "@/lib/store/store";
import type { FileItem } from "@/lib/store/types";
import { eventBus } from "../event-bus/event-bus";
import type { FileEventPayload } from "../event-bus/types";
import { filePathInfo, resolveFilePath } from "./path-utils";

function payloadFrom(file: FileItem, extras: Partial<FileEventPayload> = {}): FileEventPayload {
  return {
    fileId: file.id,
    projectId: file.projectId,
    name: file.name,
    path: resolveFilePath(file),
    language: file.language,
    content: file.dir ? undefined : file.content,
    ...extras,
  };
}

export class FileWatcher {
  private installed = false;

  install(): void {
    if (this.installed) return;
    this.installed = true;
    this.wrapStore();
  }

  private wrapStore(): void {
    const originalCreate = store.create.bind(store);
    const originalUpdate = store.update.bind(store);
    const originalRemove = store.remove.bind(store);
    const originalMove = store.move.bind(store);
    const originalDuplicate = store.duplicate.bind(store);

    store.create = ((kind, props, opts) => {
      const item = originalCreate(kind, props, opts);
      if (kind === "file") {
        const file = item as FileItem;
        eventBus.emit("FileCreated", payloadFrom(file));
        if (file.dir) {
          // directories are also file items with dir:true
        }
      }
      return item;
    }) as typeof store.create;

    store.update = ((kind, id, patch, opts) => {
      const before = kind === "file" ? (store.get("file", id) as FileItem | null) : null;
      const updated = originalUpdate(kind, id, patch, opts);
      if (kind === "file" && before && updated) {
        const after = updated as FileItem;
        const filePatch = patch as Partial<FileItem>;
        const nameChanged = filePatch.name != null && filePatch.name !== before.name;
        const parentChanged = filePatch.parentId !== undefined && filePatch.parentId !== before.parentId;
        const contentChanged = filePatch.content !== undefined;

        if (nameChanged && !parentChanged) {
          eventBus.emit("FileRenamed", payloadFrom(after, { previousName: before.name, previousPath: resolveFilePath(before) }));
        } else if (parentChanged) {
          eventBus.emit("FileMoved", payloadFrom(after, {
            previousParentId: before.parentId,
            previousPath: resolveFilePath(before),
            previousName: before.name,
          }));
        }

        if (contentChanged || (filePatch.language != null && filePatch.language !== before.language)) {
          eventBus.emit("FileUpdated", payloadFrom(after, { content: after.content }));
        } else if (!nameChanged && !parentChanged) {
          eventBus.emit("FileUpdated", payloadFrom(after));
        }
      }
      return updated;
    }) as typeof store.update;

    store.remove = ((kind, id) => {
      if (kind === "file") {
        const file = store.get("file", id) as FileItem | null;
        if (file) {
          eventBus.emit("FileDeleted", payloadFrom(file));
          if (file.dir) {
            store.byProject("file", file.projectId)
              .filter((f) => f.parentId === id)
              .forEach((child) => eventBus.emit("FileDeleted", payloadFrom(child)));
          }
        }
      }
      originalRemove(kind, id);
    }) as typeof store.remove;

    store.move = ((kind, id, dest) => {
      const before = kind === "file" ? (store.get("file", id) as FileItem | null) : null;
      originalMove(kind, id, dest);
      if (kind === "file" && before) {
        const after = store.get("file", id) as FileItem | null;
        if (after) {
          eventBus.emit("FileMoved", payloadFrom(after, {
            previousParentId: before.parentId,
            previousPath: resolveFilePath(before),
            previousName: before.name,
          }));
        }
      }
    }) as typeof store.move;

    store.duplicate = ((kind, id) => {
      const copy = originalDuplicate(kind, id);
      if (kind === "file" && copy) {
        eventBus.emit("FileDuplicated", payloadFrom(copy as FileItem));
        eventBus.emit("FileCreated", payloadFrom(copy as FileItem));
      }
      return copy;
    }) as typeof store.duplicate;
  }

  /** Bootstrap events for all existing files (on engine init). */
  bootstrapProject(projectId: string): void {
    store.byProject("file", projectId).forEach((file) => {
      if (!file.dir) {
        eventBus.emit("FileCreated", payloadFrom(file));
      }
    });
  }

  getPath(fileId: string): string | null {
    return filePathInfo(fileId)?.path ?? null;
  }
}

export const fileWatcher = new FileWatcher();
