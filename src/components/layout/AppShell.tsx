"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";
import { TopBar } from "./TopBar";
import { NavRail, navItems } from "./NavRail";
import { ActivityRail } from "./ActivityRail";
import { CommandPalette } from "./CommandPalette";
import { EmergencyStopModal } from "./EmergencyStopModal";
import { useAuth } from "@/lib/auth/AuthProvider";

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { loading: authLoading, session } = useAuth();
  const [isNavCollapsed, setIsNavCollapsed] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isEmergencyStopOpen, setIsEmergencyStopOpen] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  React.useEffect(() => {
    if (!authLoading && !session && pathname !== "/login") router.replace("/login");
  }, [authLoading, pathname, router, session]);

  if (pathname === "/login") return <>{children}</>;
  if (authLoading || !session) {
    return <main className="flex min-h-screen items-center justify-center bg-bg-app p-6 text-sm text-text-muted">Checking owner session…</main>;
  }

  return (
    <div className="min-h-screen bg-bg-app text-text-primary flex flex-col font-sans selection:bg-accent-cyan selection:text-bg-app">
      {/* Top Application Bar */}
      <TopBar
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenEmergencyStop={() => setIsEmergencyStopOpen(true)}
        onToggleVoice={() => {
          setIsVoiceActive(true);
          window.location.href = "/voice";
        }}
        isVoiceActive={isVoiceActive}
      />

      {/* Main Operating Workspace */}
      <div className="flex-1 flex w-full relative">
        <button
          aria-label="Open navigation"
          onClick={() => setIsMobileNavOpen(true)}
          className="fixed bottom-4 left-4 z-40 rounded-full border border-border-glow bg-bg-surface-2 p-3 text-accent-cyan shadow-glow lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        {isMobileNavOpen && (
          <div className="fixed inset-0 z-50 bg-black/70 lg:hidden" onClick={() => setIsMobileNavOpen(false)}>
            <nav className="h-full w-[min(84vw,20rem)] overflow-y-auto border-r border-border-subtle bg-[#090D16] p-4" onClick={(event) => event.stopPropagation()}>
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm font-semibold text-white">VEYAAN navigation</span>
                <button aria-label="Close navigation" onClick={() => setIsMobileNavOpen(false)} className="rounded-lg p-2 text-text-muted hover:text-white"><X className="h-4 w-4" /></button>
              </div>
              <div className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return <Link key={item.href} href={item.href} onClick={() => setIsMobileNavOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-text-secondary hover:bg-bg-surface-2 hover:text-white"><Icon className="h-4 w-4" />{item.name}</Link>;
                })}
              </div>
            </nav>
          </div>
        )}
        {/* Left Navigation Rail */}
        <NavRail
          isCollapsed={isNavCollapsed}
          onToggleCollapse={() => setIsNavCollapsed(!isNavCollapsed)}
        />

        {/* Main Content Viewport */}
        <main className="flex-1 min-w-0 min-h-0 overflow-x-hidden overflow-y-auto p-4 pb-20 md:p-6 lg:min-h-[calc(100vh-4rem)] lg:pb-6">
          {children}
        </main>

        {/* Right Live Activity Rail */}
        <ActivityRail />
      </div>

      {/* Overlays & Modals */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onOpenEmergencyStop={() => {
          setIsCommandPaletteOpen(false);
          setIsEmergencyStopOpen(true);
        }}
      />

      <EmergencyStopModal
        isOpen={isEmergencyStopOpen}
        onClose={() => setIsEmergencyStopOpen(false)}
      />
    </div>
  );
};
