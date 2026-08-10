"use client";

import { type FC, useState } from "react";
import {
  ActionBarMorePrimitive,
  ActionBarPrimitive,
  AuiIf,
  BranchPickerPrimitive,
  ComposerPrimitive,
  ErrorPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
  useAui,
  useAuiState,
} from "@assistant-ui/react";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CopyIcon,
  DownloadIcon,
  EllipsisIcon,
  PencilIcon,
  PlusIcon,
  RefreshCwIcon,
  SquareIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MarkdownText } from "@/components/assistant-ui/markdown-text";
import { TooltipIconButton } from "@/components/assistant-ui/tooltip-icon-button";
import {
  EmptyState,
  EmptyStateGreeting,
  EmptyStateSuggestion,
  EmptyStateSuggestions,
} from "@/components/elements/empty-state";
import { ThinkingIndicator } from "@/components/elements/thinking-indicator";
import { ErrorState as ErrorStateCard } from "@/components/elements/error-state";
import { field, floating, ghostButton, iconSwap, iconSwapIn, inkButton, mono, paper } from "@/components/elements/surfaces";

const STARTER_PROMPTS = [
  "What can you help me with?",
  "Summarize this workspace's active projects",
  "What agents are available here?",
  "What can Hermes actually do right now?",
];

/**
 * The real, wired thread: composer, message list, streaming, edit,
 * branching, and copy/regenerate all bound to the live assistant-ui
 * runtime (see runtime/hermes-adapter.ts for what actually produces the
 * data). Elements from src/components/elements/ supply the visual pieces;
 * this file is the only place those pieces and @assistant-ui/react hooks
 * meet, so the Elements themselves stay untouched and safe to re-install.
 *
 * Tool-call/reasoning rendering is intentionally not handled here yet -
 * Hermes emits plain text only today, and the ToolCall/ReasoningPanel
 * elements that would render richer content arrive in a later phase.
 */
export const Thread: FC = () => {
  return (
    <ThreadPrimitive.Root className="flex h-full flex-col">
      <ThreadPrimitive.Viewport className="relative flex flex-1 flex-col overflow-y-auto scroll-smooth px-4">
        <AuiIf condition={(s) => s.thread.messages.length === 0}>
          <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-7 py-10">
            <EmptyState>
              <EmptyStateGreeting>How can I help you today?</EmptyStateGreeting>
              <Composer />
              <EmptyStateSuggestions>
                {STARTER_PROMPTS.map((prompt, index) => (
                  <StarterPrompt key={prompt} prompt={prompt} index={index} />
                ))}
              </EmptyStateSuggestions>
            </EmptyState>
          </div>
        </AuiIf>

        <AuiIf condition={(s) => s.thread.messages.length > 0}>
          <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col pt-6">
            <div className="mb-6 flex flex-col gap-y-6">
              <ThreadPrimitive.Messages>
                {() => <ThreadMessage />}
              </ThreadPrimitive.Messages>
            </div>

            <div className="sticky bottom-0 mt-auto flex flex-col items-center gap-3 bg-background pb-4">
              <ThreadScrollToBottom />
              <Composer />
            </div>
          </div>
        </AuiIf>
      </ThreadPrimitive.Viewport>
    </ThreadPrimitive.Root>
  );
};

const StarterPrompt: FC<{ prompt: string; index: number }> = ({ prompt, index }) => {
  const aui = useAui();
  return (
    <EmptyStateSuggestion
      index={index}
      onClick={() => {
        aui.composer.setText(prompt);
        aui.composer.send();
      }}
    >
      {prompt}
    </EmptyStateSuggestion>
  );
};

const ThreadScrollToBottom: FC = () => {
  return (
    <ThreadPrimitive.ScrollToBottom asChild>
      <button
        type="button"
        aria-label="Scroll to bottom"
        className={cn(
          floating,
          "flex items-center gap-1.5 self-center rounded-full px-3.5 py-1.5 text-xs transition-transform duration-200 hover:-translate-y-px disabled:pointer-events-none disabled:opacity-0",
        )}
      >
        <ArrowDownIcon className="size-3 opacity-60" />
        New messages
      </button>
    </ThreadPrimitive.ScrollToBottom>
  );
};

const ThreadMessage: FC = () => {
  const role = useAuiState((s) => s.message.role);
  const isEditing = useAuiState((s) => s.message.composer.isEditing);

  if (isEditing) return <EditComposer />;
  if (role === "user") return <UserMessage />;
  return <AssistantMessage />;
};

const UserMessage: FC = () => {
  return (
    <MessagePrimitive.Root className="group/message flex w-full flex-col items-end gap-1">
      <div className={cn(field, "max-w-[85%] rounded-2xl px-4 py-2 text-sm")}>
        <MessagePrimitive.Content />
      </div>
      <div className="flex items-center gap-1 opacity-0 transition-opacity group-focus-within/message:opacity-100 group-hover/message:opacity-100">
        <ActionBarPrimitive.Root hideWhenRunning autohide="not-last">
          <ActionBarPrimitive.Edit asChild>
            <TooltipIconButton tooltip="Edit" className={cn(ghostButton, "size-7")}>
              <PencilIcon className="size-3.5" />
            </TooltipIconButton>
          </ActionBarPrimitive.Edit>
        </ActionBarPrimitive.Root>
        <MessageBranchPicker />
      </div>
    </MessagePrimitive.Root>
  );
};

const EditComposer: FC = () => {
  return (
    <MessagePrimitive.Root className="flex w-full flex-col items-end">
      <ComposerPrimitive.Root className={cn(paper, "flex w-full max-w-[85%] flex-col gap-3 rounded-[20px] p-3.5")}>
        <ComposerPrimitive.Input
          className={cn(field, "resize-none rounded-xl px-3 py-2.5 text-[13.5px] leading-relaxed text-foreground/90 outline-none focus-visible:ring-2 focus-visible:ring-foreground/20")}
          rows={2}
          autoFocus
          aria-label="Edit your message"
        />
        <div className="flex items-center justify-end gap-2">
          <ComposerPrimitive.Cancel asChild>
            <button
              type="button"
              className="h-8 rounded-full px-3.5 text-xs font-medium text-foreground/55 transition-[background-color,color,scale] duration-150 hover:bg-foreground/[0.06] hover:text-foreground/90 active:scale-[0.96]"
            >
              Cancel
            </button>
          </ComposerPrimitive.Cancel>
          <ComposerPrimitive.Send asChild>
            <button type="button" className={cn(inkButton, "flex h-8 items-center rounded-full px-3.5 text-xs font-medium")}>
              Send
            </button>
          </ComposerPrimitive.Send>
        </div>
      </ComposerPrimitive.Root>
    </MessagePrimitive.Root>
  );
};

const AssistantMessage: FC = () => {
  const isEmptyRunning = useAuiState((s) => {
    if (s.message.role !== "assistant" || s.message.status?.type !== "running") return false;
    const text = s.message.content
      .filter((part): part is { type: "text"; text: string } => part.type === "text")
      .map((part) => part.text)
      .join("");
    return text.length === 0;
  });

  return (
    <MessagePrimitive.Root className="group/message flex w-full flex-col gap-1.5">
      <div className="text-sm leading-relaxed text-foreground">
        {isEmptyRunning ? (
          <ThinkingIndicator label="Thinking" />
        ) : (
          <MessagePrimitive.Content components={{ Text: MarkdownText }} />
        )}
        <MessagePrimitive.Error>
          <ErrorPrimitive.Root asChild>
            <div>
              <ErrorStateCard
                title="This response failed"
                detail=""
                retrying={false}
                onRetry={() => {}}
              />
              <span className="sr-only"><ErrorPrimitive.Message /></span>
            </div>
          </ErrorPrimitive.Root>
        </MessagePrimitive.Error>
      </div>
      <div className="flex items-center gap-1 opacity-0 transition-opacity group-focus-within/message:opacity-100 group-hover/message:opacity-100">
        <AssistantActionBar />
        <MessageBranchPicker />
      </div>
    </MessagePrimitive.Root>
  );
};

const AssistantActionBar: FC = () => {
  const [reaction, setReaction] = useState<"up" | "down" | null>(null);
  const buttonClassName = cn(ghostButton, "size-7");

  return (
    <ActionBarPrimitive.Root hideWhenRunning autohide="not-last" className="flex items-center gap-1">
      <ActionBarPrimitive.Copy asChild>
        <button type="button" aria-label="Copy response" className={cn(buttonClassName, "grid place-items-center")}>
          <AuiIf condition={(s) => !s.message.isCopied}>
            <CopyIcon className={cn(iconSwap, "size-3.5", iconSwapIn)} />
          </AuiIf>
          <AuiIf condition={(s) => s.message.isCopied}>
            <CheckIcon className={cn(iconSwap, "size-3.5", iconSwapIn)} />
          </AuiIf>
        </button>
      </ActionBarPrimitive.Copy>
      <button
        type="button"
        aria-label="Mark response helpful"
        aria-pressed={reaction === "up"}
        onClick={() => setReaction((current) => (current === "up" ? null : "up"))}
        className={cn(buttonClassName, reaction === "up" && "bg-foreground/[0.06] text-foreground/90")}
      >
        <ThumbsUpIcon className="size-3.5" />
      </button>
      <button
        type="button"
        aria-label="Mark response unhelpful"
        aria-pressed={reaction === "down"}
        onClick={() => setReaction((current) => (current === "down" ? null : "down"))}
        className={cn(buttonClassName, reaction === "down" && "bg-foreground/[0.06] text-foreground/90")}
      >
        <ThumbsDownIcon className="size-3.5" />
      </button>
      <ActionBarPrimitive.Reload asChild>
        <button type="button" aria-label="Regenerate response" className={buttonClassName}>
          <RefreshCwIcon className="size-3.5" />
        </button>
      </ActionBarPrimitive.Reload>
      <ActionBarMorePrimitive.Root>
        <ActionBarMorePrimitive.Trigger asChild>
          <button type="button" aria-label="More response actions" className={buttonClassName}>
            <EllipsisIcon className="size-3.5" />
          </button>
        </ActionBarMorePrimitive.Trigger>
        <ActionBarMorePrimitive.Content
          side="bottom"
          align="start"
          sideOffset={6}
          className={cn(floating, "z-50 min-w-[9rem] overflow-hidden rounded-xl p-1.5")}
        >
          <ActionBarPrimitive.ExportMarkdown asChild>
            <ActionBarMorePrimitive.Item className={cn(field, "flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm outline-none")}>
              <DownloadIcon className="size-4" />
              Export as Markdown
            </ActionBarMorePrimitive.Item>
          </ActionBarPrimitive.ExportMarkdown>
        </ActionBarMorePrimitive.Content>
      </ActionBarMorePrimitive.Root>
    </ActionBarPrimitive.Root>
  );
};

const MessageBranchPicker: FC = () => {
  return (
    <BranchPickerPrimitive.Root hideWhenSingleBranch className="inline-flex items-center gap-0.5 text-foreground/45">
      <BranchPickerPrimitive.Previous asChild>
        <button type="button" aria-label="Previous version" className={cn(ghostButton, "size-6")}>
          <ChevronLeftIcon className="size-3.5" />
        </button>
      </BranchPickerPrimitive.Previous>
      <span className={cn(mono, "tabular-nums")}>
        <BranchPickerPrimitive.Number /> / <BranchPickerPrimitive.Count />
      </span>
      <BranchPickerPrimitive.Next asChild>
        <button type="button" aria-label="Next version" className={cn(ghostButton, "size-6")}>
          <ChevronRightIcon className="size-3.5" />
        </button>
      </BranchPickerPrimitive.Next>
    </BranchPickerPrimitive.Root>
  );
};

/**
 * Real composer bound to ComposerPrimitive. File attachments are
 * deliberately not wired: Hermes's message endpoint accepts only
 * {content: string} today, and there is no upload path anywhere in the
 * platform that a browser can reach - a picker that appeared to work
 * would silently drop whatever was attached. The attach button stays
 * visible (it's part of the composer's visual language) but disabled,
 * matching the honest state rather than faking support.
 */
const Composer: FC = () => {
  return (
    <ComposerPrimitive.Root className="relative w-full max-w-3xl">
      <div className={cn(paper, "flex w-full flex-col gap-2 rounded-[24px] p-2.5")}>
        <ComposerPrimitive.Input
          placeholder="Message VEYAAN..."
          className="placeholder:text-foreground/35 min-h-11 max-h-48 w-full resize-none bg-transparent px-3 py-2 text-[15px] outline-none"
          rows={1}
          autoFocus
          aria-label="Message input"
        />
        <div className="flex items-center justify-between px-0.5">
          <button
            type="button"
            aria-label="Add attachment"
            disabled
            className={cn(ghostButton, "size-8 disabled:pointer-events-none disabled:opacity-30")}
            title="File attachments aren't supported by Hermes yet"
          >
            <PlusIcon className="size-4" />
          </button>
          <ComposerAction />
        </div>
      </div>
    </ComposerPrimitive.Root>
  );
};

const ComposerAction: FC = () => {
  return (
    <div className="flex items-center gap-1.5">
      <AuiIf condition={(s) => !s.thread.isRunning}>
        <ComposerPrimitive.Send asChild>
          <button
            type="button"
            aria-label="Send message"
            className={cn(
              "grid size-8 place-items-center rounded-full transition-colors",
              inkButton,
            )}
          >
            <ArrowUpIcon className="size-4" />
          </button>
        </ComposerPrimitive.Send>
      </AuiIf>
      <AuiIf condition={(s) => s.thread.isRunning}>
        <ComposerPrimitive.Cancel asChild>
          <button type="button" aria-label="Stop generating" className={cn(inkButton, "grid size-8 place-items-center rounded-full")}>
            <SquareIcon className="size-3 fill-current" />
          </button>
        </ComposerPrimitive.Cancel>
      </AuiIf>
    </div>
  );
};
