"use client";

import { ExportedMessageRepository, type ThreadHistoryAdapter } from "@assistant-ui/react";
import type { HermesPlan, HermesRoute, HermesUsage } from "./hermes-adapter";

interface HermesTurn {
  id: string;
  role: string;
  content: string;
  content_type: string;
  model_used: string | null;
  tokens_used: Record<string, number | null> | null;
  // Present on plan-mode turns (see streaming_routes.py's _run_plan_path) -
  // every other turn has this as {} (the column's own default).
  meta?: { plan?: HermesPlan } | null;
  created_at: string;
}

export interface HermesHistoryConfig {
  workspaceId: string;
  conversationId: string;
  token: string;
}

/** Infers the same {path, model} shape the live SSE assistant.route event
 * carries, from the model_used string a completed turn was persisted with -
 * the mapping mirrors streaming_routes.py's own real constants
 * (FAST_PATH_MODEL="openrouter/free", HERMES_MODEL="hermes-agent"; anything
 * else is a real GET .../hermes/model-options catalog id from the
 * session-based model-lock path), not a guess. */
function hermesTurnCustom(turn: HermesTurn): { usage?: HermesUsage; route?: HermesRoute; plan?: HermesPlan } {
  if (!turn.model_used) return {};
  // "custom:{provider_id}:{model}" - streaming_routes.py's
  // _run_custom_provider_path's own model_used encoding for a bring-
  // your-own-key turn (app/providers/); model itself may contain ":",
  // so split into at most 3 parts rather than assuming none does.
  const customMatch = /^custom:([^:]+):(.+)$/.exec(turn.model_used);
  // "direct:{model}" - _run_direct_openrouter_path's encoding for a real
  // OpenRouter model called directly (reasoning-effort path).
  const directMatch = /^direct:(.+)$/.exec(turn.model_used);
  const route: HermesRoute = customMatch
    ? { path: "custom", providerId: customMatch[1], model: customMatch[2] }
    : directMatch
      ? { path: "direct", model: directMatch[1] }
      : turn.model_used === "openrouter/free"
        ? { path: "fast", model: turn.model_used }
        : turn.model_used === "hermes-agent"
          ? { path: "escalated", model: turn.model_used }
          : { path: "model", model: turn.model_used };
  const usage: HermesUsage | undefined = turn.tokens_used
    ? {
        promptTokens: turn.tokens_used.prompt ?? undefined,
        completionTokens: turn.tokens_used.completion ?? undefined,
        totalTokens:
          turn.tokens_used.prompt != null && turn.tokens_used.completion != null
            ? turn.tokens_used.prompt + turn.tokens_used.completion
            : undefined,
        reasoningTokens: turn.tokens_used.reasoning ?? undefined,
      }
    : undefined;
  return { usage, route, plan: turn.meta?.plan ?? undefined };
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
            // Real model_used/tokens_used, already durably stored per turn
            // (see app/conversations/streaming_routes.py's _persist_assistant_
            // turn) - lets ResponseMeta (bindings/Thread.tsx) show real
            // provider/model/cost for history too, not just freshly-streamed
            // replies. No `timing` here: latency was never recorded per turn
            // (ConversationTurn.latency_ms exists in the schema but nothing
            // writes it), so it's honestly omitted rather than guessed.
            ...(turn.role === "assistant" ? { metadata: { custom: hermesTurnCustom(turn) } } : {}),
          })),
      );
    },
    async append() {
      // no-op - see module docstring above.
    },
  };
}
