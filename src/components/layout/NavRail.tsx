"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, 
  Bot, 
  Briefcase, 
  Building2, 
  Users, 
  GitFork, 
  FileCode2, 
  Wrench, 
  Database, 
  CheckCircle2, 
  ShieldCheck, 
  Terminal, 
  Box, 
  Coins, 
  BellRing, 
  Settings,
  Radio,
  ChevronLeft,
  ChevronRight,
  Shield,
  Zap,
  Lock
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useRuntimeStatus } from "@/lib/api/runtime";

interface NavRailProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

type NavItem = { name: string; href: string; icon: LucideIcon; count?: number; badge?: string; badgeColor?: string };

export const navItems: NavItem[] = [
  { name: "Command Centre", href: "/", icon: LayoutDashboard },
  { name: "Personal Assistant", href: "/assistant", icon: Bot, badge: "Hermes" },
  { name: "Live Voice", href: "/voice", icon: Radio, badge: "LiveKit" },
  { name: "Projects", href: "/projects", icon: Briefcase },
  { name: "Departments", href: "/departments", icon: Building2 },
  { name: "Agents", href: "/agents", icon: Users },
  { name: "Workflow Studio", href: "/workflows", icon: GitFork },
  { name: "Prompt Studio", href: "/prompts", icon: FileCode2 },
  { name: "Skill Studio", href: "/skills", icon: Wrench },
  { name: "Memory Console", href: "/memory", icon: Database },
  { name: "Approval Centre", href: "/approvals", icon: CheckCircle2 },
  { name: "QA Centre", href: "/qa", icon: ShieldCheck },
  { name: "Logs & Observability", href: "/logs", icon: Terminal },
  { name: "Sandboxes & JCode", href: "/sandboxes", icon: Box },
  { name: "Models & Costs", href: "/costs", icon: Coins },
  { name: "Notifications", href: "/notifications", icon: BellRing },
  { name: "Settings", href: "/settings", icon: Settings },
];

export const NavRail: React.FC<NavRailProps> = ({ isCollapsed, onToggleCollapse }) => {
  const pathname = usePathname();
  const { status } = useRuntimeStatus();
  const connected = status?.services.some((service) => service.state === "online") ?? false;

  return (
    <aside
      className={`hidden lg:flex h-[calc(100vh-4rem)] bg-[#090D16] border-r border-border-subtle flex-col justify-between transition-all duration-300 z-20 sticky top-16 shrink-0 ${
        isCollapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Primary Navigation List */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-1 custom-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.name}
              href={item.href}
              title={isCollapsed ? item.name : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                isActive
                  ? "bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/30 shadow-glow"
                  : "text-text-secondary hover:text-text-primary hover:bg-bg-surface-2 border border-transparent"
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-accent-cyan" : "text-text-muted group-hover:text-text-primary"}`} />

              {!isCollapsed && (
                <div className="flex-1 flex items-center justify-between overflow-hidden">
                  <span className="truncate">{item.name}</span>

                  {item.badge && (
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${item.badgeColor || "bg-accent-purple/20 text-accent-purple"}`}>
                      {item.badge}
                    </span>
                  )}

                  {item.count !== undefined && !item.badge && (
                    <span className="text-[10px] font-mono text-text-muted bg-bg-surface-3 px-1.5 py-0.5 rounded">
                      {item.count}
                    </span>
                  )}
                </div>
              )}
            </Link>
          );
        })}
      </div>

      {/* Internal User Identity Panel (Matching reference images) */}
      <div className="p-3 border-t border-border-subtle bg-[#0B101D] space-y-2">
        {!isCollapsed && (
          <div className="p-2.5 rounded-xl bg-bg-surface-2 border border-border-subtle flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-accent-purple to-accent-cyan p-[1px] shrink-0">
              <div className="w-full h-full rounded-full bg-bg-app flex items-center justify-center text-accent-cyan font-bold text-xs">
                SM
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-white truncate">Workspace operator</div>
              <div className="text-[10px] text-text-muted font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-status-success" />
                <span>{connected ? "Connected services" : "Authentication required"}</span>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-center p-2 rounded-xl bg-bg-surface-2 border border-border-subtle text-text-muted hover:text-text-primary hover:border-border-glow transition-all"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <div className="flex items-center gap-2 text-xs font-mono"><ChevronLeft className="w-4 h-4" /> Collapse Rail</div>}
        </button>
      </div>
    </aside>
  );
};
