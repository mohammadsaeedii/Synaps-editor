export const queryKeys = {
  health: {
    root: ["health"] as const,
  },
  ai: {
    root: ["ai"] as const,
    chat: ["ai", "chat"] as const,
    models: ["ai", "models"] as const,
  },
  workspace: {
    root: ["workspace"] as const,
    save: ["workspace", "save"] as const,
    file: ["workspace", "file"] as const,
  },
} as const;
