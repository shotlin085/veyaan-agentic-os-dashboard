"use client";

import React, { useState } from "react";
import { 
  Building2, 
  Users, 
  GitFork, 
  FileCode2, 
  Wrench, 
  Database, 
  Coins, 
  ArrowLeft,
  Activity,
  Bot
} from "lucide-react";
import Link from "next/link";
import { DEV_DEPARTMENTS, DEV_AGENTS } from "@/lib/api";

export default function DepartmentDetailPage({ params }: { params: { id: string } }) {
  const dept = DEV_DEPARTMENTS.find(d => d.id === params.id) || DEV_DEPARTMENTS[0];
  if (!dept) return <UnavailableDetail entity="department" />;
  const deptAgents = DEV_AGENTS.filter(a => a.departmentId === dept.id || a.departmentName === dept.name);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <Link href="/departments" className="p-2 rounded-xl bg-muted border border-border text-muted-foreground hover:text-white">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-muted-foreground/20 text-muted-foreground border border-muted-foreground/30">
                {dept.code}
              </span>
              <h1 className="text-xl font-bold text-white">{dept.name}</h1>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{dept.mission}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 font-mono text-xs">
        <div className="p-4 rounded-xl bg-popover border border-border">
          <div className="text-[10px] text-muted-foreground">Manager</div>
          <div className="text-sm font-bold text-white truncate">{dept.managerName}</div>
        </div>
        <div className="p-4 rounded-xl bg-popover border border-border">
          <div className="text-[10px] text-muted-foreground">Active Agents</div>
          <div className="text-sm font-bold text-foreground">{dept.activeAgentsCount} Agents</div>
        </div>
        <div className="p-4 rounded-xl bg-popover border border-border">
          <div className="text-[10px] text-muted-foreground">Running Workflows</div>
          <div className="text-sm font-bold text-muted-foreground">{dept.runningWorkflowsCount} Graphs</div>
        </div>
        <div className="p-4 rounded-xl bg-popover border border-border">
          <div className="text-[10px] text-muted-foreground">Today Spend</div>
          <div className="text-sm font-bold text-status-warning">${dept.todayCostUsd.toFixed(2)} USD</div>
        </div>
      </div>

      {/* Agents in Department */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Users className="w-4 h-4 text-foreground" />
          Assigned Agents
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {deptAgents.map((agent) => (
            <div key={agent.id} className="p-4 rounded-2xl bg-popover border border-border space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">{agent.name}</span>
                <span className="text-[10px] font-mono text-status-success">{agent.state}</span>
              </div>
              <p className="text-xs text-muted-foreground">{agent.role}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function UnavailableDetail({ entity }: { entity: string }) {
  return <div className="rounded-2xl border border-dashed border-border p-10 text-center"><h1 className="text-lg font-semibold text-white">{entity} data unavailable</h1><p className="mt-2 text-sm text-muted-foreground">Authenticate with a workspace member session to load this record.</p></div>;
}
