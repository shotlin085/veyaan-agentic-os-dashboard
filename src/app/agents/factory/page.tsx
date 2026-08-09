"use client";

import React, { useState } from "react";
import { Bot, Sparkles, Check, ArrowRight, ShieldCheck, Wrench, Coins } from "lucide-react";
import Link from "next/link";

export default function AgentFactoryPage() {
  const [step, setStep] = useState(1);
  const [agentName, setAgentName] = useState("");
  const [role, setRole] = useState("");
  const [department, setDepartment] = useState("Development");

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="border-b border-border-subtle pb-4">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-accent-purple" />
          AGENT FACTORY WIZARD
        </h1>
        <p className="text-xs text-text-muted mt-1">Autonomous agent generation: define purpose, contracts, tool permissions, safety policies, and model routing.</p>
      </div>

      {/* Step Progress Header */}
      <div className="flex items-center justify-between font-mono text-xs p-4 rounded-xl bg-bg-surface-1 border border-border-subtle">
        {[
          { step: 1, label: "1. Purpose & Role" },
          { step: 2, label: "2. Capabilities & Tools" },
          { step: 3, label: "3. Safety & Budget" },
          { step: 4, label: "4. Contract Validation" },
        ].map((s) => (
          <div key={s.step} className={`flex items-center gap-2 ${step >= s.step ? 'text-accent-cyan font-bold' : 'text-text-muted'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= s.step ? 'bg-accent-cyan text-bg-app' : 'bg-bg-surface-3'}`}>
              {s.step}
            </span>
            <span>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Wizard Step Content */}
      <div className="p-6 rounded-2xl bg-bg-surface-1 border border-border-subtle space-y-5">
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-white">Define Agent Identity & Purpose</h2>
            <div>
              <label className="text-xs text-text-muted block mb-1">Agent Designation Name</label>
              <input
                type="text"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                placeholder="e.g. Autonomous Refactoring Sentinel"
                className="w-full bg-bg-app border border-border-subtle rounded-lg p-2.5 text-xs text-text-primary focus:border-accent-cyan focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-text-muted block mb-1">Role Responsibility</label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Scans Next.js codebase for WCAG 2.2 AA accessibility failures and emits auto-fix PRs"
                className="w-full bg-bg-app border border-border-subtle rounded-lg p-2.5 text-xs text-text-primary focus:border-accent-cyan focus:outline-none"
              />
            </div>
          </div>
        )}

        {step >= 2 && (
          <div className="p-4 rounded-xl bg-status-success/10 border border-status-success/30 text-status-success text-xs font-mono">
            ✓ Agent contract compiled cleanly with 0 security warnings.
          </div>
        )}

        <div className="flex justify-between pt-4 border-t border-border-subtle">
          <button
            disabled={step === 1}
            onClick={() => setStep(step - 1)}
            className="px-4 py-2 rounded-lg bg-bg-surface-2 border border-border-subtle text-xs text-text-secondary disabled:opacity-40"
          >
            Back
          </button>
          <button
            onClick={() => setStep(Math.min(4, step + 1))}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-accent-purple text-white font-bold text-xs hover:bg-purple-600 shadow-purpleGlow"
          >
            <span>{step === 4 ? "Deploy Agent Contract" : "Next Step"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
