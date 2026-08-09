"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useWorkspace } from "@/lib/workspace/WorkspaceProvider";

export type WorkspaceRecord = Record<string, unknown>;

export function useWorkspaceCollection(path: "projects" | "agent-definitions" | "departments") {
  const { session } = useAuth();
  const { workspace } = useWorkspace();
  const [records, setRecords] = useState<WorkspaceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!session?.access_token || !workspace?.id) {
      setRecords([]);
      setError(null);
      setLoading(false);
      return () => { active = false; };
    }
    setLoading(true);
    void fetch(`/api/workspaces/${encodeURIComponent(workspace.id)}/${path}`, {
      headers: { authorization: `Bearer ${session.access_token}` },
      cache: "no-store",
    }).then(async (response) => {
      const payload = await response.json().catch(() => null);
      if (!active) return;
      if (!response.ok) throw new Error(String(payload?.detail ?? payload?.error ?? `${path} could not be loaded.`));
      const next = Array.isArray(payload) ? payload : Array.isArray(payload?.items) ? payload.items : [];
      setRecords(next as WorkspaceRecord[]);
      setError(null);
    }).catch((cause) => {
      if (!active) return;
      setRecords([]);
      setError(cause instanceof Error ? cause.message : `${path} could not be loaded.`);
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [path, session?.access_token, workspace?.id]);

  return { records, loading, error, connected: Boolean(session?.access_token && workspace?.id), workspace };
}
