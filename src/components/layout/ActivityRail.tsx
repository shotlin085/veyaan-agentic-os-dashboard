"use client";

import React, { useState } from "react";
import { Activity, ChevronRight, ChevronLeft, Coins } from "lucide-react";
import { EMPTY_AGENTS, EMPTY_APPROVALS, EMPTY_EVENTS } from "@/lib/api";
import { useRuntimeStatus } from "@/lib/api/runtime";
import { useWorkspace } from "@/lib/workspace/WorkspaceProvider";

export const ActivityRail: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<"stream" | "approvals" | "agents">("stream");
  const { status } = useRuntimeStatus();
  const { workspace } = useWorkspace();

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed right-0 top-24 z-30 bg-bg-surface-2 border-l border-y border-border-subtle p-2 rounded-l-lg text-text-muted hover:text-accent-cyan transition-all shadow-glow"
        title="Open Live Activity Rail"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
    );
  }

  return (
    <aside className="w-80 h-[calc(100vh-4rem)] bg-bg-surface-1/95 border-l border-border-subtle flex flex-col z-20 sticky top-16 hidden xl:flex">
      {/* Header */}
      <div className="h-12 border-b border-border-subtle px-3 flex items-center justify-between bg-bg-surface-2/60">
        <div className="flex items-center gap-2 text-xs font-semibold text-text-primary">
          <Activity className="w-4 h-4 text-accent-cyan animate-pulse" />
          <span>Live Activity Rail</span>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="p-1 rounded hover:bg-bg-surface-3 text-text-muted hover:text-text-primary"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border-subtle bg-bg-app/50 p-1 gap-1 text-[11px] font-mono">
        <button
          onClick={() => setActiveTab("stream")}
          className={`flex-1 py-1.5 rounded text-center transition-all ${
            activeTab === "stream" ? "bg-bg-surface-2 text-accent-cyan font-bold border border-accent-cyan/20" : "text-text-muted hover:text-text-primary"
          }`}
        >
          Events ({EMPTY_EVENTS.length})
        </button>
        <button
          onClick={() => setActiveTab("approvals")}
          className={`flex-1 py-1.5 rounded text-center transition-all ${
            activeTab === "approvals" ? "bg-bg-surface-2 text-status-warning font-bold border border-status-warning/20" : "text-text-muted hover:text-text-primary"
          }`}
        >
          Approvals ({EMPTY_APPROVALS.length})
        </button>
        <button
          onClick={() => setActiveTab("agents")}
          className={`flex-1 py-1.5 rounded text-center transition-all ${
            activeTab === "agents" ? "bg-bg-surface-2 text-accent-purple font-bold border border-accent-purple/20" : "text-text-muted hover:text-text-primary"
          }`}
        >
          Agents ({EMPTY_AGENTS.length})
        </button>
      </div>

      {/* Content Body */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {activeTab === "stream" && (
          <div className="space-y-2.5">
            {EMPTY_EVENTS.map((event) => (
              <div key={event.event_id} className="p-2.5 rounded-lg bg-bg-surface-2/80 border border-border-subtle text-xs space-y-1 hover:border-border-glow transition-all">
                <div className="flex items-center justify-between font-mono text-[10px]">
                  <span className="text-accent-cyan">{event.event_type}</span>
                  <span className="text-text-muted">seq:#{event.sequence}</span>
                </div>
                <p className="text-text-primary text-[11px]">
                  {JSON.stringify(event.payload)}
                </p>
                <div className="text-[9px] text-text-muted font-mono">{new Date(event.occurred_at).toLocaleTimeString()}</div>
              </div>
            ))}
            {!EMPTY_EVENTS.length && <EmptyRailState label="No live events" detail={workspace ? "Workspace is connected; events will appear when a workflow runs." : "Select an active workspace to stream activity."} />}
          </div>
        )}

        {activeTab === "approvals" && (
          <div className="space-y-2.5">
            {EMPTY_APPROVALS.map((approval) => (
              <div key={approval.id} className="p-3 rounded-lg bg-bg-surface-2 border border-status-warning/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-status-warning/10 text-status-warning border border-status-warning/20">
                    {approval.riskLevel} Risk
                  </span>
                  <span className="text-[10px] text-text-muted">{approval.createdAt}</span>
                </div>
                <div className="text-xs font-medium text-text-primary">{approval.title}</div>
                <p className="text-[11px] text-text-secondary">{approval.impactSummary}</p>
                <div className="flex items-center gap-2 pt-1">
                  <button className="flex-1 py-1 rounded bg-status-success/20 hover:bg-status-success text-status-success hover:text-white text-[11px] font-semibold transition-all">
                    Approve
                  </button>
                  <button className="flex-1 py-1 rounded bg-bg-surface-3 hover:bg-status-danger text-text-secondary hover:text-white text-[11px] font-semibold transition-all">
                    Reject
                  </button>
                </div>
              </div>
            ))}
            {!EMPTY_APPROVALS.length && <EmptyRailState label="No approvals" detail="Workspace approvals appear here when available." />}
          </div>
        )}

        {activeTab === "agents" && (
          <div className="space-y-2.5">
            {EMPTY_AGENTS.map((agent) => (
              <div key={agent.id} className="p-2.5 rounded-lg bg-bg-surface-2 border border-border-subtle flex items-start gap-2.5">
                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${agent.state === 'Working' ? 'bg-accent-cyan animate-ping' : 'bg-status-warning'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-text-primary truncate">{agent.name}</span>
                    <span className="text-[10px] font-mono text-accent-cyan">${agent.todayCostUsd.toFixed(2)}</span>
                  </div>
                  <div className="text-[10px] text-text-muted truncate">{agent.role}</div>
                  {agent.currentTask && (
                    <div className="text-[10px] text-text-secondary mt-1 font-mono line-clamp-2 bg-bg-app/60 p-1 rounded border border-border-subtle">
                      Task: {agent.currentTask}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {!EMPTY_AGENTS.length && <EmptyRailState label="No agents" detail={workspace ? "No agents have been assigned to this workspace yet." : "Select an active workspace to load agents."} />}
          </div>
        )}
      </div>

      {/* Internal Operational Cost Footer */}
      <div className="p-3 border-t border-border-subtle bg-bg-surface-2/80 font-mono text-xs space-y-1">
        <div className="text-[10px] text-text-muted border-b border-border-subtle pb-2 space-y-1">
          {status?.services.map((service) => (
            <div key={service.name} className="flex items-center justify-between gap-2">
              <span className="truncate">{service.name}</span>
              <span className={service.state === "online" ? "text-status-success" : "text-status-warning"}>{service.state}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between text-text-secondary">
          <span className="flex items-center gap-1"><Coins className="w-3.5 h-3.5 text-status-warning" /> Workspace data:</span>
          <span className={workspace ? "text-status-success font-bold" : "text-text-muted font-bold"}>{workspace ? "Ready" : "Unavailable"}</span>
        </div>
        <div className="text-[9px] text-text-muted text-right">{workspace ? "Workspace session active" : "Sign in to load workspace metrics"}</div>
      </div>
    </aside>
  );
};

function EmptyRailState({ label, detail }: { label: string; detail: string }) {
  return <div className="rounded-xl border border-dashed border-border-subtle p-4 text-center"><div className="text-xs text-text-secondary">{label}</div><div className="mt-1 text-[10px] leading-4 text-text-muted">{detail}</div></div>;
}
