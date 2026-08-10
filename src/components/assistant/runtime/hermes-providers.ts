"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useWorkspace } from "@/lib/workspace/WorkspaceProvider";

export interface CustomProvider {
  id: string;
  name: string;
  base_url: string;
  models: string[];
  is_default: boolean;
  created_at: string;
}

interface UseProvidersResult {
  providers: CustomProvider[];
  loading: boolean;
  error: string | null;
  addProvider: (input: { name: string; base_url: string; api_key: string }) => Promise<{ ok: true } | { ok: false; error: string }>;
  removeProvider: (id: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  refresh: () => Promise<void>;
}

/** Real, workspace-scoped bring-your-own-key providers (app/providers/ on
 * the orchestrator) - a workspace owner's own API keys, separate from the
 * built-in Hermes/Nous Portal integration. Add/remove happen from here,
 * not by SSHing into the server and editing .env. */
export function useProviders(): UseProvidersResult {
  const { session } = useAuth();
  const { workspace } = useWorkspace();
  const token = session?.access_token;
  const workspaceId = workspace?.id;

  const [providers, setProviders] = useState<CustomProvider[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!token || !workspaceId) {
      setProviders([]);
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/providers`, {
        headers: { authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const payload = await response.json().catch(() => []);
      if (!response.ok) throw new Error(String((payload as { detail?: string }).detail ?? "Could not load providers."));
      setProviders(Array.isArray(payload) ? (payload as CustomProvider[]) : []);
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load providers.");
    } finally {
      setLoading(false);
    }
  }, [token, workspaceId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const addProvider = useCallback(
    async (input: { name: string; base_url: string; api_key: string }) => {
      if (!token || !workspaceId) return { ok: false as const, error: "Sign in and select a workspace first." };
      try {
        const response = await fetch(`/api/workspaces/${workspaceId}/providers`, {
          method: "POST",
          headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
          body: JSON.stringify(input),
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          return { ok: false as const, error: String((payload as { detail?: string }).detail ?? "Could not add that provider.") };
        }
        await refresh();
        return { ok: true as const };
      } catch {
        return { ok: false as const, error: "Provider service is unreachable." };
      }
    },
    [token, workspaceId, refresh],
  );

  const removeProvider = useCallback(
    async (id: string) => {
      if (!token || !workspaceId) return { ok: false as const, error: "Sign in and select a workspace first." };
      try {
        const response = await fetch(`/api/workspaces/${workspaceId}/providers/${id}`, {
          method: "DELETE",
          headers: { authorization: `Bearer ${token}` },
        });
        if (!response.ok && response.status !== 204) {
          const payload = await response.json().catch(() => ({}));
          return { ok: false as const, error: String((payload as { detail?: string }).detail ?? "Could not remove that provider.") };
        }
        await refresh();
        return { ok: true as const };
      } catch {
        return { ok: false as const, error: "Provider service is unreachable." };
      }
    },
    [token, workspaceId, refresh],
  );

  return { providers, loading, error, addProvider, removeProvider, refresh };
}

export interface DefaultModelSetting {
  provider_id: string | null;
  model: string | null;
}

interface UseDefaultModelResult {
  setting: DefaultModelSetting;
  loading: boolean;
  error: string | null;
  save: (value: DefaultModelSetting) => Promise<{ ok: true } | { ok: false; error: string }>;
}

/** The workspace's real "what does Auto actually run" restriction - see
 * hermes-cost.ts and streaming_routes.py's effective_model logic. Empty
 * ({provider_id: null, model: null}) means today's fast/escalate
 * heuristic is unrestricted. */
export function useDefaultModel(): UseDefaultModelResult {
  const { session } = useAuth();
  const { workspace } = useWorkspace();
  const token = session?.access_token;
  const workspaceId = workspace?.id;

  const [setting, setSetting] = useState<DefaultModelSetting>({ provider_id: null, model: null });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !workspaceId) return;
    let cancelled = false;
    setLoading(true);
    fetch(`/api/workspaces/${workspaceId}/settings/default-model`, {
      headers: { authorization: `Bearer ${token}` },
      cache: "no-store",
    })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(String((payload as { detail?: string }).detail ?? "Could not load setting."));
        if (!cancelled) setSetting(payload as DefaultModelSetting);
      })
      .catch((cause: unknown) => {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "Could not load setting.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token, workspaceId]);

  const save = useCallback(
    async (value: DefaultModelSetting) => {
      if (!token || !workspaceId) return { ok: false as const, error: "Sign in and select a workspace first." };
      try {
        const response = await fetch(`/api/workspaces/${workspaceId}/settings/default-model`, {
          method: "PUT",
          headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
          body: JSON.stringify(value),
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          return { ok: false as const, error: String((payload as { detail?: string }).detail ?? "Could not save that setting.") };
        }
        setSetting(payload as DefaultModelSetting);
        return { ok: true as const };
      } catch {
        return { ok: false as const, error: "Settings service is unreachable." };
      }
    },
    [token, workspaceId],
  );

  return { setting, loading, error, save };
}
