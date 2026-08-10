"use client";

import { type ReactNode, useMemo } from "react";
import { AssistantRuntimeProvider, useLocalRuntime } from "@assistant-ui/react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useWorkspace } from "@/lib/workspace/WorkspaceProvider";
import { createHermesAdapter } from "./hermes-adapter";
import type { HermesConversation } from "./hermes-conversations";

interface HermesRuntimeProviderProps {
  conversation: HermesConversation | null;
  children: ReactNode;
}

/**
 * Mounts a fresh assistant-ui runtime for the active conversation. Keying
 * on the conversation id (see the parent's `key=` below) is deliberate:
 * Hermes has no message-history endpoint yet, so there is nothing to
 * restore when switching conversations - a remount gives an honest blank
 * thread rather than faking a reload of a transcript that isn't actually
 * fetched. Real history (ThreadHistoryAdapter wired to a GET .../messages
 * endpoint) is a backend-dependent upgrade for a later phase.
 */
function HermesRuntimeMount({ conversation, children }: HermesRuntimeProviderProps) {
  const { session } = useAuth();
  const { workspace } = useWorkspace();

  const adapter = useMemo(
    () =>
      createHermesAdapter({
        workspaceId: workspace?.id ?? "",
        conversationId: conversation?.id ?? "",
        token: session?.access_token ?? "",
      }),
    [workspace?.id, conversation?.id, session?.access_token],
  );
  const runtime = useLocalRuntime(adapter);

  return <AssistantRuntimeProvider runtime={runtime}>{children}</AssistantRuntimeProvider>;
}

export function HermesRuntimeProvider({ conversation, children }: HermesRuntimeProviderProps) {
  return (
    <HermesRuntimeMount key={conversation?.id ?? "none"} conversation={conversation}>
      {children}
    </HermesRuntimeMount>
  );
}
