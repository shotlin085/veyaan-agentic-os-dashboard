"use client";

import { FormEvent, useCallback, useState } from "react";
import { DatabaseIcon, LockKeyhole, SearchIcon } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useWorkspace } from "@/lib/workspace/WorkspaceProvider";
import { RetrievalChunks, type RetrievalChunk } from "@/components/elements/retrieval-chunks";
import { field, inkButton, mono } from "@/components/elements/surfaces";
import { cn } from "@/lib/utils";

type Memory = { id: string; content: string; source_type: string; source_uri: string | null; scope_type: string; content_hash: string; score: number };

export default function MemoryConsolePage() {
  const { session } = useAuth();
  const { workspace } = useWorkspace();
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (term: string) => {
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
      setMemories(Array.isArray(body.items) ? (body.items as Memory[]) : []);
      setError(null);
    } catch (cause) {
      setMemories([]);
      setError(cause instanceof Error ? cause.message : "Memory Service is unavailable.");
    } finally {
      setLoading(false);
    }
  }, [session?.access_token, workspace?.id]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setSubmittedQuery(query);
    void search(query);
  };

  const chunks: RetrievalChunk[] = memories.map((memory) => ({
    id: memory.id,
    source: memory.source_type,
    locator: memory.source_uri ?? `${memory.content_hash.slice(0, 12)}…`,
    score: memory.score,
    text: memory.content,
  }));

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 p-6 pb-16">
      <header className="flex items-center gap-3 border-b border-border pb-5">
        <div className="flex size-9 items-center justify-center rounded-xl bg-foreground/[0.06] text-foreground/70">
          <DatabaseIcon className="size-4" />
        </div>
        <div>
          <p className={cn(mono, "text-foreground/35")}>VEYAAN / MEMORY</p>
          <h1 className="text-xl font-semibold text-foreground">Memory</h1>
        </div>
      </header>

      <p className="max-w-2xl text-sm leading-6 text-foreground/55">
        Search workspace-scoped memory through the authenticated gateway. Results retain
        provenance and retrieval scores; this view never exposes hidden reasoning.
      </p>

      {!workspace ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border py-16 text-center">
          <LockKeyhole className="size-6 text-foreground/30" />
          <p className="text-sm text-foreground/55">
            Sign in and select an active workspace from the sidebar to search memory.
          </p>
        </div>
      ) : (
        <>
          <form onSubmit={submit} className="flex gap-2">
            <label className={cn(field, "flex min-w-0 flex-1 items-center gap-2 rounded-xl px-3 py-2.5")}>
              <SearchIcon className="size-3.5 shrink-0 text-foreground/30" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search approved workspace memory..."
                aria-label="Search memory"
                className="min-w-0 flex-1 bg-transparent text-sm text-foreground/85 outline-none placeholder:text-foreground/35"
              />
            </label>
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className={cn(inkButton, "rounded-xl px-4 text-sm font-medium disabled:pointer-events-none disabled:opacity-40")}
            >
              Search
            </button>
          </form>

          {error ? (
            <p className="text-[13px] leading-snug text-destructive/80">{error}</p>
          ) : !submittedQuery.trim() ? (
            <p className={cn(mono, "text-foreground/35")}>Memory retrieval is explicit and workspace-scoped.</p>
          ) : (
            <RetrievalChunks
              query={submittedQuery}
              chunks={chunks}
              visibleCount={chunks.length}
              searching={loading}
              className="w-full max-w-none"
            />
          )}
        </>
      )}
    </div>
  );
}
