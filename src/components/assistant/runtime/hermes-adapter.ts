import type { ChatModelAdapter, ThreadMessage } from "@assistant-ui/react";

/**
 * The orchestrator's SSE frames carry no `event:` line - every line is
 * `data: {"event": "...", ...}` (app/conversations/streaming_routes.py) -
 * so this is a discriminated union over that inner `event` field, not a
 * native EventSource payload shape.
 *
 * Only the first three exist on the backend today. `assistant.usage` and
 * `assistant.route` are read defensively for forward-compat with the
 * planned backend change that adds them (token usage was already being
 * captured server-side and simply never emitted) - they just never arrive
 * until then, and the switch below no-ops on unknown event names.
 * `assistant.tool.progress` (same change) is deliberately not handled
 * here yet: real tool-call rendering needs the ToolCall element, which
 * isn't installed until a later phase.
 */
type HermesStreamEvent =
  | { event: "assistant.token.delta"; content?: string }
  | { event: "assistant.message.completed"; content?: string; finish_reason?: string | null }
  | { event: "runtime.failed"; error?: string }
  | { event: "assistant.usage"; prompt_tokens?: number; completion_tokens?: number; total_tokens?: number }
  | { event: "assistant.route"; path?: "fast" | "escalated"; model?: string };

export interface HermesAdapterConfig {
  workspaceId: string;
  conversationId: string;
  token: string;
}

export interface HermesUsage {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
}

export interface HermesRoute {
  path?: "fast" | "escalated";
  model?: string;
}

function lastUserMessageText(messages: readonly ThreadMessage[]): string {
  const message = [...messages].reverse().find((entry) => entry.role === "user");
  if (!message || !Array.isArray(message.content)) return "";
  return message.content
    .filter((part): part is { type: "text"; text: string } => part.type === "text")
    .map((part) => part.text)
    .join(" ");
}

/**
 * Bridges assistant-ui's ChatModelAdapter contract to Hermes's streaming
 * conversation API. Only the last user turn is sent - Hermes holds
 * conversation state server-side keyed by conversationId, so full history
 * replay isn't needed (or supported: the endpoint only accepts
 * {content: string}).
 */
export function createHermesAdapter(config: HermesAdapterConfig): ChatModelAdapter {
  return {
    async *run({ messages, abortSignal }) {
      const content = lastUserMessageText(messages);

      if (!config.workspaceId || !config.conversationId || !config.token) {
        yield {
          content: [{ type: "text", text: "Sign in and select a workspace to start a real Hermes conversation." }],
          status: { type: "complete", reason: "stop" },
        };
        return;
      }

      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${config.token}` },
        body: JSON.stringify({ workspaceId: config.workspaceId, conversationId: config.conversationId, content }),
        signal: abortSignal,
      }).catch(() => null);

      if (!response) {
        yield {
          content: [{ type: "text", text: "" }],
          status: { type: "complete", reason: "stop" },
        };
        return;
      }

      if (!response.ok || !response.body) {
        const detail = await response.text().catch(() => "");
        yield {
          content: [{ type: "text", text: detail || "Hermes request failed." }],
          status: { type: "incomplete", reason: "error" },
        };
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let accumulated = "";
      let usage: HermesUsage | undefined;
      let route: HermesRoute | undefined;
      let finished = false;
      let errored = false;

      while (!finished) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const frames = buffer.split("\n\n");
        buffer = frames.pop() ?? "";

        for (const frame of frames) {
          const line = frame.split("\n").find((entry) => entry.startsWith("data: "));
          if (!line) continue;

          let parsed: HermesStreamEvent;
          try {
            parsed = JSON.parse(line.slice("data: ".length));
          } catch {
            continue;
          }

          switch (parsed.event) {
            case "assistant.token.delta":
              accumulated += parsed.content ?? "";
              break;
            case "assistant.message.completed":
              accumulated = parsed.content ?? accumulated;
              finished = true;
              break;
            case "runtime.failed":
              accumulated = parsed.error ?? "Hermes runtime failed.";
              finished = true;
              errored = true;
              break;
            case "assistant.usage":
              usage = {
                promptTokens: parsed.prompt_tokens,
                completionTokens: parsed.completion_tokens,
                totalTokens: parsed.total_tokens,
              };
              break;
            case "assistant.route":
              route = { path: parsed.path, model: parsed.model };
              break;
            default:
              break;
          }

          let status: { type: "running" } | { type: "complete"; reason: "stop" } | { type: "incomplete"; reason: "error" };
          if (!finished) status = { type: "running" };
          else if (errored) status = { type: "incomplete", reason: "error" };
          else status = { type: "complete", reason: "stop" };

          yield {
            content: [{ type: "text", text: accumulated }],
            status,
            metadata: { custom: { usage, route } },
          };
        }

        if (finished) break;
      }
    },
  };
}
