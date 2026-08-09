"use client";

import React from "react";
import Link from "next/link";
import { 
  ShieldAlert, 
  Search, 
  Command, 
  Mic, 
  Radio, 
  ChevronDown, 
  Bell, 
  Cpu, 
  User, 
  Activity,
  Zap,
  Lock
} from "lucide-react";
import { useRuntimeStatus } from "@/lib/api/runtime";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useWorkspace } from "@/lib/workspace/WorkspaceProvider";

interface TopBarProps {
  onOpenCommandPalette: () => void;
  onOpenEmergencyStop: () => void;
  onToggleVoice: () => void;
  isVoiceActive?: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  onOpenCommandPalette,
  onOpenEmergencyStop,
  onToggleVoice,
  isVoiceActive = false,
}) => {
  const { status, loading, refresh } = useRuntimeStatus();
  const { configured, user, signOut } = useAuth();
  const { workspaces, workspace, selectWorkspace } = useWorkspace();
  const hermes = status?.services.find((service) => service.name === "Hermes Orchestrator");
  const runner = status?.services.find((service) => service.name === "JCode Runner");
  const serviceLabel = loading ? "CHECKING" : hermes?.state === "online" ? "HERMES:OK" : hermes?.state === "degraded" ? "HERMES:DEGRADED" : "HERMES:OFFLINE";

  return (
    <header className="h-16 w-full overflow-hidden border-b border-border-subtle bg-bg-surface-1/90 backdrop-blur-md px-3 sm:px-4 flex items-center justify-between z-30 sticky top-0">
      {/* Left Region: VEYAAN Identity & Context Selectors */}
      <div className="flex items-center gap-4">
        {/* VEYAAN Logo */}
        <div className="flex items-center gap-2.5 pr-2 border-r border-border-subtle">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-accent-cyan via-accent-purple to-bg-surface-2 p-[1px] shadow-glow">
            <div className="w-full h-full bg-bg-app rounded-[7px] flex items-center justify-center">
              <Zap className="w-5 h-5 text-accent-cyan animate-pulseSlow" />
            </div>
          </div>
          <div className="hidden sm:block">
            <div className="flex items-center gap-1.5">
              <span className="font-bold tracking-wider text-base text-white">VEYAAN</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20">
                Agentic OS
              </span>
            </div>
            <span className="text-[10px] text-text-muted font-mono block">v3.4.0 • Enterprise Plane</span>
          </div>
        </div>

        {/* Workspace Selector */}
        <label className="relative hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg-surface-2 border border-border-subtle text-xs hover:border-border-glow transition-colors group">
          <Cpu className="w-3.5 h-3.5 text-accent-cyan" />
          <select aria-label="Select workspace" value={workspace?.id ?? ""} onChange={(event) => selectWorkspace(event.target.value)} disabled={!workspaces.length} className="max-w-[12rem] appearance-none bg-transparent pr-5 font-medium text-text-primary outline-none disabled:text-text-muted">
            {!workspaces.length && <option value="">{user ? "No workspace access" : "Connect workspace"}</option>}
            {workspaces.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-text-muted group-hover:text-text-primary transition-colors" />
        </label>

        {/* Project Context Selector */}
        <div className="relative hidden 2xl:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg-surface-2 border border-border-subtle text-xs hover:border-border-glow transition-colors cursor-pointer group">
          <Activity className="w-3.5 h-3.5 text-accent-purple" />
          <span className="font-medium text-text-primary truncate max-w-[200px]">{workspace ? `${workspace.name} · ${workspace.role ?? "member"}` : user ? "No workspace membership" : "Sign in to connect"}</span>
          <ChevronDown className="w-3.5 h-3.5 text-text-muted group-hover:text-text-primary transition-colors" />
        </div>
      </div>

      {/* Centre Region: Global Search & Command Trigger */}
      <div className="hidden xl:block flex-1 max-w-md mx-4">
        <button
          onClick={onOpenCommandPalette}
          className="w-full flex items-center justify-between px-3.5 py-2 rounded-lg bg-bg-app/80 border border-border-subtle text-xs text-text-muted hover:border-accent-cyan/40 hover:text-text-primary transition-all group shadow-inner"
        >
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-text-muted group-hover:text-accent-cyan transition-colors" />
            <span>Search agents, workflows, prompts, projects or memory...</span>
          </div>
          <div className="flex items-center gap-1 font-mono text-[10px] bg-bg-surface-3 px-2 py-0.5 rounded text-text-secondary border border-border-subtle">
            <Command className="w-3 h-3" /> K
          </div>
        </button>
      </div>

      {/* Right Region: Operational Controls & Team Profile */}
      <div className="flex items-center gap-3">
        {/* Environment Badge */}
        <div className="hidden 2xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-status-success/10 border border-status-success/20 text-[11px] text-status-success font-mono">
          <span className="w-2 h-2 rounded-full bg-status-success animate-ping" />
          <span>{runner?.state === "online" ? "RUNNER:OK" : "RUNNER:CHECK"}</span>
        </div>

        {/* Connection Status */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-bg-surface-2 border border-border-subtle text-[11px] text-text-secondary font-mono">
          <button onClick={() => void refresh()} className="flex items-center gap-1.5" title="Refresh service status">
            <Radio className={`w-3.5 h-3.5 ${hermes?.state === "online" ? "text-accent-cyan" : "text-status-danger"}`} />
            <span>{serviceLabel}</span>
          </button>
        </div>

        {/* Voice Command Trigger */}
        <button
          onClick={onToggleVoice}
          aria-label="Toggle voice assistant"
          title="Voice Assistant Mode"
          className={`p-2 rounded-lg border transition-all ${
            isVoiceActive 
              ? "bg-accent-cyan/20 border-accent-cyan text-accent-cyan shadow-glow" 
              : "bg-bg-surface-2 border-border-subtle text-text-muted hover:text-text-primary hover:border-border-glow"
          }`}
        >
          <Mic className={`w-4 h-4 ${isVoiceActive ? "animate-bounce" : ""}`} />
        </button>

        {/* Emergency Stop Button */}
        <button
          onClick={onOpenEmergencyStop}
          aria-label="Open emergency stop"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-status-danger/15 border border-status-danger/40 text-status-danger text-xs font-semibold hover:bg-status-danger hover:text-white transition-all shadow-sm active:scale-95"
        >
          <ShieldAlert className="w-4 h-4" />
          <span className="hidden 2xl:inline">EMERGENCY STOP</span>
        </button>

        {/* Signed-in User Identity (Internal Team Only) */}
        <div className="flex items-center gap-2 pl-2 border-l border-border-subtle">
          {user ? <button onClick={() => void signOut()} title="Sign out" className="w-8 h-8 rounded-full bg-accent-purple/20 border border-accent-purple/40 flex items-center justify-center text-accent-purple font-semibold text-xs">{(user.email?.[0] ?? "V").toUpperCase()}</button> : <Link href="/login" aria-label="Connect workspace" className="w-8 h-8 rounded-full bg-accent-purple/20 border border-accent-purple/40 flex items-center justify-center text-accent-purple font-semibold text-xs">{configured ? "→" : "!"}</Link>}
          <div className="hidden xl:block text-left">
            <div className="text-xs font-medium text-text-primary flex items-center gap-1">
              {user?.email ?? "Workspace operator"}
              <span title="Internal Authorized Session">
                <Lock className="w-3 h-3 text-accent-cyan" />
              </span>
            </div>
            <div className="text-[10px] text-text-muted font-mono">{user ? (status?.authenticated ? "Authenticated" : "Loading workspace") : configured ? "Sign-in required" : "Supabase setup required"}</div>
          </div>
        </div>
      </div>
    </header>
  );
};
