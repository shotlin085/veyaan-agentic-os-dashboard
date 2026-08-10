"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useWorkspace } from "@/lib/workspace/WorkspaceProvider";

export interface Connector {
  provider: string;
  name: string;
  configured: boolean;
  connected: boolean;
  account_label: string | null;
  connected_at: string | null;
}

interface UseConnectorsResult {
  connectors: Connector[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  startAuthorize: (provider: string) => Promise<{ ok: true; url: string } | { ok: false; error: string }>;
  disconnect: (provider: string) => Promise<{ ok: true } | { ok: false; error: string }>;
}

/** Real, workspace-scoped OAuth2 connectors (app/connectors/ on the
 * orchestrator) - GitHub/Vercel/Supabase/Canva accounts a workspace
 * owner connects from Settings, distinct from both the built-in Hermes
 * toolsets (useHermesToolsets) and the bring-your-own-LLM-key providers
 * (useProviders). Every provider reports `configured: false` until a
 * real OAuth app's client_id/secret is set on the server - `connected`
 * only ever reflects a real completed OAuth exchange, never assumed. */
export function useConnectors(): UseConnectorsResult {
  const { session } = useAuth();
  const { workspace } = useWorkspace();
  const token = session?.access_token;
  const workspaceId = workspace?.id;

  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!token || !workspaceId) {
      setConnectors([]);
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/connectors`, {
        headers: { authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const payload = await response.json().catch(() => []);
      if (!response.ok) throw new Error(String((payload as { detail?: string }).detail ?? "Could not load connectors."));
      setConnectors(Array.isArray(payload) ? (payload as Connector[]) : []);
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load connectors.");
    } finally {
      setLoading(false);
    }
  }, [token, workspaceId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const startAuthorize = useCallback(
    async (provider: string) => {
      if (!token || !workspaceId) return { ok: false as const, error: "Sign in and select a workspace first." };
      try {
        const response = await fetch(`/api/workspaces/${workspaceId}/connectors/${provider}/authorize`, {
          method: "POST",
          headers: { authorization: `Bearer ${token}` },
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          return { ok: false as const, error: String((payload as { detail?: string }).detail ?? "Could not start that connection.") };
        }
        return { ok: true as const, url: String((payload as { url: string }).url) };
      } catch {
        return { ok: false as const, error: "Connector service is unreachable." };
      }
    },
    [token, workspaceId],
  );

  const disconnect = useCallback(
    async (provider: string) => {
      if (!token || !workspaceId) return { ok: false as const, error: "Sign in and select a workspace first." };
      try {
        const response = await fetch(`/api/workspaces/${workspaceId}/connectors/${provider}`, {
          method: "DELETE",
          headers: { authorization: `Bearer ${token}` },
        });
        if (!response.ok && response.status !== 204) {
          const payload = await response.json().catch(() => ({}));
          return { ok: false as const, error: String((payload as { detail?: string }).detail ?? "Could not disconnect that account.") };
        }
        await refresh();
        return { ok: true as const };
      } catch {
        return { ok: false as const, error: "Connector service is unreachable." };
      }
    },
    [token, workspaceId, refresh],
  );

  return { connectors, loading, error, refresh, startAuthorize, disconnect };
}

const CONNECTOR_WORKSPACE_STORAGE_KEY = "veyaan:connector-authorize:workspaceId";

/** Stashes which workspace initiated an OAuth connect, read back by
 * src/app/connectors/[provider]/callback/page.tsx after the provider's
 * full-page redirect returns - sessionStorage survives that round trip
 * on the same origin/tab. */
export function rememberConnectorWorkspace(workspaceId: string): void {
  window.sessionStorage.setItem(CONNECTOR_WORKSPACE_STORAGE_KEY, workspaceId);
}

export function consumeRememberedConnectorWorkspace(): string | null {
  const value = window.sessionStorage.getItem(CONNECTOR_WORKSPACE_STORAGE_KEY);
  window.sessionStorage.removeItem(CONNECTOR_WORKSPACE_STORAGE_KEY);
  return value;
}
