"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Database, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useWorkspace } from "@/lib/workspace/WorkspaceProvider";

type Memory = { id: string; content: string; source_type: string; source_uri: string | null; scope_type: string; content_hash: string; score: number };

export default function MemoryConsolePage() {
  const { session } = useAuth();
  const { workspace } = useWorkspace();
  const [query, setQuery] = useState("");
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (term = query) => {
    if (!session?.access_token || !workspace?.id || !term.trim()) {
      setMemories([]);
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`/api/workspaces/${encodeURIComponent(workspace.id)}/memory/search?q=${encodeURIComponent(term.trim())}`, {
        headers: { authorization: `Bearer ${session.access_token}` },
        cache: "no-store",
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(String(body.error ?? "Memory search failed."));
      setMemories(Array.isArray(body.items) ? body.items as Memory[] : []);
      setError(null);
    } catch (cause) {
      setMemories([]);
      setError(cause instanceof Error ? cause.message : "Memory Service is unavailable.");
    } finally {
      setLoading(false);
    }
  }, [query, session?.access_token, workspace?.id]);

  useEffect(() => { setMemories([]); setError(null); }, [workspace?.id]);

  const submit = (event: FormEvent) => { event.preventDefault(); void search(); };

  return <div className="mx-auto max-w-6xl space-y-6 pb-12">
    <header className="flex items-center gap-3 border-b border-border-subtle pb-5"><div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-accent-purple/20 bg-accent-purple/10 text-accent-purple"><Database className="h-5 w-5" /></div><div><p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent-purple">VEYAAN / MEMORY</p><h1 className="mt-1 text-2xl font-semibold text-white">Memory Console</h1></div></header>
    <p className="max-w-2xl text-sm leading-6 text-text-muted">Search workspace-scoped memory through the authenticated Gateway. Results retain provenance and retrieval scores; this view never exposes hidden reasoning.</p>
    {!workspace ? <Card><EmptyState title="Connect a workspace" description="Sign in with Supabase and select an active workspace to search memory." locked /></Card> : <>
      <form onSubmit={submit} className="flex gap-2"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search approved workspace memory…" className="h-11 min-w-0 flex-1 rounded-xl border border-border-subtle bg-bg-surface-1 px-3 text-sm text-white outline-none focus:border-accent-purple/60" /><Button type="submit" disabled={loading || !query.trim()}><Search className="h-4 w-4" />Search</Button></form>
      {error ? <Card><EmptyState title="Memory search unavailable" description={error} /></Card> : !query.trim() ? <Card><EmptyState title="Enter a search" description="Memory retrieval is explicit and workspace-scoped." /></Card> : loading ? <Card className="h-36 animate-pulse" /> : memories.length === 0 ? <Card><EmptyState title="No matching memory" description="No authorized memory entries matched this query." /></Card> : <div className="space-y-3">{memories.map((memory) => <Card key={memory.id}><CardHeader><div className="flex items-start justify-between gap-3"><CardTitle className="text-sm font-normal leading-6">{memory.content}</CardTitle><Badge tone="neutral">{memory.scope_type}</Badge></div></CardHeader><CardContent><div className="flex flex-wrap items-center gap-3 text-[11px] text-text-muted"><span>score {memory.score.toFixed(3)}</span><span>{memory.source_type}</span><span className="font-mono">{memory.content_hash.slice(0, 12)}…</span>{memory.source_uri && <span className="truncate">{memory.source_uri}</span>}</div></CardContent></Card>)}</div>}
    </>}
  </div>;
}
