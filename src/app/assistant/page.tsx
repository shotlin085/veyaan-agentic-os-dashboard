"use client";

import { useEffect, useMemo, useState } from "react";
import { AssistantRuntimeProvider, ComposerPrimitive, MessagePrimitive, ThreadPrimitive, useLocalRuntime, type ChatModelAdapter, type ThreadMessage } from "@assistant-ui/react";
import { Bot, LockKeyhole, Send, Sparkles, WifiOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useRuntimeStatus } from "@/lib/api/runtime";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useWorkspace } from "@/lib/workspace/WorkspaceProvider";

function textFromMessage(message: ThreadMessage) {
  if (!Array.isArray(message.content)) return "";
  return message.content.filter((part) => part.type === "text").map((part) => part.text).join(" ");
}

function createHermesAdapter(config: { workspaceId: string; conversationId: string; token: string }): ChatModelAdapter {
  return {
    async *run({ messages, abortSignal }) {
      const userMessage = [...messages].reverse().find((message) => message.role === "user");
      const content = userMessage ? textFromMessage(userMessage) : "";
      if (!config.workspaceId || !config.conversationId || !config.token) {
        yield { content: [{ type: "text", text: "Sign in and select a workspace to start a real Hermes conversation." }] };
        return;
      }

      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${config.token}` },
        body: JSON.stringify({ workspaceId: config.workspaceId, conversationId: config.conversationId, content }),
        signal: abortSignal,
      });
      if (!response.ok || !response.body) {
        const detail = await response.text().catch(() => "Hermes request failed");
        yield { content: [{ type: "text", text: detail || "Hermes request failed." }] };
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let accumulated = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const frames = buffer.split("\n\n");
        buffer = frames.pop() ?? "";
        for (const frame of frames) {
          const line = frame.split("\n").find((entry) => entry.startsWith("data: "));
          if (!line) continue;
          const event = JSON.parse(line.slice(6)) as { event?: string; content?: string; error?: string };
          if (event.event === "assistant.token.delta") accumulated += event.content ?? "";
          if (event.event === "runtime.failed") accumulated = event.error ?? "Hermes runtime failed.";
          yield { content: [{ type: "text", text: accumulated }] };
        }
      }
    },
  };
}

function AssistantMessage() {
  return <MessagePrimitive.Root className="group flex gap-3 py-3">
    <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-accent-purple/30 bg-accent-purple/10 text-accent-purple"><Bot className="h-4 w-4" /></div>
    <div className="min-w-0 max-w-[min(100%,48rem)] rounded-2xl border border-border-subtle bg-bg-surface-2/70 px-4 py-3 text-sm leading-6 text-text-primary"><MessagePrimitive.Content /></div>
  </MessagePrimitive.Root>;
}

function UserMessage() {
  return <MessagePrimitive.Root className="flex justify-end py-3"><div className="max-w-[min(92%,40rem)] rounded-2xl border border-accent-cyan/25 bg-accent-cyan/10 px-4 py-3 text-sm leading-6 text-white"><MessagePrimitive.Content /></div></MessagePrimitive.Root>;
}

export default function PersonalAssistantPage() {
  const { status, loading } = useRuntimeStatus();
  const { session, user } = useAuth();
  const { workspace } = useWorkspace();
  const [conversationId, setConversationId] = useState("");
  const [conversationError, setConversationError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    setConversationId("");
    setConversationError(null);
    if (!session?.access_token || !workspace?.id) return () => { active = false; };
    void fetch(`/api/workspaces/${workspace.id}/conversations`, {
      method: "POST",
      headers: { authorization: `Bearer ${session.access_token}`, "content-type": "application/json" },
      body: JSON.stringify({ title: "VEYAAN dashboard conversation", channel: "web" }),
    }).then(async (response) => {
      const payload = await response.json().catch(() => ({}));
      if (!active) return;
      if (!response.ok) setConversationError(String(payload.detail ?? payload.error ?? "Conversation could not be created."));
      else setConversationId(String(payload.id));
    }).catch(() => { if (active) setConversationError("Hermes conversation API is unreachable."); });
    return () => { active = false; };
  }, [session?.access_token, workspace?.id]);
  const adapter = useMemo(() => createHermesAdapter({ workspaceId: workspace?.id ?? "", conversationId, token: session?.access_token ?? "" }), [conversationId, session?.access_token, workspace?.id]);
  const runtime = useLocalRuntime(adapter);
  const hermes = status?.services.find((service) => service.name === "Hermes Orchestrator");
  const ready = hermes?.state === "online";

  return <AssistantRuntimeProvider runtime={runtime}>
    <div className="mx-auto grid min-h-[calc(100dvh-7rem)] max-w-[1500px] gap-5 pb-10 xl:grid-cols-[minmax(0,1fr)_19rem]">
      <section className="flex min-h-[620px] min-w-0 flex-col overflow-hidden rounded-3xl border border-border-subtle bg-[#080d18] shadow-panel">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-accent-cyan/30 bg-accent-cyan/10 text-accent-cyan"><Sparkles className="h-5 w-5" /></div><div><h1 className="text-lg font-semibold text-white">Personal Assistant</h1><p className="text-xs text-text-muted">A direct, workspace-scoped Hermes conversation.</p></div></div>
          <Badge tone={loading ? "neutral" : ready ? "success" : "warning"}><span className={`h-1.5 w-1.5 rounded-full ${ready ? "bg-status-success" : "bg-status-warning"}`} />{loading ? "Checking" : ready ? "Hermes ready" : "Connection required"}</Badge>
        </header>
        <ThreadPrimitive.Root className="flex min-h-0 flex-1 flex-col">
          <ThreadPrimitive.Viewport className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-8">
            <ThreadPrimitive.Empty><div className="mx-auto flex h-full max-w-md flex-col items-center justify-center text-center"><div className="flex h-14 w-14 items-center justify-center rounded-3xl border border-accent-purple/30 bg-accent-purple/10 text-accent-purple"><Bot className="h-7 w-7" /></div><h2 className="mt-5 text-xl font-semibold text-white">Your workspace assistant</h2><p className="mt-2 text-sm leading-6 text-text-muted">Ask about your projects, agents, or workflows after connecting a real workspace conversation.</p></div></ThreadPrimitive.Empty>
            <ThreadPrimitive.Messages components={{ UserMessage, AssistantMessage }} />
          </ThreadPrimitive.Viewport>
          <ComposerPrimitive.Root className="m-4 flex items-end gap-2 rounded-2xl border border-border-subtle bg-bg-surface-2 p-2 focus-within:border-accent-cyan/50 sm:m-6">
            <ComposerPrimitive.Input aria-label="Message VEYAAN assistant" placeholder="Ask VEYAAN anything about this workspace…" className="min-h-11 flex-1 resize-none bg-transparent px-3 py-3 text-sm text-white outline-none placeholder:text-text-muted" />
            <ComposerPrimitive.Send aria-label="Send message" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-cyan text-bg-app transition-colors hover:bg-cyan-200 disabled:opacity-40"><Send className="h-4 w-4" /></ComposerPrimitive.Send>
          </ComposerPrimitive.Root>
        </ThreadPrimitive.Root>
      </section>

      <aside className="space-y-4">
        <Card className="p-5"><div className="flex items-center gap-2 text-sm font-semibold text-white"><LockKeyhole className="h-4 w-4 text-accent-cyan" />Secure connection</div><p className="mt-2 text-xs leading-5 text-text-muted">Supabase supplies the session token automatically. It is sent only through the authenticated dashboard proxy.</p><div className="mt-4 space-y-2 text-xs"><div className="flex justify-between gap-3"><span className="text-text-muted">User</span><span className="truncate text-text-secondary">{user?.email ?? "Not signed in"}</span></div><div className="flex justify-between gap-3"><span className="text-text-muted">Workspace</span><span className="truncate text-text-secondary">{workspace?.name ?? "Not selected"}</span></div><div className="flex justify-between gap-3"><span className="text-text-muted">Conversation</span><span className="truncate text-text-secondary">{conversationId ? "Ready" : "Waiting"}</span></div></div>{conversationError && <p className="mt-4 rounded-xl border border-status-danger/30 bg-status-danger/10 p-3 text-xs leading-5 text-status-danger">{conversationError}</p>}</Card>
        <Card className="p-5"><div className="flex items-center gap-2 text-sm font-semibold text-white"><WifiOff className="h-4 w-4 text-status-warning" />Runtime truth</div><p className="mt-2 text-xs leading-5 text-text-muted">{ready ? "Hermes is ready. Workspace authorization still controls conversation access." : "Hermes is live or unavailable, but not ready for an authenticated conversation."}</p><div className="mt-4 space-y-2">{status?.services.map((service) => <div key={service.name} className="flex items-center justify-between text-xs"><span className="text-text-secondary">{service.name}</span><span className={service.state === "online" ? "text-status-success" : "text-status-warning"}>{service.state}</span></div>)}</div></Card>
      </aside>
    </div>
  </AssistantRuntimeProvider>;
}
