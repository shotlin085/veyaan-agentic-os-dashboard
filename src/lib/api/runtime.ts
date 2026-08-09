"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useWorkspace } from "@/lib/workspace/WorkspaceProvider";
import type { Workspace } from "@/lib/workspace/WorkspaceProvider";

export type ServiceState = "checking" | "online" | "degraded" | "offline";

export interface ServiceStatus {
  name: string;
  state: ServiceState;
  detail: string;
  checkedAt?: string;
}

export interface RuntimeStatus {
  services: ServiceStatus[];
  capabilities?: Record<string, unknown> | null;
  authenticated: boolean;
  workspace: Workspace | Record<string, unknown> | null;
  checkedAt?: string;
  capabilityStates?: Record<string, "ready" | "planned" | "unavailable">;
}

export async function readRuntimeStatus(token?: string, workspaceId?: string): Promise<RuntimeStatus> {
  const headers = new Headers();
  if (token) headers.set("authorization", `Bearer ${token}`);
  if (workspaceId) headers.set("x-veyaan-workspace-id", workspaceId);
  const response = await fetch("/api/runtime", { cache: "no-store", headers });
  if (!response.ok) throw new Error("Runtime status endpoint unavailable");
  return (await response.json()) as RuntimeStatus;
}

export function useRuntimeStatus(intervalMs = 15000) {
  const { session } = useAuth();
  const { workspace } = useWorkspace();
  const [status, setStatus] = useState<RuntimeStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try { setStatus(await readRuntimeStatus(session?.access_token, workspace?.id)); } catch { setStatus(null); }
    setLoading(false);
  }, [session?.access_token, workspace?.id]);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), intervalMs);
    return () => window.clearInterval(timer);
  }, [intervalMs, refresh]);

  return { status, loading, refresh };
}
