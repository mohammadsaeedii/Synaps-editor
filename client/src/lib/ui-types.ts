/* Shared UI primitives shared by the orchestrator and overlay organisms. */
import type { ReactNode } from "react";
import type { IconName } from "@/design/icons";

export type ToastKind = "ok" | "err" | "info" | "";

export interface ToastItem {
  id: string;
  msg: string;
  kind: ToastKind;
}

export interface MenuItem {
  label?: string;
  icon?: IconName | ReactNode;
  onClick?: () => void;
  danger?: boolean;
  disabled?: boolean;
  check?: boolean;
  hint?: string;
  sep?: boolean;
  head?: string;
}

export interface MenuAnchor {
  x: number;
  y: number;
  alignRight?: boolean;
}

export interface DialogSpec {
  title?: string;
  message?: string;
  input?: boolean;
  value?: string;
  placeholder?: string;
  okText?: string;
  danger?: boolean;
}
