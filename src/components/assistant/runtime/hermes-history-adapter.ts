"use client";

import { ExportedMessageRepository, type ThreadHistoryAdapter } from "@assistant-ui/react";

interface HermesTurn {
  id: string;
  role: string;
  content: string;
  content_type: string;
  model_used: string | null;
  tokens_used: Record<string, number | null> | null;
  created_at: string;
}

export interface HermesHistoryConfig {
  workspaceId: string;
  conversationId: string;
  token: string;
}

/**
 * Reads real conversation history from Hermes's GET .../messages endpoint
 * (added specifically to make this possible - previously a refresh always
 * lost the transcript even though the conversation itself persisted).
 *
 * `append` is a deliberate no-op: Hermes already durably persists both
 * the user turn and the assistant turn as a side effect of the streaming
 * POST .../messages call itself (see hermes-adapter.ts, which is what the
 * client actually calls to send a message) - a real append() here would
 * double-write every turn Hermes has already saved.
 */
export function createHermesHistoryAdapter(config: HermesHistoryConfig): ThreadHistoryAdapter {
  return {
    async load() {
      if (!config.workspaceId || !config.conversationId || !config.token) {
        return { messages: [] };
      }
      const response = await fetch(
        `/api/workspaces/${config.workspaceId}/conversations/${config.conversationId}/messages`,
        { headers: { authorization: `Bearer ${config.token}` }, cache: "no-store" },
      ).catch(() => null);

      if (!response || !response.ok) return { messages: [] };
      const turns = (await response.json().catch(() => [])) as HermesTurn[];
      if (!Array.isArray(turns)) return { messages: [] };

      return ExportedMessageRepository.fromArray(
        turns
          .filter((turn): turn is HermesTurn => turn.role === "user" || turn.role === "assistant")
          .map((turn) => ({
            id: turn.id,
            role: turn.role as "user" | "assistant",
            content: turn.content,
            createdAt: new Date(turn.created_at),
          })),
      );
    },
    async append() {
      // no-op - see module docstring above.
    },
  };
}
