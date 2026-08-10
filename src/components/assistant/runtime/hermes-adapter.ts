import type { ChatModelAdapter, MessageTiming, ThreadAssistantMessagePart, ThreadMessage } from "@assistant-ui/react";

/**
 * The orchestrator's SSE frames carry no `event:` line - every line is
 * `data: {"event": "...", ...}` (app/conversations/streaming_routes.py) -
 * so this is a discriminated union over that inner `event` field, not a
 * native EventSource payload shape.
 */
type HermesStreamEvent =
  | { event: "assistant.token.delta"; content?: string }
  | { event: "assistant.message.completed"; content?: string; finish_reason?: string | null }
  | { event: "runtime.failed"; error?: string }
  | { event: "assistant.usage"; prompt_tokens?: number; completion_tokens?: number; total_tokens?: number }
  | { event: "assistant.route"; path?: "fast" | "escalated" | "model" | "custom"; model?: string; provider_id?: string }
  | {
      event: "assistant.tool.progress";
      tool?: string;
      emoji?: string;
      label?: string;
      tool_call_id?: string;
      status?: "running" | "completed" | "failed";
    };

interface ToolCallState {
  toolCallId: string;
  toolName: string;
  label?: string;
  emoji?: string;
  status: "running" | "completed" | "failed";
}

export interface HermesAdapterConfig {
  workspaceId: string;
  conversationId: string;
  token: string;
  /** Fired once a turn finishes (success, error, or cancel) so the
   * sidebar can re-fetch and pick up the backend's updated_at bump / any
   * newly auto-derived title (see streaming_routes.py's send_message) -
   * without this, a conversation you just used never re-sorts to the top
   * of its day group until a full page reload. */
  onTurnSettled?: () => void;
}

export interface HermesUsage {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
}

export interface HermesRoute {
  path?: "fast" | "escalated" | "model" | "custom";
  model?: string;
  providerId?: string;
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
    async *run({ messages, abortSignal, runConfig }) {
      const content = lastUserMessageText(messages);
      // Set via aui.composer.setRunConfig({custom:{model}}) by the
      // composer's model picker (bindings/Thread.tsx's ModelPickerButton).
      // Absent/undefined ("Auto") keeps the orchestrator's existing fast/
      // escalate routing; a real model id bypasses it for a session
      // locked to that model (SendMessageRequest.model on the backend).
      const model = typeof runConfig.custom?.model === "string" ? runConfig.custom.model : undefined;
      // Set alongside `model` only when the picker's chosen entry came
      // from a bring-your-own-key provider (ModelPickerButton) - routes
      // through that provider's own API server-side instead of Hermes.
      const providerId = typeof runConfig.custom?.providerId === "string" ? runConfig.custom.providerId : undefined;

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
        body: JSON.stringify({
          workspaceId: config.workspaceId,
          conversationId: config.conversationId,
          content,
          model,
          providerId,
        }),
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
      const toolCalls = new Map<string, ToolCallState>();

      // Real wall-clock timing, not estimated - streamStartTime/firstTokenTime
      // are captured as the SSE frames actually arrive over the network, so
      // "model time" in the UI reflects the real request, not a guess.
      const streamStartTime = Date.now();
      let firstTokenTime: number | undefined;
      let totalChunks = 0;
      const buildTiming = (): MessageTiming => {
        const now = Date.now();
        return {
          streamStartTime,
          firstTokenTime,
          totalStreamTime: finished ? now - streamStartTime : undefined,
          tokenCount: usage?.completionTokens,
          tokensPerSecond:
            finished && usage?.completionTokens && now > streamStartTime
              ? usage.completionTokens / ((now - streamStartTime) / 1000)
              : undefined,
          totalChunks,
          toolCallCount: toolCalls.size,
        };
      };

      const buildToolParts = (): ThreadAssistantMessagePart[] =>
        Array.from(toolCalls.values()).map((call) => ({
          type: "tool-call",
          toolCallId: call.toolCallId,
          toolName: call.toolName,
          // Hermes only sends emoji/label on the tool call's "running"
          // frame (see the case block below), so this is real per-call
          // data, not a placeholder - args has no other real content to
          // carry, since Hermes's tool.progress events never include
          // structured call arguments. Omit the key entirely rather than
          // `emoji: undefined` - args must be valid JSON.
          args: (call.emoji ? { emoji: call.emoji } : {}) as Record<string, string>,
          argsText: call.label ?? call.toolName,
          result: call.status === "running" ? undefined : call.status === "failed" ? "Failed" : "Done",
          isError: call.status === "failed",
        }));

      try {
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
                if (firstTokenTime === undefined) firstTokenTime = Date.now();
                totalChunks += 1;
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
                route = { path: parsed.path, model: parsed.model, providerId: parsed.provider_id };
                break;
              case "assistant.tool.progress": {
                // Hermes only sends `label`/`emoji` on the "running" event -
                // the matching "completed"/"failed" event for the same
                // tool_call_id carries just {tool, toolCallId, status}, so the
                // existing record's label/emoji/tool must be preserved across
                // the update rather than overwritten with undefined.
                const id = parsed.tool_call_id;
                if (id) {
                  const existing = toolCalls.get(id);
                  toolCalls.set(id, {
                    toolCallId: id,
                    toolName: parsed.tool ?? existing?.toolName ?? "tool",
                    label: parsed.label ?? existing?.label,
                    emoji: parsed.emoji ?? existing?.emoji,
                    status: parsed.status === "completed" || parsed.status === "failed" ? parsed.status : "running",
                  });
                }
                break;
              }
              default:
                break;
            }

            let status:
              | { type: "running" }
              | { type: "complete"; reason: "stop" }
              | { type: "incomplete"; reason: "error" };
            if (!finished) status = { type: "running" };
            else if (errored) status = { type: "incomplete", reason: "error" };
            else status = { type: "complete", reason: "stop" };

            yield {
              content: [...buildToolParts(), { type: "text", text: accumulated }],
              status,
              metadata: { custom: { usage, route }, timing: buildTiming() },
            };
          }

          if (finished) break;
        }
      } catch (cause) {
        // A Stop click aborts `abortSignal`, which rejects the in-flight
        // reader.read() with an AbortError - catch it explicitly and yield
        // a real `incomplete/cancelled` status (rather than letting the
        // exception propagate) so the UI can render StoppedRun instead of
        // treating this the same as a network failure.
        const isAbort = abortSignal.aborted || (cause instanceof DOMException && cause.name === "AbortError");
        if (!isAbort) throw cause;
        yield {
          content: [...buildToolParts(), { type: "text", text: accumulated }],
          status: { type: "incomplete", reason: "cancelled" },
          metadata: { custom: { usage, route }, timing: buildTiming() },
        };
        config.onTurnSettled?.();
        return;
      }

      config.onTurnSettled?.();
    },
  };
}
