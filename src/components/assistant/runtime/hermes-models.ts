"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useWorkspace } from "@/lib/workspace/WorkspaceProvider";

export interface HermesModel {
  id: string;
  name: string;
  provider: string;
  free: boolean;
  inputPrice: string | null;
  outputPrice: string | null;
}

interface RawModelOptions {
  providers?: {
    models?: string[];
    pricing?: Record<string, { input?: string; output?: string; free?: boolean }>;
  }[];
}

// "openai/gpt-5.6-luna" -> "GPT-5.6 Luna", "x-ai/grok-4.5" -> "Grok 4.5",
// "deepseek/deepseek-v4-flash" -> "DeepSeek V4 Flash". Version-ish tokens
// (numbers, "v4", ":free") are left alone rather than title-cased into
// something wrong; everything else gets capitalized.
const KNOWN_WORDS: Record<string, string> = {
  gpt: "GPT",
  deepseek: "DeepSeek",
  ai: "AI",
  glm: "GLM",
  hy3: "HY3",
  mimo: "MiMo",
};

function humanize(rawId: string): string {
  const withoutFree = rawId.replace(/:free$/, "");
  const afterSlash = withoutFree.split("/").slice(1).join("/") || withoutFree;
  return afterSlash
    .split("-")
    .map((word) => {
      if (/^v?\d/.test(word)) return word.replace(/^v/, "V");
      const known = KNOWN_WORDS[word.toLowerCase()];
      if (known) return known;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

function humanizeProvider(slug: string): string {
  const known: Record<string, string> = {
    openai: "OpenAI",
    anthropic: "Anthropic",
    google: "Google",
    "x-ai": "xAI",
    deepseek: "DeepSeek",
    qwen: "Qwen",
    moonshotai: "Moonshot AI",
    minimax: "MiniMax",
    "z-ai": "Z.AI",
    xiaomi: "Xiaomi",
    tencent: "Tencent",
    stepfun: "StepFun",
    nvidia: "NVIDIA",
    sakana: "Sakana AI",
    poolside: "Poolside",
  };
  return known[slug] ?? slug.charAt(0).toUpperCase() + slug.slice(1);
}

function parseModels(raw: RawModelOptions): HermesModel[] {
  const provider = raw.providers?.[0];
  if (!provider?.models) return [];
  return provider.models.map((id) => {
    const pricing = provider.pricing?.[id];
    const providerSlug = id.split("/")[0] ?? "";
    return {
      id,
      name: humanize(id),
      provider: humanizeProvider(providerSlug),
      free: pricing?.free === true || id.endsWith(":free"),
      inputPrice: pricing?.input ?? null,
      outputPrice: pricing?.output ?? null,
    };
  });
}

interface UseHermesModelsResult {
  models: HermesModel[];
  loading: boolean;
  error: string | null;
}

/** The real, live Hermes model catalog (34 models at last count) backing
 * the composer's model picker - see BE-4's /hermes/model-options
 * passthrough. Fetched once per workspace, not per conversation. */
export function useHermesModels(): UseHermesModelsResult {
  const { session } = useAuth();
  const { workspace } = useWorkspace();
  const token = session?.access_token;
  const workspaceId = workspace?.id;

  const [models, setModels] = useState<HermesModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !workspaceId) {
      setModels([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch(`/api/workspaces/${workspaceId}/hermes/model-options`, {
      headers: { authorization: `Bearer ${token}` },
      cache: "no-store",
    })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(String((payload as { detail?: string }).detail ?? "Model catalog failed."));
        if (!cancelled) {
          setModels(parseModels(payload as RawModelOptions));
          setError(null);
        }
      })
      .catch((cause: unknown) => {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "Model catalog failed.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token, workspaceId]);

  return { models, loading, error };
}
