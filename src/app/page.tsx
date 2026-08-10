"use client";

import { LockKeyhole } from "lucide-react";
import { Thread } from "@/components/assistant/bindings/Thread";
import { HermesRuntimeProvider } from "@/components/assistant/runtime/HermesRuntimeProvider";
import { useConversations } from "@/components/assistant/runtime/ConversationProvider";

/**
 * The app's index - a ChatGPT/Claude-shaped assistant is the front door,
 * not a separate dashboard (see /dashboard for the old Command Centre,
 * kept on disk but out of primary nav). ChatSidebar (mounted globally in
 * AppShell) owns the thread list; this page only needs to know which
 * conversation is active, via the same ConversationProvider the sidebar
 * reads from, so the two never desync.
 */
export default function ChatHomePage() {
  const { activeConversation, activeId, loading } = useConversations();

  return (
    <div className="flex h-full min-h-0 flex-col">
      {!activeId ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
          <LockKeyhole className="size-6 text-foreground/30" />
          <p className="text-sm text-foreground/55">
            {loading ? "Starting a conversation..." : "Sign in and select a workspace to start a real Hermes conversation."}
          </p>
        </div>
      ) : (
        <HermesRuntimeProvider conversation={activeConversation}>
          <Thread />
        </HermesRuntimeProvider>
      )}
    </div>
  );
}
