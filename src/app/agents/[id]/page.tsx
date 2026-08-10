"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Bot } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useWorkspace } from "@/lib/workspace/WorkspaceProvider";
import { EmptyState } from "@/components/ui/empty-state";

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
  const [agent, setAgent] = useState<AgentDefinition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "contract" | "runs" | "logs">("overview");

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
        <div className="h-24 animate-pulse rounded-2xl border border-border-subtle bg-bg-surface-1" />
        <div className="h-64 animate-pulse rounded-2xl border border-border-subtle bg-bg-surface-1" />
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
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border-subtle pb-4">
        <div className="flex items-center gap-3">
          <Link href="/agents" className="rounded-xl border border-border-subtle bg-bg-surface-2 p-2 text-text-muted hover:text-white">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-accent-cyan/30 bg-accent-cyan/15 text-accent-cyan">
            <Bot className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white">{agent.display_name}</h1>
              <span className="rounded bg-status-warning/20 px-2.5 py-0.5 font-mono text-xs text-status-warning">{agent.status}</span>
            </div>
            <p className="mt-0.5 text-xs text-text-muted">
              {agent.agent_class} · v{agent.version} · <span className="font-mono">{agent.name}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto border-b border-border-subtle font-mono text-xs">
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
              activeTab === tab.id ? "border-b-2 border-accent-cyan font-bold text-accent-cyan" : "text-text-muted hover:text-text-primary"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-4 rounded-2xl border border-border-subtle bg-bg-surface-1 p-5 lg:col-span-2">
            <h2 className="text-sm font-bold text-white">Purpose &amp; priority</h2>
            <p className="text-xs leading-6 text-text-primary">{agent.purpose}</p>
            <div className="rounded-xl border border-border-subtle bg-bg-app p-3 text-xs text-text-secondary">
              <span className="font-semibold text-accent-cyan">First priority:</span> {agent.first_priority}
            </div>
            {agent.description && <p className="text-xs leading-6 text-text-muted">{agent.description}</p>}
            <ListSection title="Responsibilities" items={agent.responsibilities} />
            <ListSection title="Prohibited actions" items={agent.prohibited_actions} empty="None specified." />
            <ListSection title="Definition of done" items={agent.definition_of_done} />
          </div>

          <div className="space-y-3 rounded-2xl border border-border-subtle bg-bg-surface-1 p-5 font-mono text-xs">
            <h2 className="font-sans text-sm font-bold text-white">Policy</h2>
            <div className="space-y-2 text-text-secondary">
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
        <div className="space-y-3 rounded-2xl border border-border-subtle bg-bg-surface-1 p-5 font-mono text-xs">
          <h2 className="font-sans text-sm font-bold text-white">Real stored definition</h2>
          <pre className="overflow-x-auto rounded-xl border border-border-subtle bg-bg-app p-4 text-accent-cyan">{JSON.stringify(agent, null, 2)}</pre>
        </div>
      )}

      {activeTab === "runs" && (
        <EmptyState
          title="No execution runs"
          description="This agent has a real, stored definition, but nothing executes it yet — there is no run history to show because no run has ever happened."
        />
      )}

      {activeTab === "logs" && (
        <EmptyState
          title="No logs"
          description="Logs will appear here once this agent is actually dispatched to do work — that capability doesn't exist yet."
        />
      )}
    </div>
  );
}

function ListSection({ title, items, empty }: { title: string; items: string[]; empty?: string }) {
  return (
    <div>
      <h3 className="mb-1.5 text-xs font-semibold text-white">{title}</h3>
      {items.length ? (
        <ul className="space-y-1 text-xs text-text-secondary">
          {items.map((item, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-accent-cyan">•</span>
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-text-muted">{empty ?? "None."}</p>
      )}
    </div>
  );
}
