"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChatSidebar } from "./ChatSidebar";
import { CommandPalette } from "./CommandPalette";
import { ConversationProvider } from "@/components/assistant/runtime/ConversationProvider";
import { useAuth } from "@/lib/auth/AuthProvider";

interface AppShellProps {
  children: React.ReactNode;
}

/**
 * Two-slot shell: ChatSidebar (the app's one persistent nav surface, see
 * ChatSidebar.tsx) + full-bleed main. No permanent TopBar - each route
 * owns its own thin header if it needs one. Global Cmd+K lives here since
 * there's no TopBar left to anchor a trigger button to.
 */
export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { loading: authLoading, session } = useAuth();

  React.useEffect(() => {
    if (!authLoading && !session && pathname !== "/login") router.replace("/login");
  }, [authLoading, pathname, router, session]);

  if (pathname === "/login") return <>{children}</>;
  if (authLoading || !session) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-6 text-sm text-foreground/50">
        Checking owner session…
      </main>
    );
  }

  return (
    <ConversationProvider>
      <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
        <ChatSidebar />
        <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
      </div>
      <CommandPalette />
    </ConversationProvider>
  );
};
