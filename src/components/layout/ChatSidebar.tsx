"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bot,
  CheckCircle2,
  ChevronDown,
  Database,
  GitFork,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  PlusIcon,
  Radio,
  Settings,
  ShieldCheck,
  Terminal,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThreadSearch, type SearchableThread } from "@/components/elements/thread-search";
import { field, ghostButton, inkButton, mono } from "@/components/elements/surfaces";
import { useConversations } from "@/components/assistant/runtime/ConversationProvider";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useRuntimeStatus } from "@/lib/api/runtime";
import { useWorkspace } from "@/lib/workspace/WorkspaceProvider";

const WORKSPACE_NAV = [
  { name: "Agents", href: "/agents", icon: Bot },
  { name: "Workflows", href: "/workflows", icon: GitFork },
  { name: "Memory", href: "/memory", icon: Database },
  { name: "Approvals", href: "/approvals", icon: CheckCircle2 },
  { name: "QA", href: "/qa", icon: ShieldCheck },
  { name: "Logs", href: "/logs", icon: Terminal },
  { name: "Voice", href: "/voice", icon: Radio },
  { name: "Settings", href: "/settings", icon: Settings },
];

// Persisted the same way the rest of this app persists small client-only
// UI preferences (localStorage, no server round-trip) - collapse state is
// purely cosmetic and per-device, not something a workspace record needs
// to know about.
const COLLAPSE_STORAGE_KEY = "veyaan.sidebar.collapsed";

function dayGroup(iso: string): string {
  const then = new Date(iso);
  const now = new Date();
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round((startOfDay(now) - startOfDay(then)) / 86_400_000);
  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays <= 7) return "Previous 7 days";
  if (diffDays <= 30) return "Previous 30 days";
  return "Older";
}

export interface ChatSidebarProps {
  /** Mobile slide-over state - lives in AppShell since the top bar's
   * hamburger trigger and this drawer are two different components that
   * both need to agree on whether it's open. Desktop rendering ignores
   * these entirely (see the `hidden ... lg:flex` aside below). */
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

/**
 * Replaces NavRail as the app's one persistent navigation surface -
 * conversations are the primary axis (New chat, search, real day-grouped
 * thread list from Hermes), the rest of the app hangs off a compact
 * disclosure underneath. Global (mounted once in AppShell), not scoped to
 * the chat page, so switching threads or starting a new one works from
 * anywhere and routes to that conversation's own /c/[id] URL.
 *
 * Two renderings share one `SidebarBody`: a `lg:flex` desktop rail that
 * can collapse to an icon-only strip, and a mobile slide-over drawer
 * (below `lg`, where the desktop rail is `hidden`) that's always shown
 * full-width and un-collapsed - collapsing to icons only makes sense when
 * a persistent rail is eating screen width, not inside a temporary
 * overlay. Before this, the desktop rail's `hidden ... lg:flex` had no
 * mobile fallback at all - below `lg` there was no way to reach
 * navigation, search, or the conversation list; this drawer is that
 * fallback, opened from the small top bar AppShell now renders on mobile.
 */
export function ChatSidebar({ mobileOpen = false, onCloseMobile }: ChatSidebarProps) {
  const pathname = usePathname();
  const { conversations, activeId, loading, error, selectById, createConversation, setPinned, renameConversation, deleteConversation } = useConversations();
  const { user, signOut } = useAuth();
  const { workspaces, workspace, selectWorkspace } = useWorkspace();
  const { status } = useRuntimeStatus();
  const connected = status?.services.some((service) => service.state === "online") ?? false;
  const [query, setQuery] = useState("");
  const [navOpen, setNavOpen] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(COLLAPSE_STORAGE_KEY) === "1") setCollapsed(true);
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((value) => {
      const next = !value;
      localStorage.setItem(COLLAPSE_STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  };

  // Closing the mobile drawer on navigation matches every other mobile
  // drawer already in this app (see workflows/page.tsx's Studio nav
  // overlay) - picking a link should dismiss the overlay, not leave it
  // covering the page it just navigated to.
  useEffect(() => {
    onCloseMobile?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const threads: SearchableThread[] = useMemo(
    () =>
      conversations.map((conversation) => ({
        id: conversation.id,
        title: conversation.title?.trim() || "New chat",
        group: dayGroup(conversation.updated_at),
        preview: conversation.channel === "voice" ? "Voice conversation" : "",
        pinned: conversation.pinned,
      })),
    [conversations],
  );

  // The mobile drawer always renders un-collapsed and has no collapse
  // toggle of its own - collapsing exists to save width in the
  // permanently-visible desktop rail, which a temporary overlay doesn't
  // need, and showing it there would let it control the *desktop* rail's
  // collapsed state from inside an unrelated mobile surface.
  const body = (variant: "desktop" | "mobile") => (
    <SidebarBody
      collapsed={variant === "desktop" && collapsed}
      onToggleCollapsed={toggleCollapsed}
      showCollapseToggle={variant === "desktop"}
      pathname={pathname}
      threads={threads}
      query={query}
      onQueryChange={setQuery}
      activeId={activeId ?? ""}
      loading={loading}
      error={error}
      onSelect={(id) => selectById(id)}
      onNewChat={() => void createConversation()}
      onTogglePin={(id, pinned) => void setPinned(id, pinned)}
      onRename={(id, title) => void renameConversation(id, title)}
      onDelete={(id) => void deleteConversation(id)}
      navOpen={navOpen}
      onToggleNavOpen={() => setNavOpen((open) => !open)}
      workspaces={workspaces}
      workspaceId={workspace?.id ?? ""}
      onSelectWorkspace={selectWorkspace}
      userEmail={user?.email ?? null}
      connected={connected}
      onSignOut={user ? () => void signOut() : undefined}
    />
  );

  return (
    <>
      <aside
        className={cn(
          "hidden h-[calc(100dvh)] shrink-0 flex-col border-r border-border bg-popover transition-[width] duration-200 lg:flex",
          collapsed ? "w-16" : "w-[260px]",
        )}
      >
        {body("desktop")}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 lg:hidden" onClick={onCloseMobile}>
          <aside
            className="flex h-full w-[min(85vw,20rem)] flex-col border-r border-border bg-popover"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex justify-end p-2">
              <button
                type="button"
                aria-label="Close navigation"
                onClick={onCloseMobile}
                className={cn(ghostButton, "size-8")}
              >
                <X className="size-4" />
              </button>
            </div>
            {body("mobile")}
          </aside>
        </div>
      )}
    </>
  );
}

interface SidebarBodyProps {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  showCollapseToggle: boolean;
  pathname: string;
  threads: SearchableThread[];
  query: string;
  onQueryChange: (value: string) => void;
  activeId: string;
  loading: boolean;
  error: string | null;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  onTogglePin: (id: string, pinned: boolean) => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  navOpen: boolean;
  onToggleNavOpen: () => void;
  workspaces: { id: string; name: string }[];
  workspaceId: string;
  onSelectWorkspace: (id: string) => void;
  userEmail: string | null;
  connected: boolean;
  onSignOut?: () => void;
}

/**
 * The sidebar's actual content, shared by the desktop rail and the mobile
 * drawer (see ChatSidebar's `body()` above) so the two never drift apart.
 * `collapsed` only ever comes in true from the desktop rail - the mobile
 * drawer always renders it `false`, since an icon-only rail exists to
 * save width in a permanently-visible sidebar, which a temporary overlay
 * doesn't need.
 */
function SidebarBody({
  collapsed,
  onToggleCollapsed,
  showCollapseToggle,
  pathname,
  threads,
  query,
  onQueryChange,
  activeId,
  loading,
  error,
  onSelect,
  onNewChat,
  onTogglePin,
  onRename,
  onDelete,
  navOpen,
  onToggleNavOpen,
  workspaces,
  workspaceId,
  onSelectWorkspace,
  userEmail,
  connected,
  onSignOut,
}: SidebarBodyProps) {
  return (
    <>
      <div className={cn("flex items-center gap-2.5 border-b border-border p-3", collapsed && "justify-center px-2")}>
        <Image src="/veyaan-logo.png" alt="" width={36} height={36} className="size-9 shrink-0 rounded-lg" />
        {!collapsed && <span className="min-w-0 flex-1 truncate text-[15px] font-semibold tracking-wide text-foreground">VEYAAN</span>}
        {showCollapseToggle && (
          <button
            type="button"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={onToggleCollapsed}
            className={cn(ghostButton, "size-7 shrink-0")}
          >
            {collapsed ? <PanelLeftOpen className="size-3.5" /> : <PanelLeftClose className="size-3.5" />}
          </button>
        )}
      </div>

      <div className={cn("flex flex-col gap-2 p-3", collapsed && "items-center px-2")}>
        <button
          type="button"
          aria-label="New chat"
          onClick={onNewChat}
          className={cn(
            inkButton,
            "flex items-center justify-center gap-2 rounded-xl text-[13px] font-medium",
            collapsed ? "size-9" : "h-9",
          )}
        >
          <PlusIcon className="size-3.5 shrink-0" />
          {!collapsed && "New chat"}
        </button>

        {!collapsed && (
          <label className={cn(field, "flex items-center gap-2 rounded-xl px-2.5 py-1.5")}>
            <span className={cn(mono, "text-foreground/35 shrink-0")}>WS</span>
            <select
              aria-label="Select workspace"
              value={workspaceId}
              onChange={(event) => onSelectWorkspace(event.target.value)}
              disabled={!workspaces.length}
              className="min-w-0 flex-1 appearance-none bg-transparent text-[12.5px] text-foreground/85 outline-none disabled:text-foreground/35"
            >
              {!workspaces.length && <option value="">{userEmail ? "No workspace access" : "Sign in"}</option>}
              {workspaces.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </label>
        )}
      </div>

      {!collapsed && (
        <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-2">
          {loading && threads.length === 0 && (
            <p className={cn(mono, "px-2 text-foreground/35")}>Loading...</p>
          )}
          {error && <p className="px-2 text-[12px] leading-snug text-destructive/80">{error}</p>}
          {!loading && !error && (
            <ThreadSearch
              threads={threads}
              query={query}
              activeId={activeId}
              onQueryChange={onQueryChange}
              onSelect={onSelect}
              onTogglePin={onTogglePin}
              onRename={onRename}
              onDelete={onDelete}
              className="w-full max-w-none rounded-none bg-transparent p-0 shadow-none dark:bg-transparent dark:shadow-none"
            />
          )}
        </div>
      )}
      {collapsed && <div className="min-h-0 flex-1" />}

      <div className="border-t border-border p-2">
        {!collapsed ? (
          <>
            <button
              type="button"
              onClick={onToggleNavOpen}
              className={cn(ghostButton, "flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-[12px]")}
            >
              <span className={cn(mono, "text-foreground/40")}>Workspace</span>
              <ChevronDown className={cn("size-3.5 transition-transform", navOpen && "rotate-180")} />
            </button>
            {navOpen && (
              <nav className="mt-1 flex flex-col gap-0.5">
                {WORKSPACE_NAV.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] transition-colors",
                        isActive ? "bg-foreground/[0.06] text-foreground" : "text-foreground/60 hover:bg-foreground/[0.04] hover:text-foreground/90",
                      )}
                    >
                      <Icon className="size-3.5 shrink-0" />
                      <span className="truncate">{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
            )}
          </>
        ) : (
          <nav className="flex flex-col items-center gap-1">
            {WORKSPACE_NAV.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-label={item.name}
                  title={item.name}
                  className={cn(
                    "flex size-9 items-center justify-center rounded-lg transition-colors",
                    isActive ? "bg-foreground/[0.06] text-foreground" : "text-foreground/60 hover:bg-foreground/[0.04] hover:text-foreground/90",
                  )}
                >
                  <Icon className="size-3.5 shrink-0" />
                </Link>
              );
            })}
          </nav>
        )}
      </div>

      <div className={cn("flex items-center gap-2.5 border-t border-border p-3", collapsed && "justify-center px-2")}>
        <span
          aria-hidden
          className={cn("size-1.5 shrink-0 rounded-full", connected ? "bg-foreground" : "bg-foreground/25")}
        />
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <div className="truncate text-[12.5px] text-foreground/85">{userEmail ?? "Not signed in"}</div>
            <div className={cn(mono, "text-foreground/35")}>{connected ? "Connected" : "Offline"}</div>
          </div>
        )}
        {onSignOut && (
          <button
            type="button"
            aria-label="Sign out"
            onClick={onSignOut}
            className={cn(ghostButton, "size-7 shrink-0")}
          >
            <LogOut className="size-3.5" />
          </button>
        )}
      </div>
    </>
  );
}
