"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useWorkspace } from "@/lib/workspace/WorkspaceProvider";
import { EmptyState } from "@/components/ui/empty-state";

const AGENT_CLASSES = [
  { value: "manager", label: "Manager — directs other agents, doesn't do the work itself" },
  { value: "specialist", label: "Specialist — does one kind of work well (e.g. a developer)" },
  { value: "reviewer", label: "Reviewer — checks other agents' work before it ships" },
  { value: "assistant", label: "Assistant — general-purpose helper" },
] as const;

function listFromLines(value: string): string[] {
  return value.split("\n").map((line) => line.trim()).filter(Boolean);
}

function slugify(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 100) || "agent";
}

export default function AgentFactoryPage() {
  const { session } = useAuth();
  const { workspace } = useWorkspace();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [displayName, setDisplayName] = useState("");
  const [description, setDescription] = useState("");
  const [agentClass, setAgentClass] = useState<(typeof AGENT_CLASSES)[number]["value"]>("specialist");
  const [purpose, setPurpose] = useState("");
  const [firstPriority, setFirstPriority] = useState("");
  const [responsibilities, setResponsibilities] = useState("");
  const [prohibitedActions, setProhibitedActions] = useState("");
  const [definitionOfDone, setDefinitionOfDone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ id: string; displayName: string } | null>(null);

  if (!session?.access_token || !workspace?.id) {
    return (
      <div className="mx-auto max-w-4xl pb-12">
        <EmptyState
          title="Connect a workspace"
          description="Sign in with Supabase and select an active workspace from the top bar before creating an agent."
          locked
        />
      </div>
    );
  }

  const canAdvanceFromStep1 = displayName.trim().length > 0 && purpose.trim().length > 0 && firstPriority.trim().length > 0;
  const canAdvanceFromStep2 = listFromLines(responsibilities).length > 0;
  const canSubmit = listFromLines(definitionOfDone).length > 0;

  async function submit() {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const response = await fetch(`/api/workspaces/${encodeURIComponent(workspace!.id)}/agent-definitions`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${session!.access_token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          name: slugify(displayName),
          display_name: displayName.trim(),
          description: description.trim() || null,
          agent_class: agentClass,
          purpose: purpose.trim(),
          first_priority: firstPriority.trim(),
          responsibilities: listFromLines(responsibilities),
          prohibited_actions: listFromLines(prohibitedActions),
          allowed_tools: [],
          forbidden_tools: [],
          memory_namespaces: [],
          model_policy: {},
          definition_of_done: listFromLines(definitionOfDone),
        }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(String(body?.detail ?? body?.error ?? `The agent service rejected this (status ${response.status}).`));
      }
      setCreated({ id: String(body?.id ?? ""), displayName: displayName.trim() });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Could not create this agent.");
    } finally {
      setSubmitting(false);
    }
  }

  if (created) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 pb-12">
        <div className="rounded-2xl border border-status-success/30 bg-status-success/10 p-6 text-center">
          <CheckCircle2 className="mx-auto h-8 w-8 text-status-success" />
          <h2 className="mt-3 text-sm font-semibold text-white">Agent created</h2>
          <p className="mt-1 text-xs text-text-muted">&quot;{created.displayName}&quot; now exists as a real agent definition in this workspace.</p>
          <p className="mt-1 font-mono text-[11px] text-text-muted">{created.id}</p>
          <button onClick={() => router.push("/agents")} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-accent-cyan px-4 py-2 text-xs font-semibold text-bg-app">
            View agents <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12">
      <div className="border-b border-border-subtle pb-4">
        <h1 className="flex items-center gap-2 text-xl font-bold text-white">
          <Sparkles className="h-5 w-5 text-accent-purple" />
          Create an agent
        </h1>
        <p className="mt-1 text-xs text-text-muted">
          Real agent definitions, persisted in Hermes — not a preview. Submitting creates an actual record you&apos;ll see on the Agents page.
        </p>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-border-subtle bg-bg-surface-1 p-4 font-mono text-xs">
        {[
          { step: 1, label: "1. Identity" },
          { step: 2, label: "2. Responsibilities" },
          { step: 3, label: "3. Definition of done" },
          { step: 4, label: "4. Review" },
        ].map((s) => (
          <div key={s.step} className={`flex items-center gap-2 ${step >= s.step ? "font-bold text-accent-cyan" : "text-text-muted"}`}>
            <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${step >= s.step ? "bg-accent-cyan text-bg-app" : "bg-bg-surface-3"}`}>{s.step}</span>
            <span>{s.label}</span>
          </div>
        ))}
      </div>

      <div className="space-y-5 rounded-2xl border border-border-subtle bg-bg-surface-1 p-6">
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-white">Identity &amp; purpose</h2>
            <Field label="Name">
              <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="e.g. Landing Page Developer" className={inputClass} />
            </Field>
            <Field label="Description (optional)">
              <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What this agent is for" className={inputClass} />
            </Field>
            <Field label="Class — how this agent fits into a team">
              <select value={agentClass} onChange={(e) => setAgentClass(e.target.value as typeof agentClass)} className={inputClass}>
                {AGENT_CLASSES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Purpose — one sentence on what this agent does">
              <input value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="e.g. Builds and ships landing pages from a briefing" className={inputClass} />
            </Field>
            <Field label="First priority — the one binding rule this agent always follows first">
              <input value={firstPriority} onChange={(e) => setFirstPriority(e.target.value)} placeholder="e.g. Never ship code that hasn't been tested" className={inputClass} />
            </Field>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-white">Responsibilities</h2>
            <Field label="Responsibilities — one per line">
              <textarea value={responsibilities} onChange={(e) => setResponsibilities(e.target.value)} rows={4} placeholder={"Write landing page copy\nBuild the page in Next.js"} className={inputClass} />
            </Field>
            <Field label="Prohibited actions — one per line (optional)">
              <textarea value={prohibitedActions} onChange={(e) => setProhibitedActions(e.target.value)} rows={3} placeholder={"Deploy to production without approval"} className={inputClass} />
            </Field>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-white">Definition of done</h2>
            <Field label="What must be true for this agent to consider its work finished — one per line">
              <textarea value={definitionOfDone} onChange={(e) => setDefinitionOfDone(e.target.value)} rows={4} placeholder={"Page builds with no errors\nCopy approved by the user"} className={inputClass} />
            </Field>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-white">Review</h2>
            <dl className="space-y-2 text-xs">
              <Row label="Name" value={displayName} />
              <Row label="Class" value={agentClass} />
              <Row label="Purpose" value={purpose} />
              <Row label="First priority" value={firstPriority} />
              <Row label="Responsibilities" value={listFromLines(responsibilities).join(", ")} />
              <Row label="Prohibited actions" value={listFromLines(prohibitedActions).join(", ") || "—"} />
              <Row label="Definition of done" value={listFromLines(definitionOfDone).join(", ")} />
            </dl>
            {submitError && <p className="rounded-lg border border-status-danger/30 bg-status-danger/10 p-3 text-xs text-status-danger">{submitError}</p>}
          </div>
        )}

        <div className="flex justify-between border-t border-border-subtle pt-4">
          <button disabled={step === 1} onClick={() => setStep(step - 1)} className="rounded-lg border border-border-subtle bg-bg-surface-2 px-4 py-2 text-xs text-text-secondary disabled:opacity-40">
            Back
          </button>
          {step < 4 ? (
            <button
              disabled={(step === 1 && !canAdvanceFromStep1) || (step === 2 && !canAdvanceFromStep2)}
              onClick={() => setStep(Math.min(4, step + 1))}
              className="flex items-center gap-2 rounded-lg bg-accent-purple px-5 py-2 text-xs font-bold text-white shadow-purpleGlow disabled:opacity-40"
            >
              <span>Next</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              disabled={!canSubmit || submitting}
              onClick={() => void submit()}
              className="flex items-center gap-2 rounded-lg bg-accent-purple px-5 py-2 text-xs font-bold text-white shadow-purpleGlow disabled:opacity-40"
            >
              <span>{submitting ? "Creating…" : "Create agent"}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const inputClass = "w-full rounded-lg border border-border-subtle bg-bg-app p-2.5 text-xs text-text-primary focus:border-accent-cyan focus:outline-none";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs text-text-muted">{label}</label>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border-subtle/60 pb-2">
      <dt className="shrink-0 text-text-muted">{label}</dt>
      <dd className="text-right text-text-primary">{value || "—"}</dd>
    </div>
  );
}
