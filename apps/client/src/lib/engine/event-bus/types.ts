/* =========================================================================
   synapse · engine · event bus types
   Typed domain events for file, AST, diagnostics, runtime, and LSP lifecycle.
   ========================================================================= */

export type FileEventType = "FileCreated" | "FileDeleted" | "FileUpdated" | "FileMoved" | "FileRenamed" | "FileDuplicated";

export interface FileEventPayload {
  fileId: string;
  projectId: string;
  name: string;
  path: string;
  language: string;
  content?: string;
  previousName?: string;
  previousPath?: string;
  previousParentId?: string | null;
}

export interface ASTEventPayload {
  fileId: string;
  projectId: string;
  language: string;
}

export interface DiagnosticsEventPayload {
  fileId: string;
  projectId: string;
  errorCount: number;
  warningCount: number;
}

export type RuntimeState = "idle" | "starting" | "running" | "stopping" | "stopped" | "error" | "restarting";

export interface RuntimeEventPayload {
  projectId: string;
  state: RuntimeState;
  runtimeId: string;
  message?: string;
}

export interface RuntimeOutputPayload {
  projectId: string;
  runtimeId: string;
  stream: "stdout" | "stderr";
  text: string;
}

export type EngineEventMap = {
  FileCreated: FileEventPayload;
  FileDeleted: FileEventPayload;
  FileUpdated: FileEventPayload;
  FileMoved: FileEventPayload;
  FileRenamed: FileEventPayload;
  FileDuplicated: FileEventPayload;
  ASTUpdated: ASTEventPayload;
  ASTInvalidated: ASTEventPayload;
  DiagnosticsChanged: DiagnosticsEventPayload;
  RuntimeStateChanged: RuntimeEventPayload;
  RuntimeOutput: RuntimeOutputPayload;
  ProjectIndexUpdated: { projectId: string };
  LanguageServiceReady: { languageId: string };
};

export type EngineEventType = keyof EngineEventMap;

export type EventHandler<T extends EngineEventType> = (payload: EngineEventMap[T]) => void;

export interface Subscription {
  unsubscribe: () => void;
}
