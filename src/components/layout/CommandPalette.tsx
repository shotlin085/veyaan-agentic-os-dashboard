"use client";

import React, { useState, useEffect } from "react";
import { 
  Search, 
  Command, 
  Bot, 
  Briefcase, 
  GitFork, 
  CheckCircle2, 
  ShieldAlert, 
  X, 
  ArrowRight,
  Terminal,
  Database,
  Coins
} from "lucide-react";
import { useRouter } from "next/navigation";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenEmergencyStop: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onOpenEmergencyStop,
}) => {
  const [query, setQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Open handled by parent or state
        }
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const quickActions = [
    { name: "Ask Personal Assistant (Hermes)", href: "/assistant", icon: Bot, group: "Actions" },
    { name: "Create New AI Project", href: "/projects", icon: Briefcase, group: "Actions" },
    { name: "Open Visual Workflow Builder", href: "/workflows", icon: GitFork, group: "Actions" },
    { name: "Review Pending Approvals (2)", href: "/approvals", icon: CheckCircle2, group: "Actions" },
    { name: "Inspect Live Observability Logs", href: "/logs", icon: Terminal, group: "Observability" },
    { name: "Search RAG Memory Console", href: "/memory", icon: Database, group: "Data" },
    { name: "Inspect Model Usage & Cost Routing", href: "/costs", icon: Coins, group: "Operations" },
    { name: "TRIGGER EMERGENCY STOP", action: onOpenEmergencyStop, icon: ShieldAlert, danger: true, group: "Emergency" },
  ];

  const filtered = quickActions.filter(action =>
    action.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-start justify-center pt-20 px-4">
      <div 
        className="w-full max-w-2xl bg-bg-surface-1 border border-border-glow rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="h-14 px-4 border-b border-border-subtle flex items-center gap-3 bg-bg-surface-2/60">
          <Search className="w-5 h-5 text-accent-cyan" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command, project, agent, or ask Hermes..."
            className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
            autoFocus
          />
          <button onClick={onClose} className="p-1 rounded text-text-muted hover:text-text-primary">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-xs text-text-muted">
              No matching commands found for “{query}”. Try typing “Assistant”, “Workflow”, or “Emergency”.
            </div>
          ) : (
            filtered.map((item, idx) => {
              const Icon = item.icon;
              return (
                <button
                  key={idx}
                  onClick={() => {
                    if (item.action) {
                      item.action();
                    } else if (item.href) {
                      router.push(item.href);
                    }
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-lg text-xs transition-all group ${
                    item.danger
                      ? "bg-status-danger/10 text-status-danger hover:bg-status-danger hover:text-white border border-status-danger/30"
                      : "text-text-primary hover:bg-bg-surface-2 hover:text-accent-cyan border border-transparent hover:border-border-subtle"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${item.danger ? "text-status-danger" : "text-text-muted group-hover:text-accent-cyan"}`} />
                    <span className="font-medium">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-1 font-mono text-[10px] text-text-muted group-hover:text-text-primary">
                    <span>Execute</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="h-10 px-4 border-t border-border-subtle bg-bg-surface-2/40 flex items-center justify-between font-mono text-[10px] text-text-muted">
          <div className="flex items-center gap-2">
            <span>Use ↑↓ to navigate</span>
            <span>•</span>
            <span>ESC to close</span>
          </div>
          <div className="text-accent-cyan">VEYAAN Agentic OS Palette</div>
        </div>
      </div>
    </div>
  );
};
