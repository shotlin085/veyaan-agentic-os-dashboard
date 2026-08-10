"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CommandPalette as CommandPaletteElement, type PaletteCommand } from "@/components/elements/command-palette";
import { useConversations } from "@/components/assistant/runtime/ConversationProvider";

const STATIC_COMMANDS: PaletteCommand[] = [
  { id: "nav-chat", label: "Go to Chat", group: "Navigate", keys: ["G", "C"] },
  { id: "nav-agents", label: "Go to Agents", group: "Navigate", keys: [] },
  { id: "nav-workflows", label: "Go to Workflows", group: "Navigate", keys: [] },
  { id: "nav-memory", label: "Go to Memory", group: "Navigate", keys: [] },
  { id: "nav-approvals", label: "Go to Approvals", group: "Navigate", keys: [] },
  { id: "nav-qa", label: "Go to QA", group: "Navigate", keys: [] },
  { id: "nav-logs", label: "Go to Logs", group: "Navigate", keys: [] },
  { id: "nav-voice", label: "Go to Voice", group: "Navigate", keys: [] },
  { id: "nav-settings", label: "Go to Settings", group: "Navigate", keys: [] },
  { id: "new-chat", label: "Start a new chat", group: "Actions", keys: ["⌘", "N"] },
];

const ROUTES: Record<string, string> = {
  "nav-chat": "/",
  "nav-agents": "/agents",
  "nav-workflows": "/workflows",
  "nav-memory": "/memory",
  "nav-approvals": "/approvals",
  "nav-qa": "/qa",
  "nav-logs": "/logs",
  "nav-voice": "/voice",
  "nav-settings": "/settings",
};

/**
 * App-wide Cmd+K, replacing the old TopBar-anchored palette. Owns its own
 * open state and key listener so it can live directly in AppShell with no
 * TopBar to host a trigger button.
 */
export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState(STATIC_COMMANDS[0]!.id);
  const router = useRouter();
  const { createConversation } = useConversations();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((current) => !current);
      } else if (event.key === "Escape" && open) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const commands = useMemo(() => STATIC_COMMANDS, []);

  if (!open) return null;

  const run = (id: string) => {
    setOpen(false);
    setQuery("");
    if (id === "new-chat") {
      void createConversation();
      router.push("/");
      return;
    }
    const href = ROUTES[id];
    if (href) router.push(href);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-24"
      onClick={() => setOpen(false)}
    >
      <div onClick={(event) => event.stopPropagation()}>
        <CommandPaletteElement
          commands={commands}
          query={query}
          activeId={activeId}
          onQueryChange={setQuery}
          onActiveChange={setActiveId}
          onRun={run}
        />
      </div>
    </div>
  );
}
