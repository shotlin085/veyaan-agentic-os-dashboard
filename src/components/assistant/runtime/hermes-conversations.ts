"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useWorkspace } from "@/lib/workspace/WorkspaceProvider";

export interface HermesConversation {
  id: string;
  workspace_id: string;
  project_id: string | null;
  title: string | null;
  status: string;
  channel: string;
  pinned: boolean;
  created_at: string;
  updated_at: string;
}

interface UseHermesConversationsResult {
  loading: boolean;
  error: string | null;
  conversations: HermesConversation[];
  createConversation: () => Promise<string | null>;
  refresh: () => Promise<void>;
  setPinned: (id: string, pinned: boolean) => Promise<void>;
}

/**
 * Manages the list of real Hermes conversations for the active workspace.
 * Which one is "active" is no longer tracked here - it's derived from the
 * URL (see ConversationProvider.tsx's /c/[conversationId] route), so a
 * refresh, a bookmark, or browser back/forward all land on the same real
 * conversation instead of whatever this hook happened to auto-select.
 * Switching conversations (or refreshing the page) restores real history
 * via hermes-history-adapter.ts's GET .../messages call - there is no
 * local caching here, so every switch is a fresh fetch, not an
 * optimistic or stale read.
 */
export function useHermesConversations(): UseHermesConversationsResult {
  const { session } = useAuth();
  const { workspace } = useWorkspace();
  const token = session?.access_token;
  const workspaceId = workspace?.id;

  const [conversations, setConversations] = useState<HermesConversation[]>([]);
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
      // No title here - left null so the backend's own first-message
      // auto-title (streaming_routes.py) can set it; the sidebar already
      // falls back to displaying "New chat" for a null title in the
      // meantime (see ChatSidebar.tsx's threads mapping).
      const response = await fetch(`/api/workspaces/${workspaceId}/conversations`, {
        method: "POST",
        headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
        body: JSON.stringify({ channel: "web" }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(String(payload.detail ?? payload.error ?? "Could not start a conversation."));
      const created = payload as HermesConversation;
      setConversations((current) => [created, ...current]);
      return created.id;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not start a conversation.");
      return null;
    }
  }, [token, workspaceId]);

  const setPinned = useCallback(
    async (id: string, pinned: boolean): Promise<void> => {
      if (!token || !workspaceId) return;
      // Optimistic - pin toggles should feel instant, and a failed PATCH
      // still leaves the list in a reasonable state once refresh() next runs.
      setConversations((current) => current.map((c) => (c.id === id ? { ...c, pinned } : c)));
      try {
        const response = await fetch(`/api/workspaces/${workspaceId}/conversations/${id}`, {
          method: "PATCH",
          headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
          body: JSON.stringify({ pinned }),
        });
        if (!response.ok) throw new Error("Pin update failed.");
      } catch (cause) {
        setConversations((current) => current.map((c) => (c.id === id ? { ...c, pinned: !pinned } : c)));
        setError(cause instanceof Error ? cause.message : "Pin update failed.");
      }
    },
    [token, workspaceId],
  );

  return { loading, error, conversations, createConversation, refresh, setPinned };
}
