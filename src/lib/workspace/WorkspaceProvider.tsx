"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth/AuthProvider";

export type Workspace = { id: string; name: string; slug: string; is_active: boolean; role: string | null };

type WorkspaceContextValue = {
  loading: boolean;
  workspaces: Workspace[];
  workspace: Workspace | null;
  error: string | null;
  refresh: () => Promise<void>;
  selectWorkspace: (workspaceId: string) => void;
};

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);
const STORAGE_KEY = "veyaan.selectedWorkspaceId";

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { session, loading: authLoading } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSelectedId(window.localStorage.getItem(STORAGE_KEY));
  }, []);

  const refresh = useCallback(async () => {
    if (!session?.access_token) {
      setWorkspaces([]);
      setError(null);
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/workspaces", {
        headers: { authorization: `Bearer ${session.access_token}` },
        cache: "no-store",
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(String(payload.detail ?? payload.error ?? "Workspace list failed."));
      const next = Array.isArray(payload) ? payload as Workspace[] : [];
      setWorkspaces(next);
      setError(null);
      setSelectedId((current) => {
        const usable = current && next.some((workspace) => workspace.id === current) ? current : next[0]?.id ?? null;
        if (usable) window.localStorage.setItem(STORAGE_KEY, usable);
        else window.localStorage.removeItem(STORAGE_KEY);
        return usable;
      });
    } catch (cause) {
      setWorkspaces([]);
      setError(cause instanceof Error ? cause.message : "Workspace list failed.");
    } finally {
      setLoading(false);
    }
  }, [session?.access_token]);

  useEffect(() => {
    if (!authLoading) void refresh();
  }, [authLoading, refresh]);

  const selectWorkspace = useCallback((workspaceId: string) => {
    setSelectedId(workspaceId);
    window.localStorage.setItem(STORAGE_KEY, workspaceId);
  }, []);

  const value = useMemo(() => ({
    loading: authLoading || loading,
    workspaces,
    workspace: workspaces.find((item) => item.id === selectedId) ?? null,
    error,
    refresh,
    selectWorkspace,
  }), [authLoading, error, loading, refresh, selectWorkspace, selectedId, workspaces]);

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const value = useContext(WorkspaceContext);
  if (!value) throw new Error("useWorkspace must be used inside WorkspaceProvider");
  return value;
}
