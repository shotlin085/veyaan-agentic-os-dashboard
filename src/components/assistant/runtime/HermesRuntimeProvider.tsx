"use client";

import { type ReactNode, useMemo } from "react";
import { AssistantRuntimeProvider, useLocalRuntime } from "@assistant-ui/react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useWorkspace } from "@/lib/workspace/WorkspaceProvider";
import { createHermesAdapter } from "./hermes-adapter";
import { createHermesHistoryAdapter } from "./hermes-history-adapter";
import type { HermesConversation } from "./hermes-conversations";

interface HermesRuntimeProviderProps {
  conversation: HermesConversation | null;
  children: ReactNode;
}

/**
 * Mounts a fresh assistant-ui runtime for the active conversation. Keying
 * on the conversation id (see the parent's `key=` below) is what makes
 * the history adapter's `load()` run again on every switch - assistant-ui
 * calls it once per runtime instance, not per conversation, so a remount
 * is what actually triggers a fresh history fetch for the newly active
 * conversation rather than reusing whatever the previous one loaded.
 */
function HermesRuntimeMount({ conversation, children }: HermesRuntimeProviderProps) {
  const { session } = useAuth();
  const { workspace } = useWorkspace();

  const runtimeConfig = useMemo(
    () => ({
      workspaceId: workspace?.id ?? "",
      conversationId: conversation?.id ?? "",
      token: session?.access_token ?? "",
    }),
    [workspace?.id, conversation?.id, session?.access_token],
  );

  const adapter = useMemo(() => createHermesAdapter(runtimeConfig), [runtimeConfig]);
  const history = useMemo(() => createHermesHistoryAdapter(runtimeConfig), [runtimeConfig]);
  // Lets a message typed while a run is in flight queue instead of being
  // blocked or silently discarded - real assistant-ui capability, no
  // backend change needed (see bindings/Thread.tsx's QueuePanel).
  const runtime = useLocalRuntime(adapter, { adapters: { history }, unstable_enableMessageQueue: true });

  return <AssistantRuntimeProvider runtime={runtime}>{children}</AssistantRuntimeProvider>;
}

export function HermesRuntimeProvider({ conversation, children }: HermesRuntimeProviderProps) {
  return (
    <HermesRuntimeMount key={conversation?.id ?? "none"} conversation={conversation}>
      {children}
    </HermesRuntimeMount>
  );
}
