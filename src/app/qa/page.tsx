"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useWorkspace } from "@/lib/workspace/WorkspaceProvider";

type QaRun = {
  id: string;
  project_id: string;
  target_ref: string;
  checks: string[];
  verdict: "PENDING" | "PASSED" | "FAILED" | "BLOCKED";
  evidence_refs: Array<{ uri?: string; sha256?: string }>;
  created_at: string;
  completed_at: string | null;
};

export default function QACentrePage() {
  const { session } = useAuth();
  const { workspace } = useWorkspace();
  const [runs, setRuns] = useState<QaRun[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!session?.access_token || !workspace?.id) {
      setRuns([]);
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`/api/workspaces/${encodeURIComponent(workspace.id)}/qa/runs`, {
        headers: { authorization: `Bearer ${session.access_token}` },
        cache: "no-store",
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(String(body.error ?? "QA records could not be loaded."));
      setRuns(Array.isArray(body.items) ? body.items as QaRun[] : []);
      setError(null);
    } catch (cause) {
      setRuns([]);
      setError(cause instanceof Error ? cause.message : "QA Engine is unavailable.");
    } finally {
      setLoading(false);
    }
  }, [session?.access_token, workspace?.id]);

  useEffect(() => { void refresh(); }, [refresh]);

  return <div className="mx-auto max-w-6xl space-y-6 pb-12">
    <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5">
      <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-status-success/20 bg-status-success/10 text-status-success"><ShieldCheck className="h-5 w-5" /></div><div><p className="font-mono text-[10px] uppercase tracking-[0.2em] text-status-success">VEYAAN / QUALITY</p><h1 className="mt-1 text-2xl font-semibold text-white">QA Centre</h1></div></div>
      {workspace && <Button variant="secondary" size="sm" onClick={() => void refresh()} disabled={loading}><RefreshCw className={loading ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} />Refresh</Button>}
    </header>
    <p className="max-w-2xl text-sm leading-6 text-muted-foreground">Independent test runs and immutable evidence for the selected workspace. Release confidence is derived only from recorded QA results.</p>
    {!workspace ? <Card><EmptyState title="Connect a workspace" description="Sign in with Supabase and select an active workspace to inspect QA evidence." locked /></Card>
      : error ? <Card><EmptyState title="QA data is unavailable" description={error} /></Card>
      : loading ? <Card className="h-36 animate-pulse" />
      : runs.length === 0 ? <Card><EmptyState title="No QA runs recorded" description="A real Runner/QA workflow will appear here after an approved project task creates a run." /></Card>
      : <div className="grid gap-4 md:grid-cols-2">{runs.map((run) => <Card key={run.id}><CardHeader><div className="flex items-start justify-between gap-3"><div><CardTitle>{run.target_ref}</CardTitle><p className="mt-1 text-xs text-muted-foreground">Project {run.project_id}</p></div><Badge tone={run.verdict === "PASSED" ? "success" : run.verdict === "FAILED" ? "danger" : "warning"}>{run.verdict}</Badge></div></CardHeader><CardContent><div className="flex items-center justify-between text-xs text-muted-foreground"><span>{run.checks.length} checks</span><span>{run.evidence_refs.length} evidence references</span></div></CardContent></Card>)}</div>}
  </div>;
}
