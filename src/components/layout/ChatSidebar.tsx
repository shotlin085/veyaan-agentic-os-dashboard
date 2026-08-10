"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bot,
  CheckCircle2,
  ChevronDown,
  Database,
  GitFork,
  LogOut,
  PlusIcon,
  Radio,
  Settings,
  ShieldCheck,
  Terminal,
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

/**
 * Replaces NavRail as the app's one persistent navigation surface -
 * conversations are the primary axis (New chat, search, real day-grouped
 * thread list from Hermes), the rest of the app hangs off a compact
 * disclosure underneath. Global (mounted once in AppShell), not scoped to
 * the chat page, so switching threads or starting a new one works from
 * anywhere and routes back to "/".
 */
export function ChatSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { conversations, activeId, loading, error, selectById, createConversation } = useConversations();
  const { user, signOut } = useAuth();
  const { workspaces, workspace, selectWorkspace } = useWorkspace();
  const { status } = useRuntimeStatus();
  const connected = status?.services.some((service) => service.state === "online") ?? false;
  const [query, setQuery] = useState("");
  const [navOpen, setNavOpen] = useState(true);

  const threads: SearchableThread[] = useMemo(
    () =>
      conversations.map((conversation) => ({
        id: conversation.id,
        title: conversation.title?.trim() || "New chat",
        group: dayGroup(conversation.updated_at),
        preview: conversation.channel === "voice" ? "Voice conversation" : "",
      })),
    [conversations],
  );

  const goToChat = () => {
    if (pathname !== "/") router.push("/");
  };

  return (
    <aside className="hidden h-[calc(100dvh)] w-[260px] shrink-0 flex-col border-r border-border bg-popover lg:flex">
      <div className="flex flex-col gap-2 p-3">
        <button
          type="button"
          onClick={() => {
            goToChat();
            void createConversation();
          }}
          className={cn(inkButton, "flex h-9 items-center justify-center gap-2 rounded-xl text-[13px] font-medium")}
        >
          <PlusIcon className="size-3.5" />
          New chat
        </button>

        <label className={cn(field, "flex items-center gap-2 rounded-xl px-2.5 py-1.5")}>
          <span className={cn(mono, "text-foreground/35 shrink-0")}>WS</span>
          <select
            aria-label="Select workspace"
            value={workspace?.id ?? ""}
            onChange={(event) => selectWorkspace(event.target.value)}
            disabled={!workspaces.length}
            className="min-w-0 flex-1 appearance-none bg-transparent text-[12.5px] text-foreground/85 outline-none disabled:text-foreground/35"
          >
            {!workspaces.length && <option value="">{user ? "No workspace access" : "Sign in"}</option>}
            {workspaces.map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-2">
        {loading && conversations.length === 0 && (
          <p className={cn(mono, "px-2 text-foreground/35")}>Loading...</p>
        )}
        {error && <p className="px-2 text-[12px] leading-snug text-destructive/80">{error}</p>}
        {!loading && !error && (
          <ThreadSearch
            threads={threads}
            query={query}
            activeId={activeId ?? ""}
            onQueryChange={setQuery}
            onSelect={(id) => {
              selectById(id);
              goToChat();
            }}
            className="w-full max-w-none rounded-none bg-transparent p-0 shadow-none dark:bg-transparent dark:shadow-none"
          />
        )}
      </div>

      <div className="border-t border-border p-2">
        <button
          type="button"
          onClick={() => setNavOpen((open) => !open)}
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
      </div>

      <div className="flex items-center gap-2.5 border-t border-border p-3">
        <span
          aria-hidden
          className={cn("size-1.5 shrink-0 rounded-full", connected ? "bg-foreground" : "bg-foreground/25")}
        />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[12.5px] text-foreground/85">{user?.email ?? "Not signed in"}</div>
          <div className={cn(mono, "text-foreground/35")}>{connected ? "Connected" : "Offline"}</div>
        </div>
        {user && (
          <button
            type="button"
            aria-label="Sign out"
            onClick={() => void signOut()}
            className={cn(ghostButton, "size-7 shrink-0")}
          >
            <LogOut className="size-3.5" />
          </button>
        )}
      </div>
    </aside>
  );
}
