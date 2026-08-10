"use client";

import { createContext, useContext, type FC, type ReactNode } from "react";
import { useHermesConversations, type HermesConversation } from "./hermes-conversations";

interface ConversationContextValue {
  loading: boolean;
  error: string | null;
  conversations: HermesConversation[];
  activeId: string | null;
  activeConversation: HermesConversation | null;
  selectById: (id: string) => void;
  createConversation: () => Promise<string | null>;
}

const ConversationContext = createContext<ConversationContextValue | null>(null);

/**
 * Wraps the one real useHermesConversations() call for the whole app so
 * ChatSidebar (global, in AppShell) and the chat page agree on which
 * conversation is active - previously each mounted its own hook instance,
 * which would have desynced the moment the sidebar became app-wide instead
 * of local to /assistant.
 */
export const ConversationProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const hook = useHermesConversations();
  const activeConversation = hook.conversations.find((c) => c.id === hook.activeId) ?? null;

  const value: ConversationContextValue = {
    loading: hook.loading,
    error: hook.error,
    conversations: hook.conversations,
    activeId: hook.activeId,
    activeConversation,
    selectById: (id) => {
      const index = hook.conversations.findIndex((c) => c.id === id);
      if (index !== -1) hook.selectByIndex(index);
    },
    createConversation: hook.createConversation,
  };

  return <ConversationContext.Provider value={value}>{children}</ConversationContext.Provider>;
};

export function useConversations(): ConversationContextValue {
  const ctx = useContext(ConversationContext);
  if (!ctx) throw new Error("useConversations must be used within a ConversationProvider");
  return ctx;
}
