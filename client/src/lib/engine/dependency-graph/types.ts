/* =========================================================================
   synapse · engine · dependency graph types
   ========================================================================= */

export interface GraphNode {
  fileId: string;
  path: string;
  projectId: string;
  language: string;
}

export interface GraphEdge {
  from: string;
  to: string;
  specifiers: string[];
  resolvedFileId?: string;
}

export interface DependencyGraphSnapshot {
  projectId: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  circular: string[][];
  unusedFiles: string[];
  unusedExports: { fileId: string; name: string }[];
  updatedAt: number;
}
