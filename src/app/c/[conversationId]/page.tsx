"use client";

import Link from "next/link";
import { Bot, LockKeyhole, MessageCircleQuestion } from "lucide-react";
import { Thread } from "@/components/assistant/bindings/Thread";
import { HermesRuntimeProvider } from "@/components/assistant/runtime/HermesRuntimeProvider";
import { useConversations } from "@/components/assistant/runtime/ConversationProvider";
import { ActiveAgentProvider, useActiveAgent } from "@/components/assistant/runtime/ActiveAgentContext";
import { inkButton } from "@/components/elements/surfaces";
import { cn } from "@/lib/utils";

/** Shown at the top of an agent-scoped conversation so which agent is
 * actually driving it is visible in the UI itself, not something you have
 * to go check the record for. Renders nothing for a normal conversation
 * (no agent_definition_id) or while the name is still loading. */
function ActiveAgentBanner() {
  const { agentDefinitionId, displayName, loading } = useActiveAgent();
  if (!agentDefinitionId || (!displayName && loading)) return null;
  return (
    <div className="flex shrink-0 items-center gap-2 border-b border-border bg-popover/60 px-4 py-2 text-xs text-muted-foreground">
      <Bot className="size-3.5 text-foreground/60" />
      Chatting with <span className="font-semibold text-foreground">{displayName ?? "an agent"}</span>
    </div>
  );
}

/**
 * One real, bookmarkable conversation per URL - refresh, browser
 * back/forward, or a saved link all land on the same Hermes conversation
 * (see ConversationProvider.tsx, which derives activeId from this route's
 * [conversationId] segment rather than component state).
 */
export default function ConversationPage() {
  const { activeConversation, activeId, loading, conversations, refresh } = useConversations();
  const notFound = !loading && conversations.length > 0 && !activeConversation;

  return (
    <div className="flex h-full min-h-0 flex-col">
      {!activeId ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
          <LockKeyhole className="size-6 text-foreground/30" />
          <p className="text-sm text-foreground/55">Sign in and select a workspace to start a real Hermes conversation.</p>
        </div>
      ) : notFound ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
          <MessageCircleQuestion className="size-6 text-foreground/30" />
          <p className="text-sm text-foreground/55">This conversation doesn&apos;t exist in this workspace.</p>
          <Link href="/" className={cn(inkButton, "rounded-full px-4 py-2 text-[13px] font-medium")}>
            Start a new chat
          </Link>
        </div>
      ) : !activeConversation ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
          <p className="text-sm text-foreground/55">Loading conversation...</p>
        </div>
      ) : (
        <ActiveAgentProvider agentDefinitionId={activeConversation.agent_definition_id}>
          <ActiveAgentBanner />
          <HermesRuntimeProvider conversation={activeConversation} onTurnSettled={() => void refresh()}>
            <Thread />
          </HermesRuntimeProvider>
        </ActiveAgentProvider>
      )}
    </div>
  );
}
