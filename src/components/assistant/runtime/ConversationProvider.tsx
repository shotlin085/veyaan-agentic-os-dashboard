"use client";

import { createContext, useContext, type FC, type ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import { useHermesConversations, type HermesConversation } from "./hermes-conversations";

interface ConversationContextValue {
  loading: boolean;
  error: string | null;
  conversations: HermesConversation[];
  activeId: string | null;
  activeConversation: HermesConversation | null;
  selectById: (id: string) => void;
  createConversation: (agentDefinitionId?: string) => Promise<string | null>;
  refresh: () => Promise<void>;
  setPinned: (id: string, pinned: boolean) => Promise<void>;
  renameConversation: (id: string, title: string) => Promise<void>;
  deleteConversation: (id: string) => Promise<boolean>;
}

const ConversationContext = createContext<ConversationContextValue | null>(null);

/**
 * Wraps the one real useHermesConversations() call for the whole app so
 * ChatSidebar (global, in AppShell) and the chat page agree on which
 * conversation is active - previously each mounted its own hook instance,
 * which would have desynced the moment the sidebar became app-wide instead
 * of local to /assistant.
 *
 * The active conversation id lives in the URL (/c/[conversationId]), not
 * in React state - selectById/createConversation navigate there instead
 * of setting local state, so a refresh, a bookmark, or the browser's
 * back/forward buttons all land on the real conversation instead of
 * whichever one this provider happened to have picked last time.
 */
export const ConversationProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const router = useRouter();
  const params = useParams<{ conversationId?: string }>();
  const hook = useHermesConversations();
  const activeId = params?.conversationId ?? null;
  const activeConversation = hook.conversations.find((c) => c.id === activeId) ?? null;

  const value: ConversationContextValue = {
    loading: hook.loading,
    error: hook.error,
    conversations: hook.conversations,
    activeId,
    activeConversation,
    selectById: (id) => router.push(`/c/${id}`),
    createConversation: async (agentDefinitionId) => {
      const id = await hook.createConversation(agentDefinitionId);
      if (id) router.push(`/c/${id}`);
      return id;
    },
    refresh: hook.refresh,
    setPinned: hook.setPinned,
    renameConversation: hook.renameConversation,
    deleteConversation: async (id) => {
      const wasActive = id === activeId;
      const ok = await hook.deleteConversation(id);
      // Deleting the conversation you're currently looking at would
      // otherwise leave the page pointed at a URL that 404s the next
      // time the list refreshes - send it back to the neutral "pick a
      // conversation" route instead.
      if (ok && wasActive) router.push("/");
      return ok;
    },
  };

  return <ConversationContext.Provider value={value}>{children}</ConversationContext.Provider>;
};

export function useConversations(): ConversationContextValue {
  const ctx = useContext(ConversationContext);
  if (!ctx) throw new Error("useConversations must be used within a ConversationProvider");
  return ctx;
}
