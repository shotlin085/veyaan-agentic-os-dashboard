"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useWorkspace } from "@/lib/workspace/WorkspaceProvider";
import { EmptyState } from "@/components/ui/empty-state";

function listFromLines(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export default function AgentFactoryPage() {
  const { session } = useAuth();
  const { workspace } = useWorkspace();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [firstPriority, setFirstPriority] = useState("");
  const [allowed, setAllowed] = useState("");
  const [forbidden, setForbidden] = useState("");
  const [successCriteria, setSuccessCriteria] = useState("");
  const [escalateTo, setEscalateTo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);

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

  const canAdvanceFromStep1 = name.trim().length > 0 && firstPriority.trim().length > 0;
  const canAdvanceFromStep2 = listFromLines(allowed).length > 0;
  const canAdvanceFromStep3 = listFromLines(successCriteria).length > 0 && escalateTo.trim().length > 0;

  async function submit() {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const response = await fetch(`/api/workspaces/${encodeURIComponent(workspace!.id)}/agents`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${session!.access_token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          created_by: session!.user?.email ?? session!.user?.id ?? "dashboard",
          contract: {
            first_priority: firstPriority.trim(),
            allowed_responsibilities: listFromLines(allowed),
            forbidden_responsibilities: listFromLines(forbidden),
            input_schema: { type: "object" },
            output_schema: { type: "object" },
            completion_rules: { success_criteria: listFromLines(successCriteria) },
            escalation_rules: { escalate_to: escalateTo.trim() },
          },
        }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(String(body?.detail ?? body?.error ?? `Agent Workforce rejected this (status ${response.status}).`));
      }
      setCreatedId(String(body?.id ?? ""));
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Could not create this agent.");
    } finally {
      setSubmitting(false);
    }
  }

  if (createdId) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 pb-12">
        <div className="rounded-2xl border border-status-success/30 bg-status-success/10 p-6 text-center">
          <CheckCircle2 className="mx-auto h-8 w-8 text-status-success" />
          <h2 className="mt-3 text-sm font-semibold text-white">Agent created</h2>
          <p className="mt-1 text-xs text-text-muted">
            &quot;{name}&quot; now exists as a real agent definition in this workspace.
          </p>
          <p className="mt-1 font-mono text-[11px] text-text-muted">{createdId}</p>
          <button
            onClick={() => router.push("/agents")}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-accent-cyan px-4 py-2 text-xs font-semibold text-bg-app"
          >
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
          Real agent definitions, persisted in Agent Workforce — not a preview. Submitting creates an actual record you&apos;ll see on the Agents page.
        </p>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-border-subtle bg-bg-surface-1 p-4 font-mono text-xs">
        {[
          { step: 1, label: "1. Identity" },
          { step: 2, label: "2. Responsibilities" },
          { step: 3, label: "3. Completion & escalation" },
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
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Landing Page Developer" className={inputClass} />
            </Field>
            <Field label="Description (optional)">
              <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What this agent is for" className={inputClass} />
            </Field>
            <Field label="First priority — the one binding rule this agent always follows first">
              <input value={firstPriority} onChange={(e) => setFirstPriority(e.target.value)} placeholder="e.g. Never ship code that hasn't been tested" className={inputClass} />
            </Field>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-white">Responsibilities</h2>
            <Field label="Allowed — one per line">
              <textarea value={allowed} onChange={(e) => setAllowed(e.target.value)} rows={4} placeholder={"Write landing page copy\nBuild the page in Next.js"} className={inputClass} />
            </Field>
            <Field label="Forbidden — one per line (optional)">
              <textarea value={forbidden} onChange={(e) => setForbidden(e.target.value)} rows={3} placeholder={"Deploy to production without approval"} className={inputClass} />
            </Field>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-white">Completion &amp; escalation</h2>
            <Field label="Success criteria — one per line">
              <textarea value={successCriteria} onChange={(e) => setSuccessCriteria(e.target.value)} rows={4} placeholder={"Page builds with no errors\nCopy approved by the user"} className={inputClass} />
            </Field>
            <Field label="Escalate to — who/what this agent hands off to when blocked">
              <input value={escalateTo} onChange={(e) => setEscalateTo(e.target.value)} placeholder="e.g. Development Manager" className={inputClass} />
            </Field>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-white">Review</h2>
            <dl className="space-y-2 text-xs">
              <Row label="Name" value={name} />
              <Row label="First priority" value={firstPriority} />
              <Row label="Allowed responsibilities" value={listFromLines(allowed).join(", ")} />
              <Row label="Forbidden responsibilities" value={listFromLines(forbidden).join(", ") || "—"} />
              <Row label="Success criteria" value={listFromLines(successCriteria).join(", ")} />
              <Row label="Escalates to" value={escalateTo} />
            </dl>
            {submitError && <p className="rounded-lg border border-status-danger/30 bg-status-danger/10 p-3 text-xs text-status-danger">{submitError}</p>}
          </div>
        )}

        <div className="flex justify-between border-t border-border-subtle pt-4">
          <button
            disabled={step === 1}
            onClick={() => setStep(step - 1)}
            className="rounded-lg border border-border-subtle bg-bg-surface-2 px-4 py-2 text-xs text-text-secondary disabled:opacity-40"
          >
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
              disabled={!canAdvanceFromStep3 || submitting}
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

const inputClass =
  "w-full rounded-lg border border-border-subtle bg-bg-app p-2.5 text-xs text-text-primary focus:border-accent-cyan focus:outline-none";

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
