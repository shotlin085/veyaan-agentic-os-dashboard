"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useWorkspace } from "@/lib/workspace/WorkspaceProvider";

export interface ReasoningModel {
  id: string;
  name: string;
  provider: string;
  contextLength: number | null;
  inputPrice: string | null;
  outputPrice: string | null;
}

interface RawReasoningModel {
  id: string;
  name: string;
  provider: string;
  context_length: number | null;
  input_price: string | null;
  output_price: string | null;
}

interface UseReasoningModelsResult {
  models: ReasoningModel[];
  loading: boolean;
  error: string | null;
}

/** Real OpenRouter models that genuinely support the `reasoning` request
 * parameter (see app/integrations/openrouter/client.py's
 * list_reasoning_models) - backs the composer's direct-model picker and
 * gates when the ReasoningEffort control shows at all. Unlike
 * useHermesModels, these names/providers come straight from OpenRouter's
 * own catalog and need no humanizing. */
export function useReasoningModels(): UseReasoningModelsResult {
  const { session } = useAuth();
  const { workspace } = useWorkspace();
  const token = session?.access_token;
  const workspaceId = workspace?.id;

  const [models, setModels] = useState<ReasoningModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !workspaceId) {
      setModels([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch(`/api/workspaces/${workspaceId}/openrouter/reasoning-models`, {
      headers: { authorization: `Bearer ${token}` },
      cache: "no-store",
    })
      .then(async (response) => {
        const payload = await response.json().catch(() => []);
        if (!response.ok) throw new Error(String((payload as { detail?: string }).detail ?? "Reasoning model catalog failed."));
        const raw = Array.isArray(payload) ? (payload as RawReasoningModel[]) : [];
        if (!cancelled) {
          setModels(
            raw.map((m) => ({
              id: m.id,
              name: m.name,
              provider: m.provider,
              contextLength: m.context_length,
              inputPrice: m.input_price,
              outputPrice: m.output_price,
            })),
          );
          setError(null);
        }
      })
      .catch((cause: unknown) => {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "Reasoning model catalog failed.");
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
