"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useWorkspace } from "@/lib/workspace/WorkspaceProvider";

export interface HermesConversation {
  id: string;
  workspace_id: string;
  project_id: string | null;
  title: string | null;
  status: string;
  channel: string;
  created_at: string;
  updated_at: string;
}

interface UseHermesConversationsResult {
  loading: boolean;
  error: string | null;
  conversations: HermesConversation[];
  activeId: string | null;
  activeIndex: number;
  selectByIndex: (index: number) => void;
  createConversation: () => Promise<string | null>;
  refresh: () => Promise<void>;
}

/**
 * Manages the list of real Hermes conversations for the active workspace
 * and which one is "active" in this browser tab. Switching conversations
 * (or refreshing the page) now restores real history via
 * hermes-history-adapter.ts's GET .../messages call - there is no local
 * caching here, so every switch is a fresh fetch, not an optimistic or
 * stale read.
 */
export function useHermesConversations(): UseHermesConversationsResult {
  const { session } = useAuth();
  const { workspace } = useWorkspace();
  const token = session?.access_token;
  const workspaceId = workspace?.id;

  const [conversations, setConversations] = useState<HermesConversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!token || !workspaceId) {
      setConversations([]);
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/conversations`, {
        headers: { authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const payload = await response.json().catch(() => ([]));
      if (!response.ok) throw new Error(String((payload as { detail?: string; error?: string }).detail ?? (payload as { error?: string }).error ?? "Conversation list failed."));
      const list = Array.isArray(payload) ? (payload as HermesConversation[]) : [];
      list.sort((a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at));
      setConversations(list);
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Conversation list failed.");
    } finally {
      setLoading(false);
    }
  }, [token, workspaceId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const createConversation = useCallback(async (): Promise<string | null> => {
    if (!token || !workspaceId) return null;
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/conversations`, {
        method: "POST",
        headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
        body: JSON.stringify({ title: "New chat", channel: "web" }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(String(payload.detail ?? payload.error ?? "Could not start a conversation."));
      const created = payload as HermesConversation;
      setConversations((current) => [created, ...current]);
      setActiveId(created.id);
      return created.id;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not start a conversation.");
      return null;
    }
  }, [token, workspaceId]);

  // Start the first conversation automatically once the list is known.
  useEffect(() => {
    if (activeId || loading) return;
    if (conversations.length > 0) {
      setActiveId(conversations[0]!.id);
      return;
    }
    if (!loading && token && workspaceId) void createConversation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations, loading, token, workspaceId]);

  const activeIndex = useMemo(
    () => conversations.findIndex((conversation) => conversation.id === activeId),
    [conversations, activeId],
  );

  const selectByIndex = useCallback((index: number) => {
    const target = conversations[index];
    if (target) setActiveId(target.id);
  }, [conversations]);

  return { loading, error, conversations, activeId, activeIndex, selectByIndex, createConversation, refresh };
}
