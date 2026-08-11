"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole } from "lucide-react";
import { useConversations } from "@/components/assistant/runtime/ConversationProvider";

/**
 * The app's index has no chat of its own - it picks the most recently
 * updated real conversation (or starts one) and hands off to its real
 * URL at /c/[conversationId], which is what actually renders the thread
 * and is the one that survives a refresh or a bookmark.
 */
export default function ChatHomePage() {
  const router = useRouter();
  const { conversations, loading, createConversation } = useConversations();

  useEffect(() => {
    if (loading) return;
    if (conversations.length > 0) {
      router.replace(`/c/${conversations[0]!.id}`);
      return;
    }
    void createConversation();
  }, [conversations, loading, createConversation, router]);

  return (
    <div className="flex h-full min-h-0 flex-col items-center justify-center gap-3 px-6 text-center">
      <LockKeyhole className="size-6 text-foreground/30" />
      <p className="text-sm text-foreground/55">{loading ? "Starting a conversation..." : "Sign in and select a workspace to start a real VEYAAN conversation."}</p>
    </div>
  );
}
