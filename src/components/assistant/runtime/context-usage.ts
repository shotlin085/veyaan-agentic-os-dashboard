"use client";

import { useEffect, useState } from "react";

export interface ContextUsage {
  system: number;
  tools: number;
  messages: number;
  total: number;
}

export interface ContextUsageConfig {
  workspaceId: string;
  conversationId: string;
  token: string;
  /** A real OpenRouter model id (e.g. from the direct-model picker) to
   * preview against instead of the backend's own default (workspace
   * default model, else FAST_PATH_MODEL). */
  model?: string;
}

/**
 * Real, pre-flight context-window usage for the *next* message on this
 * conversation - GET /conversations/{id}/context-usage (app/conversations/
 * streaming_routes.py), proxied through /api/assistant/context-usage.
 * There's no server push for this, so `refreshKey` (pass e.g. the current
 * message count) is what triggers a refetch when a new turn lands, on top
 * of refetching whenever the conversation/workspace/model identity itself
 * changes.
 */
export function useContextUsage(config: ContextUsageConfig, refreshKey: number): ContextUsage | null {
  const [usage, setUsage] = useState<ContextUsage | null>(null);

  useEffect(() => {
    if (!config.workspaceId || !config.conversationId || !config.token) {
      setUsage(null);
      return;
    }

    const controller = new AbortController();
    const params = new URLSearchParams({
      workspaceId: config.workspaceId,
      conversationId: config.conversationId,
    });
    if (config.model) params.set("model", config.model);

    fetch(`/api/assistant/context-usage?${params.toString()}`, {
      headers: { authorization: `Bearer ${config.token}` },
      signal: controller.signal,
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { system?: number; tools?: number; messages?: number; total?: number } | null) => {
        if (!data) return;
        setUsage({
          system: data.system ?? 0,
          tools: data.tools ?? 0,
          messages: data.messages ?? 0,
          total: data.total ?? 0,
        });
      })
      .catch(() => {
        // Network/abort failure - leave the previous usage (if any) in
        // place rather than flashing the meter to empty on a transient
        // blip.
      });

    return () => controller.abort();
  }, [config.workspaceId, config.conversationId, config.token, config.model, refreshKey]);

  return usage;
}
