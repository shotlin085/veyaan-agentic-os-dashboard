"use client";

import React from "react";
import Image from "next/image";
import { Menu } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { ChatSidebar } from "./ChatSidebar";
import { CommandPalette } from "./CommandPalette";
import { ConversationProvider } from "@/components/assistant/runtime/ConversationProvider";
import { ghostButton } from "@/components/elements/surfaces";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/AuthProvider";

interface AppShellProps {
  children: React.ReactNode;
}

/**
 * Two-slot shell: ChatSidebar (the app's one persistent nav surface, see
 * ChatSidebar.tsx) + full-bleed main. No permanent desktop TopBar - each
 * route owns its own thin header if it needs one. Global Cmd+K lives here
 * since there's no TopBar left to anchor a trigger button to.
 *
 * Below `lg`, ChatSidebar's own `<aside>` is `hidden` (it's a permanent
 * rail, not meant to eat phone-width screen space) and nothing replaced
 * it - there was no way at all to reach navigation, search, or the
 * conversation list on a phone. This mobile-only top bar (`lg:hidden`,
 * the desktop rail's exact inverse) is that replacement: a hamburger that
 * opens ChatSidebar's slide-over drawer, present on every route including
 * /c/[id] itself, not just routes that happened to build their own.
 */
export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { loading: authLoading, session } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);

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
        <ChatSidebar mobileOpen={mobileNavOpen} onCloseMobile={() => setMobileNavOpen(false)} />
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <div className="flex shrink-0 items-center gap-2 border-b border-border px-3 py-2 lg:hidden">
            <button
              type="button"
              aria-label="Open navigation"
              onClick={() => setMobileNavOpen(true)}
              className={cn(ghostButton, "size-8 shrink-0")}
            >
              <Menu className="size-4" />
            </button>
            <Image src="/veyaan-logo.png" alt="" width={40} height={40} className="size-10 shrink-0 rounded-lg" />
            <span className="truncate text-[16px] font-bold tracking-wide text-foreground">VEYAAN</span>
          </div>
          <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
      <CommandPalette />
    </ConversationProvider>
  );
};
