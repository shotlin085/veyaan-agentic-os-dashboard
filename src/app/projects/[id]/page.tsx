"use client";

import React, { useState } from "react";
import { 
  Briefcase, 
  Building2, 
  Users, 
  CheckSquare, 
  GitFork, 
  FileCode2, 
  ShieldCheck, 
  Coins, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Play, 
  Pause, 
  ShieldAlert, 
  ArrowLeft,
  Share2,
  MoreVertical,
  ExternalLink,
  Layers,
  Sparkles
} from "lucide-react";
import Link from "next/link";
import { DEV_PROJECTS, DEV_AGENTS, DEV_DEPARTMENTS } from "@/lib/api";

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const project = DEV_PROJECTS.find(p => p.id === params.id) || DEV_PROJECTS[0];
  const [activeTab, setActiveTab] = useState<"overview" | "requirements" | "departments" | "agents" | "tasks" | "qa" | "costs">("overview");
  if (!project) return <UnavailableDetail entity="project" />;

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <Link href="/projects" className="p-2 rounded-xl bg-muted border border-border text-muted-foreground hover:text-white transition-all">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-foreground/20 text-foreground border border-foreground/30">
                {project.code}
              </span>
              <h1 className="text-xl font-bold text-white">{project.name}</h1>
              <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-status-success/20 text-status-success">
                {project.phase} Phase
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{project.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <button className="px-3 py-1.5 rounded-xl bg-muted border border-border text-muted-foreground hover:text-white flex items-center gap-1.5">
            <Share2 className="w-3.5 h-3.5" /> Export Brief
          </button>
          <button className="px-3 py-1.5 rounded-xl bg-status-danger/15 border border-status-danger/40 text-status-danger font-bold flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5" /> Pause Project
          </button>
        </div>
      </div>

      {/* Project Health Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 font-mono text-xs">
        <div className="p-3 rounded-xl bg-popover border border-border">
          <div className="text-[10px] text-muted-foreground">Progress</div>
          <div className="text-base font-bold text-foreground">{project.progressPercentage}%</div>
        </div>
        <div className="p-3 rounded-xl bg-popover border border-border">
          <div className="text-[10px] text-muted-foreground">Health</div>
          <div className="text-base font-bold text-status-success">{project.health}</div>
        </div>
        <div className="p-3 rounded-xl bg-popover border border-border">
          <div className="text-[10px] text-muted-foreground">Departments</div>
          <div className="text-base font-bold text-white">{project.activeDepartmentCount} Active</div>
        </div>
        <div className="p-3 rounded-xl bg-popover border border-border">
          <div className="text-[10px] text-muted-foreground">Agents Assigned</div>
          <div className="text-base font-bold text-muted-foreground">{project.activeAgentCount} Agents</div>
        </div>
        <div className="p-3 rounded-xl bg-popover border border-border">
          <div className="text-[10px] text-muted-foreground">Today Spend</div>
          <div className="text-base font-bold text-status-warning">${project.todayCostUsd.toFixed(2)}</div>
        </div>
        <div className="p-3 rounded-xl bg-popover border border-border">
          <div className="text-[10px] text-muted-foreground">Budget Cap</div>
          <div className="text-base font-bold text-white">${project.totalBudgetUsd.toFixed(2)}</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-border text-xs font-mono gap-4">
        {[
          { id: "overview", label: "Overview" },
          { id: "requirements", label: "Requirements Brief" },
          { id: "departments", label: "Departments" },
          { id: "agents", label: "Agents" },
          { id: "tasks", label: "Tasks" },
          { id: "qa", label: "QA & Security" },
          { id: "costs", label: "Costs & Spend" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-3 font-medium transition-all ${
              activeTab === tab.id
                ? "text-foreground border-b-2 border-foreground font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content Views */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 p-5 rounded-2xl bg-popover border border-border space-y-4">
            <h2 className="text-sm font-bold text-white">Project Phase Roadmap</h2>
            <div className="flex items-center justify-between font-mono text-xs p-4 rounded-xl bg-background border border-border">
              {["Idea", "Requirements", "Architecture", "Design", "Development", "QA", "Delivery"].map((phase, idx) => (
                <div key={idx} className={`flex flex-col items-center gap-1 ${project.phase === phase ? 'text-foreground font-bold' : 'text-muted-foreground'}`}>
                  <span className={`w-3 h-3 rounded-full ${project.phase === phase ? 'bg-foreground animate-ping' : 'bg-accent'}`} />
                  <span className="text-[10px]">{phase}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              This project is currently executing in the {project.phase} phase. Autonomous agents across {project.activeDepartmentCount} departments are actively running tasks and publishing work orders.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-popover border border-border space-y-3">
            <h2 className="text-sm font-bold text-white">Project Meta</h2>
            <div className="font-mono text-xs space-y-2 text-muted-foreground">
              <div className="flex justify-between"><span>Owner:</span> <span className="text-white">{project.owner}</span></div>
              <div className="flex justify-between"><span>Status:</span> <span className="text-status-success">{project.status}</span></div>
              <div className="flex justify-between"><span>Pending Approvals:</span> <span className="text-status-warning">{project.pendingApprovalsCount}</span></div>
              <div className="flex justify-between"><span>Last Updated:</span> <span className="text-muted-foreground">{project.updatedAt}</span></div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "requirements" && (
        <div className="p-5 rounded-2xl bg-popover border border-border space-y-4">
          <h2 className="text-sm font-bold text-white">Structured Requirement Brief (Verified by Hermes)</h2>
          <div className="p-4 rounded-xl bg-background border border-border font-mono text-xs space-y-3 text-muted-foreground">
            <div><strong>Project Code:</strong> {project.code}</div>
            <div><strong>Objective:</strong> {project.description}</div>
            <div><strong>Architecture Pattern:</strong> Event-driven microservices + pgvector memory + Redis pub/sub queue.</div>
            <div><strong>Target Compliance:</strong> WCAG 2.2 AA, GDPR, SOC2 Audit Logging.</div>
          </div>
        </div>
      )}
    </div>
  );
}

function UnavailableDetail({ entity }: { entity: string }) {
  return <div className="rounded-2xl border border-dashed border-border p-10 text-center"><h1 className="text-lg font-semibold text-white">{entity} data unavailable</h1><p className="mt-2 text-sm text-muted-foreground">Authenticate with a workspace member session to load this record.</p></div>;
}
