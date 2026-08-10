"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw, Terminal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useWorkspace } from "@/lib/workspace/WorkspaceProvider";

type TelemetryEvent = {
  event_id: string;
  event_type: string;
  workspace_id: string | null;
  project_id: string | null;
  correlation_id: string | null;
  payload: Record<string, unknown>;
  occurred_at: string;
};

export default function LogsObservabilityPage() {
  const { session } = useAuth();
  const { workspace } = useWorkspace();
  const [events, setEvents] = useState<TelemetryEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!session?.access_token || !workspace?.id) {
      setEvents([]);
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`/api/workspaces/${encodeURIComponent(workspace.id)}/logs`, {
        headers: { authorization: `Bearer ${session.access_token}` },
        cache: "no-store",
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(String(body.error ?? "Telemetry events could not be loaded."));
      setEvents(Array.isArray(body.items) ? (body.items as TelemetryEvent[]) : []);
      setError(null);
    } catch (cause) {
      setEvents([]);
      setError(cause instanceof Error ? cause.message : "Observability is unavailable.");
    } finally {
      setLoading(false);
    }
  }, [session?.access_token, workspace?.id]);

  useEffect(() => { void refresh(); }, [refresh]);

  return <div className="mx-auto max-w-6xl space-y-6 pb-12">
    <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border-subtle pb-5">
      <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-status-success/20 bg-status-success/10 text-status-success"><Terminal className="h-5 w-5" /></div><div><p className="font-mono text-[10px] uppercase tracking-[0.2em] text-status-success">VEYAAN / OBSERVABILITY</p><h1 className="mt-1 text-2xl font-semibold text-white">Logs &amp; Observability</h1></div></div>
      {workspace && <Button variant="secondary" size="sm" onClick={() => void refresh()} disabled={loading}><RefreshCw className={loading ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} />Refresh</Button>}
    </header>
    <p className="max-w-2xl text-sm leading-6 text-text-muted">Real audit events, correlation traces, and service telemetry for the selected workspace.</p>
    {!workspace ? <Card><EmptyState title="Connect a workspace" description="Sign in with Supabase and select an active workspace to inspect telemetry events." locked /></Card>
      : error ? <Card><EmptyState title="Telemetry data is unavailable" description={error} /></Card>
      : loading ? <Card className="h-36 animate-pulse" />
      : events.length === 0 ? <Card><EmptyState title="No telemetry events recorded" description="Real service activity will appear here once events are emitted for this workspace." /></Card>
      : <div className="grid gap-4 md:grid-cols-2">{events.map((event) => <Card key={event.event_id}><CardHeader><div className="flex items-start justify-between gap-3"><div><CardTitle>{event.event_type}</CardTitle><p className="mt-1 text-xs text-text-muted">{new Date(event.occurred_at).toLocaleString()}</p></div>{event.correlation_id && <Badge tone="warning">{event.correlation_id}</Badge>}</div></CardHeader><CardContent><div className="text-xs text-text-muted">{event.project_id ? `Project ${event.project_id}` : "No project"}</div></CardContent></Card>)}</div>}
  </div>;
}
