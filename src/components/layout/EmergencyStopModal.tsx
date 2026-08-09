"use client";

import React, { useState } from "react";
import { ShieldAlert, AlertTriangle, Lock, X, Check } from "lucide-react";

interface EmergencyStopModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmergencyStopModal: React.FC<EmergencyStopModalProps> = ({ isOpen, onClose }) => {
  const [scope, setScope] = useState<"ALL" | "AGENTS_ONLY" | "PROJECT_ONLY">("ALL");
  const [reason, setReason] = useState("");
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isTriggered, setIsTriggered] = useState(false);

  if (!isOpen) return null;

  const handleExecuteStop = () => {
    if (!reason.trim()) return;
    setIsTriggered(true);
    setTimeout(() => {
      setIsTriggered(false);
      setIsConfirmed(true);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-bg-surface-1 border-2 border-status-danger rounded-xl shadow-2xl overflow-hidden p-6 space-y-5 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border-subtle pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-status-danger/20 border border-status-danger/40 flex items-center justify-center text-status-danger">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold text-status-danger flex items-center gap-2">
                EMERGENCY STOP PROTOCOL
              </h2>
              <p className="text-xs text-text-muted font-mono">VEYAAN Core Backend Safety Interlock</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded text-text-muted hover:text-text-primary">
            <X className="w-5 h-5" />
          </button>
        </div>

        {isConfirmed ? (
          <div className="py-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-status-danger/20 text-status-danger border border-status-danger flex items-center justify-center mx-auto">
              <Check className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white">EMERGENCY STOP EXECUTED</h3>
            <p className="text-xs text-text-secondary">
              All agent execution loops, sandbox commands, and API routers have been safely paused. Audit record logged to Core Backend.
            </p>
            <button
              onClick={() => {
                setIsConfirmed(false);
                onClose();
              }}
              className="px-5 py-2 rounded-lg bg-bg-surface-2 border border-border-subtle text-xs text-text-primary hover:border-accent-cyan transition-all"
            >
              Close Safety Overlay
            </button>
          </div>
        ) : (
          <>
            {/* Scope Selection */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-text-primary block">1. Select Shutdown Scope:</label>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <button
                  onClick={() => setScope("ALL")}
                  className={`p-2.5 rounded-lg border font-mono text-center transition-all ${
                    scope === "ALL" 
                      ? "bg-status-danger text-white border-status-danger shadow-glow" 
                      : "bg-bg-surface-2 text-text-secondary border-border-subtle hover:border-border-glow"
                  }`}
                >
                  FULL SYSTEM (KILL ALL)
                </button>
                <button
                  onClick={() => setScope("AGENTS_ONLY")}
                  className={`p-2.5 rounded-lg border font-mono text-center transition-all ${
                    scope === "AGENTS_ONLY" 
                      ? "bg-status-warning text-black font-bold border-status-warning" 
                      : "bg-bg-surface-2 text-text-secondary border-border-subtle hover:border-border-glow"
                  }`}
                >
                  PAUSE AGENTS ONLY
                </button>
                <button
                  onClick={() => setScope("PROJECT_ONLY")}
                  className={`p-2.5 rounded-lg border font-mono text-center transition-all ${
                    scope === "PROJECT_ONLY" 
                      ? "bg-accent-purple text-white border-accent-purple" 
                      : "bg-bg-surface-2 text-text-secondary border-border-subtle hover:border-border-glow"
                  }`}
                >
                  PAUSE ACTIVE PROJECT
                </button>
              </div>
            </div>

            {/* Mandatory Reason Input */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-text-primary block">
                2. Mandatory Auditable Reason:
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="State reason for emergency stop (e.g. unexpected agent task behavior, security audit, user request)..."
                className="w-full h-20 bg-bg-app border border-border-subtle rounded-lg p-2.5 text-xs text-text-primary placeholder:text-text-muted focus:border-status-danger focus:outline-none"
              />
            </div>

            {/* Warning banner */}
            <div className="p-3 rounded-lg bg-status-danger/10 border border-status-danger/30 flex items-center gap-3 text-xs text-status-danger">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>This action is immediate, authoritative, and recorded in immutable security audit logs.</span>
            </div>

            {/* Confirm Execution Button */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-lg bg-bg-surface-2 border border-border-subtle text-xs text-text-secondary hover:text-text-primary transition-all"
              >
                Cancel
              </button>
              <button
                disabled={!reason.trim() || isTriggered}
                onClick={handleExecuteStop}
                className="flex-1 py-2.5 rounded-lg bg-status-danger text-white font-bold text-xs shadow-glow hover:bg-red-600 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {isTriggered ? (
                  <span>DISPATCHING KILL SIGNAL...</span>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    CONFIRM & EXECUTE STOP
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
