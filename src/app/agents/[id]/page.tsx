"use client";

import React, { useState } from "react";
import { 
  Bot, 
  Users, 
  FileCode2, 
  Wrench, 
  Database, 
  Coins, 
  ArrowLeft, 
  CheckCircle2, 
  Play, 
  Pause, 
  ShieldAlert, 
  Terminal, 
  Sparkles, 
  RotateCcw,
  Layers,
  Zap,
  Activity
} from "lucide-react";
import Link from "next/link";
import { DEV_AGENTS } from "@/lib/api";

export default function AgentDetailPage({ params }: { params: { id: string } }) {
  const agent = DEV_AGENTS.find(a => a.id === params.id) || DEV_AGENTS[0];
  const [activeTab, setActiveTab] = useState<"overview" | "contract" | "runs" | "prompt" | "skills" | "tools" | "memory" | "logs">("overview");
  if (!agent) return <UnavailableDetail entity="agent" />;

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border-subtle pb-4">
        <div className="flex items-center gap-3">
          <Link href="/agents" className="p-2 rounded-xl bg-bg-surface-2 border border-border-subtle text-text-muted hover:text-white">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="w-10 h-10 rounded-xl bg-accent-cyan/15 border border-accent-cyan/30 flex items-center justify-center text-accent-cyan font-bold">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white">{agent.name}</h1>
              <span className={`text-xs font-mono px-2.5 py-0.5 rounded ${agent.state === 'Working' ? 'bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/30' : 'bg-status-warning/20 text-status-warning'}`}>
                {agent.state}
              </span>
            </div>
            <p className="text-xs text-text-muted mt-0.5">{agent.role} • Department: {agent.departmentName}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <button className="px-3.5 py-2 rounded-xl bg-bg-surface-2 border border-border-subtle text-text-secondary hover:text-white flex items-center gap-1.5">
            <RotateCcw className="w-3.5 h-3.5" /> Re-trigger Agent
          </button>
          <button className="px-3.5 py-2 rounded-xl bg-status-danger/15 border border-status-danger/40 text-status-danger font-bold flex items-center gap-1.5">
            <Pause className="w-3.5 h-3.5" /> Pause Agent
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-xs">
        <div className="p-4 rounded-xl bg-bg-surface-1 border border-border-subtle">
          <div className="text-[10px] text-text-muted">Manager</div>
          <div className="text-sm font-bold text-white truncate">{agent.manager}</div>
        </div>
        <div className="p-4 rounded-xl bg-bg-surface-1 border border-border-subtle">
          <div className="text-[10px] text-text-muted">Model Routing</div>
          <div className="text-sm font-bold text-accent-purple truncate">{agent.model}</div>
        </div>
        <div className="p-4 rounded-xl bg-bg-surface-1 border border-border-subtle">
          <div className="text-[10px] text-text-muted">Success Rate</div>
          <div className="text-sm font-bold text-status-success">{agent.successRate}%</div>
        </div>
        <div className="p-4 rounded-xl bg-bg-surface-1 border border-border-subtle">
          <div className="text-[10px] text-text-muted">Today Spend</div>
          <div className="text-sm font-bold text-accent-cyan">${agent.todayCostUsd.toFixed(2)} USD</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border-subtle text-xs font-mono gap-4 overflow-x-auto">
        {[
          { id: "overview", label: "Overview" },
          { id: "contract", label: "Agent Contract" },
          { id: "runs", label: "Execution Runs" },
          { id: "prompt", label: "Attached System Prompt" },
          { id: "skills", label: "Skills & Tools" },
          { id: "memory", label: "Memory Scope" },
          { id: "logs", label: "Agent Logs" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-3 font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? "text-accent-cyan border-b-2 border-accent-cyan font-bold"
                : "text-text-muted hover:text-text-primary"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 p-5 rounded-2xl bg-bg-surface-1 border border-border-subtle space-y-4">
            <h2 className="text-sm font-bold text-white">Current Active Task</h2>
            <div className="p-4 rounded-xl bg-bg-app border border-border-subtle font-mono text-xs space-y-2 text-text-primary">
              <div className="text-accent-cyan font-bold">{agent.currentTask || "Idle — Monitoring event queue"}</div>
              <div className="text-text-muted text-[11px]">Last verified output: {agent.lastVerifiedOutput}</div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-bg-surface-1 border border-border-subtle space-y-3 font-mono text-xs">
            <h2 className="text-sm font-bold text-white font-sans">Capabilities & Policy</h2>
            <div className="space-y-2 text-text-secondary">
              <div>• Allowed Tools: `veyaan_hermes_orchestrator`, `jcode_runner`</div>
              <div>• Forbidden Tools: `prod_db_drop`, `public_payment`</div>
              <div>• Memory Scope: `projects/gde-402/*`</div>
              <div>• Max Daily Spend Cap: $50.00 USD</div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "contract" && (
        <div className="p-5 rounded-2xl bg-bg-surface-1 border border-border-subtle font-mono text-xs space-y-3">
          <h2 className="text-sm font-bold text-white font-sans">Agent Contract Definition (YAML)</h2>
          <pre className="p-4 rounded-xl bg-bg-app border border-border-subtle text-accent-cyan overflow-x-auto">
{`name: "${agent.name}"
role: "${agent.role}"
department: "${agent.departmentName}"
model_policy:
  primary: "claude-3-5-sonnet"
  fallback: "gemini-1.5-pro"
budget_cap_daily_usd: 50.0
version: "1.2.0"`}
          </pre>
        </div>
      )}
    </div>
  );
}

function UnavailableDetail({ entity }: { entity: string }) {
  return <div className="rounded-2xl border border-dashed border-border-subtle p-10 text-center"><h1 className="text-lg font-semibold text-white">{entity} data unavailable</h1><p className="mt-2 text-sm text-text-muted">Authenticate with a workspace member session to load this record.</p></div>;
}
