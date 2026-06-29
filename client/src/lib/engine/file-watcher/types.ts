/* =========================================================================
   synapse · engine · file watcher types
   ========================================================================= */
export type { FileEventPayload, FileEventType } from "../event-bus/types";

export interface FilePathInfo {
  fileId: string;
  projectId: string;
  name: string;
  path: string;
  language: string;
}
