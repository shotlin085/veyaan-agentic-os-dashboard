import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";
import { AuthProvider } from "@/lib/auth/AuthProvider";
import { WorkspaceProvider } from "@/lib/workspace/WorkspaceProvider";

export const metadata: Metadata = {
  title: "VEYAAN Agentic OS — Human Control Plane",
  description: "Private internal operating system for controlling Hermes, departments, agents, projects, workflows, memory, approvals, sandboxes, and observability.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-bg-app text-text-primary antialiased">
        <AuthProvider><WorkspaceProvider><AppShell>{children}</AppShell></WorkspaceProvider></AuthProvider>
      </body>
    </html>
  );
}
