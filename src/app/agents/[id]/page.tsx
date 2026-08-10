"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Bot, MessageCirclePlus, MessageSquareText } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useWorkspace } from "@/lib/workspace/WorkspaceProvider";
import { EmptyState } from "@/components/ui/empty-state";
import { useConversations } from "@/components/assistant/runtime/ConversationProvider";
import type { HermesConversation } from "@/components/assistant/runtime/hermes-conversations";

type AgentTurn = {
  id: string;
  role: string;
  content: string;
  content_type: string;
  model_used: string | null;
  created_at: string;
};

// Logs are capped to the N most recently active agent-scoped conversations
// rather than every one ever created - this agent could accumulate a lot of
// history over time, and fetching full turn history for all of it on every
// page load isn't worth it for a "recent activity" view.
const MAX_LOGGED_CONVERSATIONS = 8;

type AgentDefinition = {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  version: number;
  status: string;
  agent_class: string;
  purpose: string;
  first_priority: string;
  reports_to: string | null;
  responsibilities: string[];
  prohibited_actions: string[];
  allowed_tools: string[];
  forbidden_tools: string[];
  memory_namespaces: string[];
  definition_of_done: string[];
  max_time_budget_seconds: number | null;
  is_active: boolean;
};

export default function AgentDetailPage({ params }: { params: { id: string } }) {
  const { session } = useAuth();
  const { workspace } = useWorkspace();
  // Shared app-wide conversation state (see ConversationProvider.tsx's
  // own docstring: a second, disconnected useHermesConversations()
  // instance here would create a conversation the shared list/sidebar
  // never learns about, so /c/[conversationId] would resolve it as
  // "doesn't exist in this workspace" even though it's a real row.
  const { createConversation, conversations } = useConversations();
  const [agent, setAgent] = useState<AgentDefinition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "contract" | "runs" | "logs">("overview");
  const [turnsByConversation, setTurnsByConversation] = useState<Record<string, AgentTurn[]>>({});
  const [turnsLoading, setTurnsLoading] = useState(false);
  const [turnsError, setTurnsError] = useState<string | null>(null);

  // Real conversations this agent has actually been used in - already
  // fetched app-wide by ConversationProvider, just filtered here rather
  // than re-fetched. Newest activity first.
  const agentConversations: HermesConversation[] = agent
    ? conversations
        .filter((c) => c.agent_definition_id === agent.id)
        .sort((a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at))
    : [];

  useEffect(() => {
    let active = true;
    if (activeTab !== "logs" || !session?.access_token || !workspace?.id || agentConversations.length === 0) return;
    const toFetch = agentConversations.slice(0, MAX_LOGGED_CONVERSATIONS).filter((c) => !turnsByConversation[c.id]);
    if (toFetch.length === 0) return;
    setTurnsLoading(true);
    setTurnsError(null);
    void Promise.all(
      toFetch.map((c) =>
        fetch(`/api/workspaces/${encodeURIComponent(workspace.id)}/conversations/${encodeURIComponent(c.id)}/messages`, {
          headers: { authorization: `Bearer ${session.access_token}` },
          cache: "no-store",
        })
          .then((response) => (response.ok ? response.json() : []))
          .then((turns: AgentTurn[]) => [c.id, turns] as const)
          .catch(() => [c.id, []] as const),
      ),
    )
      .then((entries) => {
        if (!active) return;
        setTurnsByConversation((current) => ({ ...current, ...Object.fromEntries(entries) }));
      })
      .catch((cause) => {
        if (active) setTurnsError(cause instanceof Error ? cause.message : "Could not load agent logs.");
      })
      .finally(() => {
        if (active) setTurnsLoading(false);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, session?.access_token, workspace?.id, agentConversations.map((c) => c.id).join(",")]);

  const startConversation = async () => {
    if (!agent || starting) return;
    setStarting(true);
    setStartError(null);
    // createConversation from the shared context already navigates to
    // /c/[id] on success (see ConversationProvider.tsx) - no router.push
    // needed here.
    const conversationId = await createConversation(agent.id);
    if (!conversationId) {
      setStartError("Could not start a conversation with this agent — try again.");
      setStarting(false);
    }
  };

  useEffect(() => {
    let active = true;
    if (!session?.access_token || !workspace?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    void fetch(`/api/workspaces/${encodeURIComponent(workspace.id)}/agent-definitions/${encodeURIComponent(params.id)}`, {
      headers: { authorization: `Bearer ${session.access_token}` },
      cache: "no-store",
    })
      .then(async (response) => {
        const body = await response.json().catch(() => null);
        if (!active) return;
        if (!response.ok) throw new Error(String(body?.detail ?? body?.error ?? "This agent could not be loaded."));
        setAgent(body as AgentDefinition);
        setError(null);
      })
      .catch((cause) => {
        if (!active) return;
        setError(cause instanceof Error ? cause.message : "This agent could not be loaded.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [params.id, session?.access_token, workspace?.id]);

  if (!session?.access_token || !workspace?.id) {
    return (
      <div className="mx-auto max-w-5xl pb-12">
        <EmptyState title="Connect a workspace" description="Sign in with Supabase and select an active workspace from the sidebar." locked />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl space-y-4 pb-12">
        <div className="h-24 animate-pulse rounded-2xl border border-border bg-popover" />
        <div className="h-64 animate-pulse rounded-2xl border border-border bg-popover" />
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className="mx-auto max-w-5xl pb-12">
        <EmptyState title="Agent not found" description={error ?? "No agent with this id exists in the current workspace."} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-12">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <Link href="/agents" className="rounded-xl border border-border bg-muted p-2 text-muted-foreground hover:text-white">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-foreground/30 bg-foreground/15 text-foreground">
            <Bot className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white">{agent.display_name}</h1>
              {/* `is_active` is the field that actually governs whether this
                  agent can be talked to right now - the lifecycle `status`
                  (draft/approved/production/...) is a separate, not-yet-
                  meaningful concept pre-Agent-Factory (see AgentDefinitionStatus's
                  own docstring in app/agents/models.py) and was misleading
                  here as the loud badge: an agent showing "draft" while
                  fully active and doing real work read as broken. */}
              <span
                className={`rounded px-2.5 py-0.5 font-mono text-xs ${
                  agent.is_active ? "bg-status-success/20 text-status-success" : "bg-status-danger/20 text-status-danger"
                }`}
              >
                {agent.is_active ? "active" : "inactive"}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {agent.agent_class} · v{agent.version} · <span className="font-mono">{agent.name}</span> · status: {agent.status}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <button
            onClick={() => void startConversation()}
            disabled={starting}
            className="flex items-center gap-2 rounded-xl border border-foreground/30 bg-foreground/15 px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-foreground/25 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <MessageCirclePlus className="h-4 w-4" />
            {starting ? "Starting…" : "Start conversation with this agent"}
          </button>
          {startError && <p className="text-xs text-status-danger">{startError}</p>}
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto border-b border-border font-mono text-xs">
        {[
          { id: "overview" as const, label: "Overview" },
          { id: "contract" as const, label: "Definition" },
          { id: "runs" as const, label: "Execution Runs" },
          { id: "logs" as const, label: "Agent Logs" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`whitespace-nowrap pb-3 font-medium transition-all ${
              activeTab === tab.id ? "border-b-2 border-foreground font-bold text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-4 rounded-2xl border border-border bg-popover p-5 lg:col-span-2">
            <h2 className="text-sm font-bold text-white">Purpose &amp; priority</h2>
            <p className="text-xs leading-6 text-foreground">{agent.purpose}</p>
            <div className="rounded-xl border border-border bg-background p-3 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">First priority:</span> {agent.first_priority}
            </div>
            {agent.description && <p className="text-xs leading-6 text-muted-foreground">{agent.description}</p>}
            <ListSection title="Responsibilities" items={agent.responsibilities} />
            <ListSection title="Prohibited actions" items={agent.prohibited_actions} empty="None specified." />
            <ListSection title="Definition of done" items={agent.definition_of_done} />
          </div>

          <div className="space-y-3 rounded-2xl border border-border bg-popover p-5 font-mono text-xs">
            <h2 className="font-sans text-sm font-bold text-white">Policy</h2>
            <div className="space-y-2 text-muted-foreground">
              <div>Reports to: {agent.reports_to ?? "—"}</div>
              <div>Allowed tools: {agent.allowed_tools.length ? agent.allowed_tools.join(", ") : "none configured"}</div>
              <div>Forbidden tools: {agent.forbidden_tools.length ? agent.forbidden_tools.join(", ") : "none configured"}</div>
              <div>Memory scope: {agent.memory_namespaces.length ? agent.memory_namespaces.join(", ") : "none configured"}</div>
              <div>Max time budget: {agent.max_time_budget_seconds ? `${agent.max_time_budget_seconds}s` : "unbounded"}</div>
              <div>Active: {agent.is_active ? "yes" : "no"}</div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "contract" && (
        <div className="space-y-3 rounded-2xl border border-border bg-popover p-5 font-mono text-xs">
          <h2 className="font-sans text-sm font-bold text-white">Real stored definition</h2>
          <pre className="overflow-x-auto rounded-xl border border-border bg-background p-4 text-foreground">{JSON.stringify(agent, null, 2)}</pre>
        </div>
      )}

      {activeTab === "runs" && (
        agentConversations.length === 0 ? (
          <EmptyState
            title="No execution runs yet"
            description="This agent hasn't been talked to yet — use 'Start conversation with this agent' above to open a real chat scoped to its stored definition. Every conversation with this agent shows up here."
          />
        ) : (
          <div className="space-y-3">
            {agentConversations.map((c) => (
              <Link
                key={c.id}
                href={`/c/${c.id}`}
                className="flex items-center justify-between gap-4 rounded-xl border border-border bg-popover p-4 transition-colors hover:border-foreground/30"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">{c.title ?? "Untitled conversation"}</p>
                  <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                    {c.status} · updated {new Date(c.updated_at).toLocaleString()}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded px-2 py-0.5 font-mono text-[11px] ${
                    c.status === "active" ? "bg-status-success/20 text-status-success" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {c.status}
                </span>
              </Link>
            ))}
          </div>
        )
      )}

      {activeTab === "logs" && (
        agentConversations.length === 0 ? (
          <EmptyState
            title="No logs yet"
            description="This agent hasn't been talked to yet — logs are the real turn history from every conversation scoped to it, once one exists."
          />
        ) : (
          <div className="space-y-6">
            {turnsError && <p className="text-xs text-status-danger">{turnsError}</p>}
            {turnsLoading && Object.keys(turnsByConversation).length === 0 && (
              <div className="h-32 animate-pulse rounded-2xl border border-border bg-popover" />
            )}
            {agentConversations.slice(0, MAX_LOGGED_CONVERSATIONS).map((c) => {
              const turns = turnsByConversation[c.id];
              if (!turns || turns.length === 0) return null;
              return (
                <div key={c.id} className="space-y-2 rounded-2xl border border-border bg-popover p-4">
                  <div className="flex items-center justify-between gap-3">
                    <Link href={`/c/${c.id}`} className="flex items-center gap-2 text-xs font-semibold text-white hover:underline">
                      <MessageSquareText className="size-3.5 text-foreground/50" />
                      {c.title ?? "Untitled conversation"}
                    </Link>
                    <span className="font-mono text-[11px] text-muted-foreground">{turns.length} turns</span>
                  </div>
                  <div className="space-y-2 border-t border-border pt-2">
                    {turns.map((turn) => (
                      <div key={turn.id} className="text-xs leading-5">
                        <span className={`font-mono font-semibold ${turn.role === "user" ? "text-foreground" : "text-muted-foreground"}`}>
                          {turn.role}
                        </span>
                        <span className="ml-2 font-mono text-[10px] text-muted-foreground/60">
                          {new Date(turn.created_at).toLocaleTimeString()}
                          {turn.model_used ? ` · ${turn.model_used}` : ""}
                        </span>
                        <p className="mt-0.5 line-clamp-3 text-muted-foreground">{turn.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            {agentConversations.length > MAX_LOGGED_CONVERSATIONS && (
              <p className="text-center text-[11px] text-muted-foreground">
                Showing the {MAX_LOGGED_CONVERSATIONS} most recently active conversations of {agentConversations.length} total.
              </p>
            )}
          </div>
        )
      )}
    </div>
  );
}

function ListSection({ title, items, empty }: { title: string; items: string[]; empty?: string }) {
  return (
    <div>
      <h3 className="mb-1.5 text-xs font-semibold text-white">{title}</h3>
      {items.length ? (
        <ul className="space-y-1 text-xs text-muted-foreground">
          {items.map((item, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-foreground">•</span>
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-muted-foreground">{empty ?? "None."}</p>
      )}
    </div>
  );
}
