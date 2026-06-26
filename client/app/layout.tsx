import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "synapse — AI workspace",
  description:
    "synapse — a Next.js AI workspace: chat, files, notes, tasks, prompts, memory, terminal and source control in one IDE-style app, built on a token-driven atomic design system.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" data-motion="full">
      <body>{children}</body>
    </html>
  );
}
