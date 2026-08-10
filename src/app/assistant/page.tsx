"use client";

import { LockKeyhole } from "lucide-react";
import { Thread } from "@/components/assistant/bindings/Thread";
import { ThreadSidebar } from "@/components/assistant/bindings/ThreadSidebar";
import { HermesRuntimeProvider } from "@/components/assistant/runtime/HermesRuntimeProvider";
import { useHermesConversations } from "@/components/assistant/runtime/hermes-conversations";
import { useRuntimeStatus } from "@/lib/api/runtime";
import { cn } from "@/lib/utils";
import { mono } from "@/components/elements/surfaces";

export default function PersonalAssistantPage() {
  const { status, loading: statusLoading } = useRuntimeStatus();
  const conversations = useHermesConversations();
  const hermes = status?.services.find((service) => service.name === "Hermes Orchestrator");
  const ready = hermes?.state === "online";
  const activeConversation = conversations.conversations[conversations.activeIndex] ?? null;

  return (
    <div className="flex h-[calc(100dvh-2rem)] gap-6">
      <aside className="hidden shrink-0 flex-col gap-4 lg:flex">
        <ThreadSidebar
          conversations={conversations.conversations}
          activeIndex={conversations.activeIndex}
          loading={conversations.loading}
          error={conversations.error}
          onSelect={conversations.selectByIndex}
          onCreate={() => void conversations.createConversation()}
        />
        <div className={cn(mono, "flex items-center gap-2 px-3 text-foreground/35")}>
          <span className={cn("size-1.5 rounded-full", statusLoading ? "bg-foreground/30" : ready ? "bg-foreground" : "bg-destructive")} />
          {statusLoading ? "Checking Hermes" : ready ? "Hermes ready" : "Hermes unreachable"}
        </div>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-3xl border border-border">
        {!conversations.activeId ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <LockKeyhole className="size-6 text-foreground/30" />
            <p className="text-sm text-foreground/55">
              {conversations.loading ? "Starting a conversation..." : "Sign in and select a workspace to start a real Hermes conversation."}
            </p>
          </div>
        ) : (
          <HermesRuntimeProvider conversation={activeConversation}>
            <Thread />
          </HermesRuntimeProvider>
        )}
      </section>
    </div>
  );
}
