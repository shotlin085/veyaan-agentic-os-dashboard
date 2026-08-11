"use client";

import { useEffect, useRef, useState } from "react";

export interface ImageGenConfig {
  workspaceId: string;
  conversationId: string;
  token: string;
}

export type ImageEngine = "flow" | "chatgpt";

export interface ImageJobState {
  status: "running" | "completed" | "failed";
  imageUrls: string[];
  error: string | null;
}

/**
 * Turns a brief idea into a detailed, professional image-generation
 * prompt for the user to review before spending any real generation
 * credits - GET/POST .../images/enhance-prompt (app/conversations/
 * streaming_routes.py). Nothing is persisted by this call.
 */
export async function enhanceImagePrompt(
  config: ImageGenConfig,
  idea: string,
): Promise<{ enhancedPrompt: string } | { error: string }> {
  const response = await fetch("/api/assistant/images/enhance-prompt", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${config.token}` },
    body: JSON.stringify({ workspaceId: config.workspaceId, conversationId: config.conversationId, idea }),
  }).catch(() => null);

  if (!response) return { error: "VEYAAN is not reachable." };
  const data = (await response.json().catch(() => null)) as { enhanced_prompt?: string; error?: string } | null;
  if (!response.ok || !data?.enhanced_prompt) return { error: data?.error ?? "Could not enhance that prompt." };
  return { enhancedPrompt: data.enhanced_prompt };
}

/**
 * Starts a real, deterministic image generation - calls the browsermcp
 * MCP tool directly server-side (no reliance on an LLM deciding to use
 * it). Returns a job_id to poll with useImageJobPolling below; the image
 * itself isn't ready yet.
 */
export async function generateImage(
  config: ImageGenConfig,
  prompt: string,
  engine: ImageEngine,
): Promise<{ jobId: string } | { error: string }> {
  const response = await fetch("/api/assistant/images/generate", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${config.token}` },
    body: JSON.stringify({ workspaceId: config.workspaceId, conversationId: config.conversationId, prompt, engine }),
  }).catch(() => null);

  if (!response) return { error: "VEYAAN is not reachable." };
  const data = (await response.json().catch(() => null)) as { job_id?: string; error?: string } | null;
  if (!response.ok || !data?.job_id) return { error: data?.error ?? "Could not start image generation." };
  return { jobId: data.job_id };
}

/**
 * Polls .../images/jobs/{jobId} every ~3s while a generation is running.
 * Once the backend reports "completed" it has already persisted the
 * assistant turn itself - the caller's own conversation refresh is what
 * actually shows the image, this hook just drives the "generating..."
 * state and stops polling.
 */
export function useImageJobPolling(config: ImageGenConfig, jobId: string | null): ImageJobState | null {
  const [state, setState] = useState<ImageJobState | null>(null);
  const configRef = useRef(config);
  configRef.current = config;

  useEffect(() => {
    if (!jobId || !config.workspaceId || !config.conversationId || !config.token) {
      setState(null);
      return;
    }

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const poll = async () => {
      const { workspaceId, conversationId, token } = configRef.current;
      const params = new URLSearchParams({ workspaceId, conversationId });
      const response = await fetch(`/api/assistant/images/jobs/${encodeURIComponent(jobId)}?${params.toString()}`, {
        headers: { authorization: `Bearer ${token}` },
      }).catch(() => null);
      if (cancelled) return;

      if (!response) {
        setState({ status: "failed", imageUrls: [], error: "VEYAAN is not reachable." });
        return;
      }
      const data = (await response.json().catch(() => null)) as
        | { status?: string; image_urls?: string[]; error?: string }
        | null;
      if (!response.ok || !data) {
        setState({ status: "failed", imageUrls: [], error: "Could not check generation status." });
        return;
      }

      setState({
        status: data.status === "completed" || data.status === "failed" ? data.status : "running",
        imageUrls: data.image_urls ?? [],
        error: data.error ?? null,
      });
      if (data.status === "running") timer = setTimeout(poll, 3_000);
    };

    setState({ status: "running", imageUrls: [], error: null });
    void poll();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [config.workspaceId, config.conversationId, config.token, jobId]);

  return state;
}
