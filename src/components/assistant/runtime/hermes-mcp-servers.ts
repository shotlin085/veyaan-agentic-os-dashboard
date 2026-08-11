"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useWorkspace } from "@/lib/workspace/WorkspaceProvider";

export interface McpServer {
  name: string;
  transport: string;
  url: string | null;
  command: string | null;
  args: string[];
  enabled: boolean;
  tool_count: number | null;
}

export interface McpAuthorizeResult {
  flow_id: string | null;
  status: string;
  authorization_url: string | null;
  error: string | null;
}

type Result<T = undefined> = T extends undefined
  ? { ok: true } | { ok: false; error: string }
  : { ok: true; value: T } | { ok: false; error: string };

/** Real MCP server management via Hermes's own dashboard API
 * (app/hermes_mcp/ on the orchestrator) - distinct from useConnectors()'s
 * per-workspace OAuth2 table. Honest caveat surfaced to callers: these
 * servers are shared across the whole Hermes instance, not isolated per
 * workspace, and a change here has no effect on real conversations until
 * restartGateway() runs. */
export function useHermesMcpServers() {
  const { session } = useAuth();
  const { workspace } = useWorkspace();
  const token = session?.access_token;
  const workspaceId = workspace?.id;

  const [servers, setServers] = useState<McpServer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!token || !workspaceId) {
      setServers([]);
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/hermes/mcp-servers`, {
        headers: { authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const payload = await response.json().catch(() => []);
      if (!response.ok) throw new Error(String((payload as { detail?: string }).detail ?? "Could not load MCP servers."));
      setServers(Array.isArray(payload) ? (payload as McpServer[]) : []);
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load MCP servers.");
    } finally {
      setLoading(false);
    }
  }, [token, workspaceId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const addServer = useCallback(
    async (input: { name: string; url?: string; command?: string; args?: string[]; bearer_token?: string }): Promise<Result> => {
      if (!token || !workspaceId) return { ok: false, error: "Sign in and select a workspace first." };
      try {
        const response = await fetch(`/api/workspaces/${workspaceId}/hermes/mcp-servers`, {
          method: "POST",
          headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
          body: JSON.stringify(input),
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          return { ok: false, error: String((payload as { detail?: string }).detail ?? "Could not add that server.") };
        }
        await refresh();
        return { ok: true };
      } catch {
        return { ok: false, error: "MCP server service is unreachable." };
      }
    },
    [token, workspaceId, refresh],
  );

  const removeServer = useCallback(
    async (name: string): Promise<Result> => {
      if (!token || !workspaceId) return { ok: false, error: "Sign in and select a workspace first." };
      try {
        const response = await fetch(`/api/workspaces/${workspaceId}/hermes/mcp-servers/${name}`, {
          method: "DELETE",
          headers: { authorization: `Bearer ${token}` },
        });
        if (!response.ok && response.status !== 204) {
          const payload = await response.json().catch(() => ({}));
          return { ok: false, error: String((payload as { detail?: string }).detail ?? "Could not remove that server.") };
        }
        await refresh();
        return { ok: true };
      } catch {
        return { ok: false, error: "MCP server service is unreachable." };
      }
    },
    [token, workspaceId, refresh],
  );

  const setEnabled = useCallback(
    async (name: string, enabled: boolean): Promise<Result> => {
      if (!token || !workspaceId) return { ok: false, error: "Sign in and select a workspace first." };
      try {
        const response = await fetch(`/api/workspaces/${workspaceId}/hermes/mcp-servers/${name}/enabled`, {
          method: "PUT",
          headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
          body: JSON.stringify({ enabled }),
        });
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          return { ok: false, error: String((payload as { detail?: string }).detail ?? "Could not update that server.") };
        }
        await refresh();
        return { ok: true };
      } catch {
        return { ok: false, error: "MCP server service is unreachable." };
      }
    },
    [token, workspaceId, refresh],
  );

  const testServer = useCallback(
    async (name: string): Promise<Result<{ ok: boolean; tools: string[]; error: string | null }>> => {
      if (!token || !workspaceId) return { ok: false, error: "Sign in and select a workspace first." };
      try {
        const response = await fetch(`/api/workspaces/${workspaceId}/hermes/mcp-servers/${name}/test`, {
          method: "POST",
          headers: { authorization: `Bearer ${token}` },
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          return { ok: false, error: String((payload as { detail?: string }).detail ?? "Could not test that server.") };
        }
        return { ok: true, value: payload as { ok: boolean; tools: string[]; error: string | null } };
      } catch {
        return { ok: false, error: "MCP server service is unreachable." };
      }
    },
    [token, workspaceId],
  );

  const startAuthorize = useCallback(
    async (name: string): Promise<Result<McpAuthorizeResult>> => {
      if (!token || !workspaceId) return { ok: false, error: "Sign in and select a workspace first." };
      try {
        const response = await fetch(`/api/workspaces/${workspaceId}/hermes/mcp-servers/${name}/authorize`, {
          method: "POST",
          headers: { authorization: `Bearer ${token}` },
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          return { ok: false, error: String((payload as { detail?: string }).detail ?? "Could not start authorization.") };
        }
        return { ok: true, value: payload as McpAuthorizeResult };
      } catch {
        return { ok: false, error: "MCP server service is unreachable." };
      }
    },
    [token, workspaceId],
  );

  const restartGateway = useCallback(async (): Promise<Result> => {
    if (!token || !workspaceId) return { ok: false, error: "Sign in and select a workspace first." };
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/hermes/mcp-servers/restart-gateway`, {
        method: "POST",
        headers: { authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        return { ok: false, error: String((payload as { detail?: string }).detail ?? "Could not restart the gateway.") };
      }
      return { ok: true };
    } catch {
      return { ok: false, error: "MCP server service is unreachable." };
    }
  }, [token, workspaceId]);

  return { servers, loading, error, refresh, addServer, removeServer, setEnabled, testServer, startAuthorize, restartGateway };
}

const MCP_WORKSPACE_STORAGE_KEY = "veyaan:mcp-authorize:workspaceId";

/** Same sessionStorage round-trip technique as
 * hermes-connectors.ts's rememberConnectorWorkspace - the callback page
 * needs to know which workspace initiated the connect after the
 * provider's full-page redirect returns. */
export function rememberMcpWorkspace(workspaceId: string): void {
  window.sessionStorage.setItem(MCP_WORKSPACE_STORAGE_KEY, workspaceId);
}

export function consumeRememberedMcpWorkspace(): string | null {
  const value = window.sessionStorage.getItem(MCP_WORKSPACE_STORAGE_KEY);
  window.sessionStorage.removeItem(MCP_WORKSPACE_STORAGE_KEY);
  return value;
}

const MCP_FLOW_STORAGE_KEY = "veyaan:mcp-authorize:flowId";

/** Delivering the OAuth callback to Hermes only hands off the code - the
 * actual token exchange happens afterward in a background worker on
 * Hermes's own dashboard service. The callback page has to poll
 * GET .../oauth/flows/{flowId} for the real outcome ("approved" vs
 * "error"), not just trust that the handoff itself succeeded - a
 * flow_id is the only way to find that flow again after the redirect. */
export function rememberMcpFlow(flowId: string): void {
  window.sessionStorage.setItem(MCP_FLOW_STORAGE_KEY, flowId);
}

export function consumeRememberedMcpFlow(): string | null {
  const value = window.sessionStorage.getItem(MCP_FLOW_STORAGE_KEY);
  window.sessionStorage.removeItem(MCP_FLOW_STORAGE_KEY);
  return value;
}
