"use client";

import { useEffect, useState, type FC } from "react";
import { CheckIcon, Loader2Icon, XIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useWorkspace } from "@/lib/workspace/WorkspaceProvider";
import { useConversations } from "@/components/assistant/runtime/ConversationProvider";
import {
  enhanceImagePrompt,
  generateImage,
  useImageJobPolling,
  type ImageEngine,
} from "@/components/assistant/runtime/image-generation";

type Step = "idea" | "enhancing" | "review" | "generating" | "done" | "error";

const ENGINE_LABEL: Record<ImageEngine, string> = {
  flow: "Nano Banana (Google Flow)",
  chatgpt: "ChatGPT",
};

/**
 * The deterministic image quick-action flow: idea -> AI-expanded prompt
 * (shown for review, per the confirmed product decision, not applied
 * silently) -> generate -> poll -> done. Calls the browsermcp MCP tool
 * directly server-side (app/mcp_direct/client.py) - not hermes-agent
 * deciding to use it. On completion the backend has already persisted
 * the real turns; bumpMessageReload() is what makes them actually show
 * up (see ConversationProvider's own comment on why that's needed).
 */
export const ImageGenPanel: FC<{ engine: ImageEngine; onClose: () => void }> = ({ engine, onClose }) => {
  const { session } = useAuth();
  const { workspace } = useWorkspace();
  const { activeConversation, bumpMessageReload } = useConversations();
  const config = {
    workspaceId: workspace?.id ?? "",
    conversationId: activeConversation?.id ?? "",
    token: session?.access_token ?? "",
  };

  const [idea, setIdea] = useState("");
  const [prompt, setPrompt] = useState("");
  const [step, setStep] = useState<Step>("idea");
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);

  const jobState = useImageJobPolling(config, step === "generating" ? jobId : null);

  useEffect(() => {
    if (!jobState || step !== "generating") return;
    if (jobState.status === "completed") {
      setStep("done");
      bumpMessageReload();
    } else if (jobState.status === "failed") {
      setError(jobState.error ?? "Generation failed.");
      setStep("error");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobState, step]);

  const ready = Boolean(config.workspaceId && config.conversationId && config.token);

  const handleEnhance = async () => {
    if (!idea.trim() || !ready) return;
    setStep("enhancing");
    setError(null);
    const result = await enhanceImagePrompt(config, idea.trim());
    if ("error" in result) {
      setError(result.error);
      setStep("idea");
      return;
    }
    setPrompt(result.enhancedPrompt);
    setStep("review");
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || !ready) return;
    setStep("generating");
    setError(null);
    const result = await generateImage(config, prompt.trim(), engine);
    if ("error" in result) {
      setError(result.error);
      setStep("review");
      return;
    }
    setJobId(result.jobId);
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-2xl border border-border bg-popover p-5"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-foreground">Create image — {ENGINE_LABEL[engine]}</h2>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        {!ready && (
          <p className="mt-4 text-xs text-muted-foreground">Sign in and select a workspace first.</p>
        )}

        {ready && (step === "idea" || step === "enhancing") && (
          <div className="mt-4 space-y-3">
            <label className="block text-xs text-muted-foreground">Describe the image</label>
            <textarea
              value={idea}
              onChange={(event) => setIdea(event.target.value)}
              rows={3}
              placeholder="e.g. a launch poster for VEYAAN AI"
              disabled={step === "enhancing"}
              autoFocus
              className="w-full rounded-lg border border-border bg-background p-2.5 text-xs text-foreground focus:border-foreground/40 focus:outline-none disabled:opacity-60"
            />
            {error && <p className="text-xs text-status-danger">{error}</p>}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-border bg-muted px-4 py-2 text-xs text-muted-foreground"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleEnhance()}
                disabled={!idea.trim() || step === "enhancing"}
                className="flex items-center gap-1.5 rounded-lg bg-foreground px-4 py-2 text-xs font-semibold text-background disabled:opacity-40"
              >
                {step === "enhancing" && <Loader2Icon className="h-3.5 w-3.5 animate-spin" />}
                {step === "enhancing" ? "Writing a professional prompt…" : "Enhance prompt"}
              </button>
            </div>
          </div>
        )}

        {step === "review" && (
          <div className="mt-4 space-y-3">
            <label className="block text-xs text-muted-foreground">Prompt (edit if you like, then generate)</label>
            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              rows={6}
              autoFocus
              className="w-full rounded-lg border border-border bg-background p-2.5 text-xs text-foreground focus:border-foreground/40 focus:outline-none"
            />
            {error && <p className="text-xs text-status-danger">{error}</p>}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setStep("idea")}
                className="rounded-lg border border-border bg-muted px-4 py-2 text-xs text-muted-foreground"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => void handleGenerate()}
                disabled={!prompt.trim()}
                className="rounded-lg bg-foreground px-4 py-2 text-xs font-semibold text-background disabled:opacity-40"
              >
                Generate
              </button>
            </div>
          </div>
        )}

        {step === "generating" && (
          <div className="mt-6 flex flex-col items-center gap-3 py-6 text-center">
            <Loader2Icon className="h-8 w-8 animate-spin text-foreground/60" aria-hidden />
            <p className="text-sm font-medium text-foreground">Generating your image…</p>
            <p className="max-w-xs text-xs text-muted-foreground">
              Real browser automation, not instant — this can take a minute or two.
            </p>
          </div>
        )}

        {step === "done" && (
          <div className="mt-6 flex flex-col items-center gap-3 py-6 text-center">
            <span className="flex size-10 items-center justify-center rounded-full bg-status-success/15 text-status-success">
              <CheckIcon className="h-5 w-5" />
            </span>
            <p className="text-sm font-medium text-foreground">Image generated — added to this conversation.</p>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-foreground px-4 py-2 text-xs font-semibold text-background"
            >
              Close
            </button>
          </div>
        )}

        {step === "error" && (
          <div className={cn("mt-4 space-y-3")}>
            <p className="text-xs leading-snug text-status-danger">{error}</p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-border bg-muted px-4 py-2 text-xs text-muted-foreground"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => setStep("review")}
                className="rounded-lg bg-foreground px-4 py-2 text-xs font-semibold text-background"
              >
                Try again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
