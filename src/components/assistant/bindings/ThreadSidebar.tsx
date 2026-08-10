"use client";

import { type FC } from "react";
import { PlusIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThreadList, type ThreadItem } from "@/components/elements/thread-list";
import { ghostButton, inkButton, mono } from "@/components/elements/surfaces";
import type { HermesConversation } from "@/components/assistant/runtime/hermes-conversations";

interface ThreadSidebarProps {
  conversations: HermesConversation[];
  activeIndex: number;
  loading: boolean;
  error: string | null;
  onSelect: (index: number) => void;
  onCreate: () => void;
}

/**
 * Real conversation switcher over Hermes's conversations list/create
 * endpoints (see runtime/hermes-conversations.ts). ThreadItem has no id -
 * ThreadList is index-based - so BoundThreadSidebar is the layer that
 * keeps `conversations[i].id` aligned with the index the Element hands
 * back on click. `time` is intentionally blank: ConversationResponse
 * carries no created_at/updated_at yet, and inventing one would be
 * dishonest.
 */
export const ThreadSidebar: FC<ThreadSidebarProps> = ({ conversations, activeIndex, loading, error, onSelect, onCreate }) => {
  const items: ThreadItem[] = conversations.map((conversation) => ({
    title: conversation.title?.trim() || "New chat",
    time: "",
  }));

  return (
    <div className="flex w-full max-w-[240px] flex-col gap-3">
      <button
        type="button"
        onClick={onCreate}
        className={cn(inkButton, "flex h-9 items-center justify-center gap-2 rounded-xl text-[13px] font-medium")}
      >
        <PlusIcon className="size-3.5" />
        New chat
      </button>

      {loading && conversations.length === 0 && (
        <p className={cn(mono, "px-3 text-foreground/35")}>Loading...</p>
      )}
      {error && (
        <p className="px-3 text-[12px] leading-snug text-destructive/80">{error}</p>
      )}

      {items.length > 0 && (
        <ThreadList
          threads={items}
          activeIndex={activeIndex}
          onActiveIndexChange={onSelect}
        />
      )}
    </div>
  );
};

export const ThreadSidebarSkeleton: FC = () => (
  <div className={cn(ghostButton, "h-9 w-full max-w-[240px] animate-pulse rounded-xl")} />
);
