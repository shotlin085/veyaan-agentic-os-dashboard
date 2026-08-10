"use client";

import { useCallback, useEffect, useState } from "react";
import { LockKeyhole, RefreshCwIcon, TerminalIcon } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useWorkspace } from "@/lib/workspace/WorkspaceProvider";
import { Timeline, type TimelineEvent } from "@/components/elements/timeline";
import { ghostButton, mono } from "@/components/elements/surfaces";
import { cn } from "@/lib/utils";

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

  const timelineEvents: TimelineEvent[] = events.map((event) => ({
    id: event.event_id,
    when: "past",
    time: new Date(event.occurred_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    title: event.event_type,
    detail: event.correlation_id
      ? `correlation ${event.correlation_id}`
      : event.project_id
        ? `project ${event.project_id}`
        : undefined,
  }));

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 p-6 pb-16">
      <header className="flex items-center justify-between gap-4 border-b border-border pb-5">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-foreground/[0.06] text-foreground/70">
            <TerminalIcon className="size-4" />
          </div>
          <div>
            <p className={cn(mono, "text-foreground/35")}>VEYAAN / OBSERVABILITY</p>
            <h1 className="text-xl font-semibold text-foreground">Logs</h1>
          </div>
        </div>
        {workspace && (
          <button type="button" onClick={() => void refresh()} disabled={loading} className={cn(ghostButton, "size-8 disabled:opacity-40")} aria-label="Refresh">
            <RefreshCwIcon className={cn("size-3.5", loading && "animate-spin")} />
          </button>
        )}
      </header>

      <p className="max-w-2xl text-sm leading-6 text-foreground/55">
        Real audit events, correlation traces, and service telemetry for the selected workspace.
      </p>

      {!workspace ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border py-16 text-center">
          <LockKeyhole className="size-6 text-foreground/30" />
          <p className="text-sm text-foreground/55">
            Sign in and select an active workspace from the sidebar to inspect telemetry events.
          </p>
        </div>
      ) : error ? (
        <p className="text-[13px] leading-snug text-destructive/80">{error}</p>
      ) : loading && events.length === 0 ? (
        <p className={cn(mono, "text-foreground/35")}>Loading telemetry...</p>
      ) : events.length === 0 ? (
        <p className={cn(mono, "text-foreground/35")}>No telemetry events recorded for this workspace yet.</p>
      ) : (
        <Timeline events={timelineEvents} visibleCount={timelineEvents.length} className="w-full max-w-none" />
      )}
    </div>
  );
}
