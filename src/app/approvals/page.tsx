"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useWorkspace } from "@/lib/workspace/WorkspaceProvider";

type Approval = { id: string; title: string; status: string; version: number; payload: { artifact_ids?: string[]; artifact_hashes?: Record<string, string> }; created_at: string };

export default function ApprovalCentrePage() {
  const { session } = useAuth();
  const { workspace } = useWorkspace();
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!session?.access_token || !workspace?.id) { setApprovals([]); return; }
    setLoading(true);
    try {
      const response = await fetch(`/api/workspaces/${encodeURIComponent(workspace.id)}/control/approvals`, { headers: { authorization: `Bearer ${session.access_token}` }, cache: "no-store" });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(String(body.error ?? "Approval records could not be loaded."));
      setApprovals(Array.isArray(body) ? body as Approval[] : []);
      setError(null);
    } catch (cause) {
      setApprovals([]);
      setError(cause instanceof Error ? cause.message : "Project Control is unavailable.");
    } finally { setLoading(false); }
  }, [session?.access_token, workspace?.id]);

  useEffect(() => { void refresh(); }, [refresh]);

  return <div className="mx-auto max-w-6xl space-y-6 pb-12">
    <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border-subtle pb-5"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-status-success/20 bg-status-success/10 text-status-success"><CheckCircle2 className="h-5 w-5" /></div><div><p className="font-mono text-[10px] uppercase tracking-[0.2em] text-status-success">VEYAAN / GOVERNANCE</p><h1 className="mt-1 text-2xl font-semibold text-white">Approval Centre</h1></div></div>{workspace && <Button variant="secondary" size="sm" onClick={() => void refresh()} disabled={loading}><RefreshCw className={loading ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} />Refresh</Button>}</header>
    <p className="max-w-2xl text-sm leading-6 text-text-muted">Approvals are durable Project Control records bound to exact artifact IDs and hashes. No agent or browser can mark an approval complete by changing UI state.</p>
    {!workspace ? <Card><EmptyState title="Connect a workspace" description="Sign in with Supabase and select an active workspace to inspect approvals." locked /></Card> : error ? <Card><EmptyState title="Approval data unavailable" description={error} /></Card> : loading ? <Card className="h-36 animate-pulse" /> : approvals.length === 0 ? <Card><EmptyState title="No approval requests" description="Artifact-bound approval requests will appear after a governed project workflow creates them." /></Card> : <div className="grid gap-4 md:grid-cols-2">{approvals.map((approval) => <Card key={approval.id}><CardHeader><div className="flex items-start justify-between gap-3"><CardTitle>{approval.title}</CardTitle><Badge tone={approval.status === "APPROVED" ? "success" : approval.status === "REJECTED" ? "danger" : "warning"}>{approval.status}</Badge></div></CardHeader><CardContent><div className="flex items-center justify-between text-xs text-text-muted"><span>v{approval.version}</span><span>{approval.payload.artifact_ids?.length ?? 0} artifacts bound</span></div></CardContent></Card>)}</div>}
  </div>;
}
