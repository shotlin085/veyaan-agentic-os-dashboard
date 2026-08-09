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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600&family=Inter:wght@300;400;500;600;700&family=Outfit:wght@500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-bg-app text-text-primary antialiased">
        <AuthProvider><WorkspaceProvider><AppShell>{children}</AppShell></WorkspaceProvider></AuthProvider>
      </body>
    </html>
  );
}
