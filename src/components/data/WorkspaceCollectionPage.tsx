"use client";

import Link from "next/link";
import { ArrowRight, Briefcase, Building2, RefreshCw, Users } from "lucide-react";
import { useWorkspaceCollection, type WorkspaceRecord } from "@/lib/workspace/useWorkspaceCollection";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

type CollectionKind = "projects" | "agent-definitions" | "departments";

function value(record: WorkspaceRecord, key: string) {
  const candidate = record[key];
  return typeof candidate === "string" || typeof candidate === "number" ? String(candidate) : "";
}

export function WorkspaceCollectionPage({ kind, title, description }: { kind: CollectionKind; title: string; description: string }) {
  const { records, loading, error, connected } = useWorkspaceCollection(kind);
  const isProjects = kind === "projects";
  const isAgents = kind === "agent-definitions";
  const Icon = isProjects ? Briefcase : isAgents ? Users : Building2;
  const label = isProjects ? "projects" : isAgents ? "agent definitions" : "departments";
  return <div className="mx-auto max-w-6xl space-y-6 pb-12">
    <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5">
      <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-foreground/20 bg-foreground/10 text-foreground"><Icon className="h-5 w-5" /></div><div><p className="font-mono text-[10px] uppercase tracking-[0.2em] text-foreground">VEYAAN / WORKSPACE</p><h1 className="mt-1 text-2xl font-semibold text-white">{title}</h1></div></div>
      {connected && <div className="flex items-center gap-2">{isAgents && <Link href="/agents/factory"><Button size="sm">Create agent</Button></Link>}<Button variant="secondary" size="sm" onClick={() => window.location.reload()} disabled={loading}><RefreshCw className={loading ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} />Refresh</Button></div>}
    </header>
    <p className="max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
    {!connected ? <Card><EmptyState title="Connect a workspace" description="Sign in with Supabase and select an active workspace from the sidebar. This screen will then load real records." locked /></Card>
      : error ? <Card><EmptyState title="Workspace data could not load" description={error} /></Card>
      : loading ? <div className="grid gap-4 md:grid-cols-2"><Card className="h-32 animate-pulse" /><Card className="h-32 animate-pulse" /></div>
      : records.length === 0 ? <Card><EmptyState title={`No ${label} yet`} description={`This workspace returned no ${label}. Create or provision the first one through the connected service.`} action={isAgents ? "Create agent" : undefined} onAction={isAgents ? () => { window.location.href = "/agents/factory"; } : undefined} /></Card>
      : <div className="grid gap-4 md:grid-cols-2">{records.map((record) => {
        const id = value(record, "id");
        const name = isProjects ? value(record, "title") : value(record, "display_name") || value(record, "name");
        const secondary = isProjects ? value(record, "description") : isAgents ? value(record, "purpose") : `Template ${value(record, "template_id") || "unknown"}`;
        const state = value(record, isProjects ? "state" : "status") || "unknown";
        const detailPath = isProjects ? "projects" : isAgents ? "agents" : "departments";
        return <Card key={id || name}><CardHeader><div className="flex min-w-0 items-start justify-between gap-3"><div className="min-w-0"><CardTitle className="truncate">{name || "Untitled record"}</CardTitle><p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{secondary || "No description provided by the workspace."}</p></div><Badge tone={state === "active" || state === "running" ? "success" : "neutral"}>{state}</Badge></div></CardHeader><CardContent><div className="flex items-center justify-between gap-3 text-[11px] text-muted-foreground"><span className="truncate font-mono">{id || "No record id"}</span>{id && <Link href={`/${detailPath}/${id}`} className="inline-flex shrink-0 items-center gap-1 font-semibold text-foreground hover:text-white">Inspect <ArrowRight className="h-3 w-3" /></Link>}</div></CardContent></Card>;
      })}</div>}
  </div>;
}
