"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useWorkspace } from "@/lib/workspace/WorkspaceProvider";

export interface HermesToolset {
  name: string;
  label: string;
  description: string;
  enabled: boolean;
  configured: boolean;
  tools: string[];
}

interface UseHermesToolsetsResult {
  toolsets: HermesToolset[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

/**
 * Real Hermes toolsets/MCP tools (GET .../hermes/toolsets, BE-4's
 * passthrough to hermes-agent's own /v1/toolsets - confirmed live: 28
 * real toolsets with real enabled/configured flags, not a fixture).
 * Shared between the Settings page's full McpServerPanel view and the
 * composer's PluginsButton quick-access popover, so both read the same
 * real data instead of each doing its own fetch.
 */
export function useHermesToolsets(): UseHermesToolsetsResult {
  const { session } = useAuth();
  const { workspace } = useWorkspace();
  const token = session?.access_token;
  const workspaceId = workspace?.id;

  const [toolsets, setToolsets] = useState<HermesToolset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!token || !workspaceId) {
      setToolsets([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/workspaces/${workspaceId}/hermes/toolsets`, {
      headers: { authorization: `Bearer ${token}` },
      cache: "no-store",
    })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(String((payload as { detail?: string; error?: string }).detail ?? (payload as { error?: string }).error ?? "Toolsets request failed."));
        return payload as { data?: HermesToolset[] };
      })
      .then((payload) => {
        if (!cancelled) setToolsets(payload.data ?? []);
      })
      .catch((cause: unknown) => {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "Toolsets request failed.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token, workspaceId, nonce]);

  return { toolsets, loading, error, refresh: () => setNonce((n) => n + 1) };
}
