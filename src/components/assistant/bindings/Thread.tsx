"use client";

import { type FC, useEffect, useMemo, useRef, useState } from "react";
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
  useMessageTiming,
  type ToolCallMessagePartProps,
} from "@assistant-ui/react";
import {
  ArrowDownIcon,
  BrainIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CopyIcon,
  DownloadIcon,
  EllipsisIcon,
  ListChecksIcon,
  PencilIcon,
  RefreshCwIcon,
  SettingsIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
} from "lucide-react";
import Link from "next/link";
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
import { ToolCall } from "@/components/elements/tool-call";
import { StoppedRun } from "@/components/elements/stopped-run";
import { MessageQueue } from "@/components/elements/message-queue";
import { MessageTiming } from "@/components/elements/message-timing";
import { CostMeter } from "@/components/elements/cost-meter";
import { AgentPlan } from "@/components/elements/agent-plan";
import { TodoList } from "@/components/elements/todo-list";
import { ReasoningEffort } from "@/components/elements/reasoning-effort";
import {
  ComposerActions,
  ComposerAttachButton,
  ComposerBar,
  ComposerCommandItem,
  ComposerContext,
  ComposerMenu,
  ComposerMenuItem,
  ComposerModelTrigger,
  ComposerPersonItem,
  ComposerSend,
  ComposerToolbar,
  ComposerVoiceButton,
  useMentionMatches,
  useSlashMatches,
  type ComposerPerson,
} from "@/components/elements/composer";
import { field, floating, ghostButton, iconSwap, iconSwapIn, inkButton, mono, paper } from "@/components/elements/surfaces";
import { useHermesModels } from "@/components/assistant/runtime/hermes-models";
import { useHermesToolsets } from "@/components/assistant/runtime/hermes-toolsets";
import { useReasoningModels } from "@/components/assistant/runtime/hermes-reasoning-models";
import { useProviders } from "@/components/assistant/runtime/hermes-providers";
import { useActiveAgent } from "@/components/assistant/runtime/ActiveAgentContext";
import { useConversations } from "@/components/assistant/runtime/ConversationProvider";
import { useWorkspaceCollection } from "@/lib/workspace/useWorkspaceCollection";
import { ProviderLogo } from "@/components/assistant/provider-logos";
import { computeTurnCost, formatInr, useUsdToInr } from "@/components/assistant/runtime/hermes-cost";
import { useContextUsage } from "@/components/assistant/runtime/context-usage";
import { SLASH_COMMANDS, type SlashCommand } from "@/components/assistant/bindings/slash-commands";
import type { HermesPlan, HermesRoute, HermesUsage } from "@/components/assistant/runtime/hermes-adapter";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useWorkspace } from "@/lib/workspace/WorkspaceProvider";

const STARTER_PROMPTS = [
  "What can you help me with?",
  "Summarize this workspace's active projects",
  "What agents are available here?",
  "What can Hermes actually do right now?",
];

/**
 * Hermes identifies tools by their raw name (web_search, browser_click,
 * terminal, ...) with no separate human-readable verb - the ToolCall
 * element wants a present/past-tense pair (activeLabel/label). Covers the
 * toolsets most likely to actually fire (web, browser, terminal, file,
 * code_execution, memory, todo, delegation, cronjob); anything unlisted
 * falls back to a humanized version of the raw name rather than needing
 * an entry for all ~56 real Hermes tools up front.
 */
const TOOL_VERBS: Record<string, { active: string; done: string }> = {
  web_search: { active: "Searching the web", done: "Searched the web" },
  web_extract: { active: "Reading a page", done: "Read a page" },
  browser_navigate: { active: "Opening a page", done: "Opened a page" },
  browser_click: { active: "Clicking", done: "Clicked" },
  browser_type: { active: "Typing", done: "Typed" },
  browser_snapshot: { active: "Looking at the page", done: "Looked at the page" },
  terminal: { active: "Running a command", done: "Ran a command" },
  file_read: { active: "Reading a file", done: "Read a file" },
  file_write: { active: "Writing a file", done: "Wrote a file" },
  code_execution: { active: "Running code", done: "Ran code" },
  image_gen: { active: "Generating an image", done: "Generated an image" },
  memory: { active: "Checking memory", done: "Checked memory" },
  todo: { active: "Updating the plan", done: "Updated the plan" },
  // Real registered tool name is "delegate_task" (hermes-agent's
  // tools/delegate_tool.py, emoji="🔀" already sent through in args.emoji)
  // - "delegation" never matched, so this always fell through to the
  // generic humanized-name fallback instead of a real verb pair.
  delegate_task: { active: "Delegating to a subagent", done: "Delegated to a subagent" },
  cronjob: { active: "Scheduling a job", done: "Scheduled a job" },
};

function humanizeToolName(toolName: string): { active: string; done: string } {
  const known = TOOL_VERBS[toolName];
  if (known) return known;
  const words = toolName.replace(/[_-]+/g, " ").trim();
  const label = words ? words.charAt(0).toUpperCase() + words.slice(1) : "Tool";
  return { active: label, done: label };
}

const BoundToolCall: FC<ToolCallMessagePartProps> = (part) => {
  const [open, setOpen] = useState(false);
  const running = !part.status || part.status.type === "running";
  // hermes-adapter.ts's buildToolParts() defaults argsText to the raw
  // tool name when Hermes sent no label - so this equality is the real
  // signal for "did Hermes actually give us a label" vs. "fall back to
  // our guessed verb table." Real labels only arrive on the "running"
  // frame per tool call (no separate past-tense version), so the same
  // string covers both label/activeLabel when present.
  const hasRealLabel = part.argsText !== part.toolName;
  const verbs = humanizeToolName(part.toolName);
  const emoji: string | undefined = part.args?.emoji;
  const prefix = emoji ? `${emoji} ` : "";
  const doneLabel = hasRealLabel ? part.argsText : verbs.done;
  const activeLabel = hasRealLabel ? part.argsText : verbs.active;
  const resultText = part.isError
    ? "Failed"
    : typeof part.result === "string"
      ? part.result
      : running
        ? ""
        : "Done";

  return (
    <ToolCall
      label={`${prefix}${doneLabel}`}
      activeLabel={`${prefix}${activeLabel}`}
      query={part.argsText}
      request={part.argsText || "(no arguments captured)"}
      result={resultText}
      running={running}
      open={open}
      onOpenChange={setOpen}
    />
  );
};

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
              <QueuePanel />
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

/**
 * Shows messages typed while a run is in flight (unstable_
 * enableMessageQueue: true, set in HermesRuntimeProvider.tsx) instead of
 * blocking the composer or discarding them. Real assistant-ui queue
 * state/methods (composer.queue, composer.queueItem(id).remove()) - no
 * backend involved.
 */
const QueuePanel: FC = () => {
  const aui = useAui();
  const queue = useAuiState((s) => s.composer.queue);
  const isRunning = useAuiState((s) => s.thread.isRunning);
  const runningText = useAuiState((s) => {
    const last = [...s.thread.messages].reverse().find((m) => m.role === "user");
    if (!last || !Array.isArray(last.content)) return "";
    return last.content
      .filter((part): part is { type: "text"; text: string } => part.type === "text")
      .map((part) => part.text)
      .join(" ");
  });

  if (!isRunning || queue.length === 0) return null;

  return (
    <MessageQueue
      running={runningText}
      queued={queue.map((item) => ({ id: item.id, text: item.prompt }))}
      onCancel={(id) => aui.composer.queueItem({ id }).remove()}
    />
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

/**
 * Real per-response provider/model/time/cost, not decoration - built from
 * the real assistant.route + assistant.usage SSE events (hermes-adapter.ts)
 * or, for history loaded after a refresh, the same real model_used/
 * tokens_used a completed turn was persisted with (hermes-history-
 * adapter.ts). Renders nothing until real route data exists - no
 * placeholder skeleton, matching this app's "don't fake it" rule.
 */
const ResponseMeta: FC = () => {
  const { models } = useHermesModels();
  const { providers } = useProviders();
  const { rate: usdToInr } = useUsdToInr();
  const timing = useMessageTiming();
  const streaming = useAuiState((s) => s.message.status?.type === "running");
  const custom = useAuiState((s) =>
    s.message.role === "assistant"
      ? (s.message.metadata.custom as { usage?: HermesUsage; route?: HermesRoute } | undefined)
      : undefined,
  );
  // Same value for every message in an agent-scoped conversation (it's a
  // conversation-level fact, not a per-message one) - shown per-message
  // anyway alongside model/cost so it's visible without scrolling back up
  // to the ActiveAgentBanner at the top of the thread.
  const { displayName: agentName } = useActiveAgent();

  if (!custom?.route) return null;
  const cost = computeTurnCost(custom.route, custom.usage, models, usdToInr, providers);
  const costValue = cost.usdCost === 0 ? "Free" : cost.inrCost !== null ? formatInr(cost.inrCost) : "—";

  const stats = [
    ...(agentName ? [{ label: "agent", value: agentName }] : []),
    { label: "via", value: cost.provider },
    ...(cost.modelLabel !== "—" ? [{ label: "model", value: cost.modelLabel }] : []),
    ...(timing?.totalStreamTime ? [{ label: "time", value: `${(timing.totalStreamTime / 1000).toFixed(1)}s` }] : []),
    ...(timing?.tokensPerSecond ? [{ label: "speed", value: `${timing.tokensPerSecond.toFixed(0)} tok/s` }] : []),
    ...(custom.usage
      ? [
          {
            label: "in",
            value: `${((custom.usage.promptTokens ?? 0) / 1000).toFixed(1)}k`,
          },
          {
            label: "out",
            value: `${((custom.usage.completionTokens ?? 0) / 1000).toFixed(1)}k`,
          },
        ]
      : []),
    { label: "cost", value: costValue },
  ];

  return <MessageTiming stats={stats} streaming={streaming} />;
};

/**
 * Real plan-mode progress, not decorative - built from the
 * assistant.plan.updated SSE events hermes-adapter.ts already threads into
 * metadata.custom.plan (live) or the completed turn's persisted meta.plan
 * (history, hermes-history-adapter.ts). Renders nothing for a normal
 * message (no plan data at all). Before any step starts (every item still
 * "pending"), shows the plan as a preview via AgentPlan; once execution
 * begins, switches to TodoList for live per-step progress - the two
 * elements cover the same underlying data, just at different moments
 * (preview vs. live), so only one renders at a time rather than showing
 * both redundantly.
 */
const PlanDisplay: FC = () => {
  const plan = useAuiState((s) =>
    s.message.role === "assistant"
      ? (s.message.metadata.custom as { plan?: HermesPlan } | undefined)?.plan
      : undefined,
  );

  if (!plan || plan.items.length === 0) return null;
  const started = plan.items.some((item) => item.status !== "pending");
  if (!started) {
    return <AgentPlan steps={plan.items.map((item) => item.text)} activeIndex={-1} className="mb-1" />;
  }
  return <TodoList items={plan.items} revision={plan.revision} className="mb-1" />;
};

const AssistantMessage: FC = () => {
  const [dismissed, setDismissed] = useState(false);
  const isEmptyRunning = useAuiState((s) => {
    if (s.message.role !== "assistant" || s.message.status?.type !== "running") return false;
    const text = s.message.content
      .filter((part): part is { type: "text"; text: string } => part.type === "text")
      .map((part) => part.text)
      .join("");
    return text.length === 0;
  });
  // Set by hermes-adapter.ts's abort handling (see run()'s catch block) -
  // distinguishes "the user clicked Stop" from a genuine runtime.failed,
  // which MessagePrimitive.Error/ErrorStateCard below still covers.
  const isCancelled = useAuiState(
    (s) =>
      s.message.role === "assistant" &&
      s.message.status?.type === "incomplete" &&
      s.message.status.reason === "cancelled",
  );

  return (
    <MessagePrimitive.Root className="group/message flex w-full flex-col gap-1.5">
      <div className="flex flex-col gap-2 text-sm leading-relaxed text-foreground">
        <PlanDisplay />
        {isCancelled && !dismissed ? (
          <StoppedRunBlock onDiscard={() => setDismissed(true)} />
        ) : isEmptyRunning ? (
          <ThinkingIndicator label="Thinking" />
        ) : (
          <MessagePrimitive.Content
            components={{ Text: MarkdownText, tools: { Fallback: BoundToolCall } }}
          />
        )}
        {!isCancelled && (
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
        )}
        {!isCancelled && !isEmptyRunning && <ResponseMeta />}
      </div>
      <div className="flex items-center gap-1 opacity-0 transition-opacity group-focus-within/message:opacity-100 group-hover/message:opacity-100">
        <AssistantActionBar />
        <MessageBranchPicker />
      </div>
    </MessagePrimitive.Root>
  );
};

/**
 * Real "Continue" - sends a genuine follow-up user message asking Hermes
 * to pick the reply back up (Hermes holds conversation state server-side
 * by conversationId, so this works exactly like any other turn). "Discard"
 * is a local-only dismiss: there is no partial-response-discard concept on
 * the backend, so this just stops showing the stopped-run chrome for this
 * message and reveals the partial text underneath, rather than pretending
 * to delete anything server-side.
 */
const StoppedRunBlock: FC<{ onDiscard: () => void }> = ({ onDiscard }) => {
  const aui = useAui();
  // Selector must return a stable primitive, not a freshly-built array -
  // useAuiState compares snapshots with Object.is, and a new array
  // identity on every read causes React's "maximum update depth
  // exceeded" (the external-store subscription never settles). Splitting
  // into words happens after the selector, in plain render.
  const text = useAuiState((s) => {
    if (s.message.role !== "assistant") return "";
    return s.message.content
      .filter((part): part is { type: "text"; text: string } => part.type === "text")
      .map((part) => part.text)
      .join("");
  });
  const words = text.split(" ").filter(Boolean);

  return (
    <StoppedRun
      words={words}
      reason="Stopped"
      onContinue={() => {
        aui.composer.setText("Please continue from where you left off.");
        aui.composer.send();
      }}
      onDiscard={onDiscard}
    />
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
 * Real composer bound to ComposerPrimitive, built from the real
 * elements/composer.tsx pieces (ComposerBar/ComposerModelTrigger/
 * ComposerVoiceButton/ComposerSend - the ChatGPT-shaped composer the
 * Elements library actually ships) instead of one-off hand-rolled
 * buttons. File attachments are deliberately not wired: Hermes's message
 * endpoint accepts only {content: string} today, and there is no upload
 * path anywhere in the platform that a browser can reach - a picker that
 * appeared to work would silently drop whatever was attached. The attach
 * button stays visible (it's part of the composer's visual language) but
 * disabled, matching the honest state rather than faking support.
 *
 * Slash commands are client-side text macros (see bindings/slash-commands.ts) -
 * selecting one prefills the composer via the same aui.composer.setText()
 * StarterPrompt already uses, it doesn't auto-send. The custom onKeyDown on
 * ComposerPrimitive.Input only intercepts Arrow/Enter while the menu is open
 * (preventDefault there skips assistant-ui's own Enter-to-send handler,
 * confirmed via its composeEventHandlers wiring); every other key, or once
 * the menu has no matches, falls through untouched. `/plan` is the one
 * command that also flips real plan mode (see PlanToggleButton) - every
 * other command is text-only.
 *
 * @mentions pick a real agent definition (real records from
 * useWorkspaceCollection("agent-definitions"), not a fixture) using the
 * same useMentionMatches/ComposerPersonItem elements.tsx already shipped
 * for this - they just had no real data source wired in before. Unlike
 * slash commands, selecting a mention can't rewrite the current message:
 * Conversation.agent_definition_id is fixed at creation
 * (app/conversations/models.py), so there's no way to retroactively scope
 * an in-progress conversation to a different agent. Selecting one instead
 * starts a fresh agent-scoped conversation (same real path as the "Start
 * conversation with this agent" button on /agents/[id]) and clears the
 * composer - one agent per conversation, no parallel/collaborative
 * execution, matching the scope actually built here.
 */
const Composer: FC = () => {
  const aui = useAui();
  const value = useAuiState((s) => s.composer.text);
  const matches = useSlashMatches(value, SLASH_COMMANDS) as SlashCommand[];
  const { records: agentRecords } = useWorkspaceCollection("agent-definitions");
  const { createConversation } = useConversations();
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [switchingAgent, setSwitchingAgent] = useState(false);
  const runConfigCustom = useAuiState((s) => s.composer.runConfig.custom);

  const agentPeople: ComposerPerson[] = useMemo(
    () =>
      agentRecords
        .map((r) => String(r.display_name ?? r.name ?? ""))
        .filter(Boolean)
        .map((name) => ({ name, role: "agent" as const })),
    [agentRecords],
  );
  const mentionMatches = useMentionMatches(value, agentPeople);
  // Only one of these is ever non-empty for a given `value` - a slash
  // command match requires the whole input to start with "/", a mention
  // match requires a trailing "@word", mutually exclusive triggers.
  const matchCount = matches.length > 0 ? matches.length : mentionMatches.length;

  useEffect(() => {
    setHighlightIndex(0);
  }, [value]);

  const selectCommand = (command: SlashCommand) => {
    aui.composer.setText(command.template);
    if (command.name === "plan") {
      aui.composer.setRunConfig({ custom: { ...runConfigCustom, plan: true } });
    }
  };

  const selectAgentMention = async (person: ComposerPerson) => {
    if (switchingAgent) return;
    const record = agentRecords.find((r) => (r.display_name ?? r.name) === person.name);
    const agentId = record ? String(record.id ?? "") : "";
    if (!agentId) return;
    setSwitchingAgent(true);
    aui.composer.setText("");
    const conversationId = await createConversation(agentId);
    if (!conversationId) setSwitchingAgent(false);
    // On success, createConversation navigates to /c/[id] itself
    // (ConversationProvider.tsx) - this component unmounts, no further
    // state update needed here.
  };

  // Slash commands only ever match when the whole message starts with "/" -
  // a deliberate, unambiguous signal, safe to let Enter commit. "@" can
  // appear at the end of an otherwise ordinary sentence (and a bare
  // trailing "@" with no name yet matches every agent, since an empty
  // query "matches" everything) - hijacking Enter for that too meant any
  // message that happened to end in "@" silently started a brand new
  // agent conversation instead of sending, and repeating it (or just
  // testing what "@" does) produced a pile of stray empty conversations.
  // Mentions now only commit via click or Tab - Enter always sends.
  const runHighlightedSlash = () => {
    if (matches.length > 0) selectCommand(matches[highlightIndex] ?? matches[0]);
  };

  return (
    <ComposerPrimitive.Root className="relative w-full max-w-3xl">
      <ComposerMenu open={matches.length > 0} align="start">
        {matches.map((command, i) => (
          <ComposerCommandItem
            key={command.name}
            command={command}
            active={i === highlightIndex}
            onClick={() => selectCommand(command)}
          />
        ))}
      </ComposerMenu>
      <ComposerMenu open={matches.length === 0 && mentionMatches.length > 0} align="start">
        {mentionMatches.map((person, i) => (
          <ComposerPersonItem
            key={person.name}
            person={person}
            active={i === highlightIndex}
            onClick={() => void selectAgentMention(person)}
          />
        ))}
      </ComposerMenu>
      <ComposerBar>
        <ComposerPrimitive.Input
          placeholder="Message VEYAAN... (@ to talk to a specific agent)"
          className="placeholder:text-foreground/35 min-h-11 max-h-48 w-full resize-none bg-transparent px-3 py-2 text-[15px] outline-none"
          rows={1}
          autoFocus
          aria-label="Message input"
          onKeyDown={(event) => {
            if (matchCount === 0 || event.nativeEvent.isComposing) return;
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setHighlightIndex((i) => (i + 1) % matchCount);
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setHighlightIndex((i) => (i - 1 + matchCount) % matchCount);
            } else if (event.key === "Enter" && matches.length > 0) {
              // Slash-only - see runHighlightedSlash's comment for why
              // mentions deliberately don't intercept Enter.
              event.preventDefault();
              runHighlightedSlash();
            } else if (event.key === "Tab" && mentionMatches.length > 0) {
              event.preventDefault();
              void selectAgentMention(mentionMatches[highlightIndex] ?? mentionMatches[0]);
            }
          }}
        />
        <ComposerToolbar>
          <PluginsButton />
          <ComposerActions>
            <ModelPickerButton />
            <PlanToggleButton />
            <ReasoningEffortButton />
            <SessionCostButton />
            <ContextUsageButton />
            <DictationButton />
            <ComposerSendAction />
          </ComposerActions>
        </ComposerToolbar>
      </ComposerBar>
    </ComposerPrimitive.Root>
  );
};

const TOOLSET_STATUS_DOT: Record<"healthy" | "off" | "unavailable", string> = {
  healthy: "bg-status-healthy",
  off: "bg-status-warning",
  unavailable: "bg-foreground/20",
};

const TOOLSET_STATUS_LABEL: Record<"healthy" | "off" | "unavailable", string> = {
  healthy: "connected",
  off: "off",
  unavailable: "not configured",
};

function toolsetStatus(toolset: { enabled: boolean; configured: boolean }): "healthy" | "off" | "unavailable" {
  if (toolset.enabled) return "healthy";
  if (toolset.configured) return "off";
  return "unavailable";
}

/**
 * The real "what does Hermes have" panel, ChatGPT/Claude connectors-style,
 * opened from the composer's + button (real attachments were never
 * wireable - see the button's old disabled tooltip - so this is what that
 * button does now instead of sitting decorative). Real data only:
 * GET .../hermes/toolsets, the same real 28 toolsets Settings shows,
 * shared via useHermesToolsets so the two views can never disagree. The
 * status dot is real, live signal from Hermes itself (enabled+configured),
 * not a synthetic health check - green means Hermes can actually call it
 * right now, amber means it's configured but turned off, gray/red means
 * no real credentials exist for it yet.
 */
const PluginsButton: FC = () => {
  const { toolsets, loading, error } = useHermesToolsets();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const healthyCount = toolsets.filter((t) => t.enabled).length;

  return (
    <div ref={rootRef} className="relative">
      <ComposerAttachButton onClick={() => setOpen((v) => !v)} title="Plugins & tools" aria-label="Plugins & tools" />
      <ComposerMenu open={open} align="start" className="max-h-[28rem] w-80 overflow-y-auto">
        <div className="flex items-center justify-between px-2.5 pb-1.5 pt-1">
          <span className={cn(mono, "text-foreground/35")}>Plugins & tools</span>
          <span className={cn(mono, "text-foreground/35 tabular-nums")}>
            {loading ? "loading..." : `${healthyCount}/${toolsets.length} connected`}
          </span>
        </div>
        {error && <p className="px-2.5 py-2 text-[12.5px] leading-snug text-destructive/80">{error}</p>}
        {!error && !loading && toolsets.length === 0 && (
          <p className={cn(mono, "text-foreground/35 px-2.5 py-2")}>No toolsets available yet.</p>
        )}
        {toolsets.map((toolset) => {
          const status = toolsetStatus(toolset);
          const isExpanded = expanded === toolset.name;
          return (
            <div key={toolset.name} className="flex flex-col">
              <ComposerMenuItem active={isExpanded} onClick={() => setExpanded(isExpanded ? null : toolset.name)}>
                <span aria-hidden className={cn("size-1.5 shrink-0 rounded-full", TOOLSET_STATUS_DOT[status])} />
                <span className="flex-1 truncate text-start">{toolset.label}</span>
                <span className={cn(mono, "text-foreground/30 tabular-nums")}>{toolset.tools.length}</span>
                <ChevronDownIcon
                  className={cn("size-3 shrink-0 text-foreground/30 transition-transform", isExpanded && "rotate-180")}
                />
              </ComposerMenuItem>
              {isExpanded && (
                <div className="mb-1 flex flex-col gap-1.5 rounded-xl bg-foreground/[0.03] px-3 py-2.5 text-[12px]">
                  <p className="text-foreground/55">{toolset.description}</p>
                  <p className={cn(mono, "text-foreground/35")}>{TOOLSET_STATUS_LABEL[status]}</p>
                  <div className="flex flex-wrap gap-1">
                    {toolset.tools.map((tool) => (
                      <span key={tool} className={cn(mono, "text-foreground/45 rounded bg-foreground/[0.06] px-1.5 py-0.5")}>
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        <Link
          href="/settings"
          onClick={() => setOpen(false)}
          className="mt-1 flex items-center gap-2 rounded-[10px] border-t border-border px-2.5 pt-2.5 pb-1 text-[12.5px] text-foreground/45 transition-colors hover:text-foreground/80"
        >
          <SettingsIcon className="size-3.5" />
          Manage in Settings
        </Link>
      </ComposerMenu>
    </div>
  );
};

/**
 * Real per-message model choice, reaching the backend's session-based
 * model-lock path (see hermes-adapter.ts and the orchestrator's
 * SendMessageRequest.model) - not decorative. "Auto" (the default, no
 * selection) keeps today's fast/escalate routing unchanged. Model prices
 * and free/paid flags are Hermes's real catalog (GET .../hermes/model-
 * options), not invented.
 */
const ModelPickerButton: FC = () => {
  const aui = useAui();
  const { models, loading } = useHermesModels();
  const { providers } = useProviders();
  const { models: reasoningModels, loading: reasoningLoading } = useReasoningModels();
  const selectedId = useAuiState((s) => (s.composer.runConfig.custom?.model as string | undefined) ?? "");
  const selectedProviderId = useAuiState((s) => (s.composer.runConfig.custom?.providerId as string | undefined) ?? "");
  const selectedDirectModelId = useAuiState((s) => (s.composer.runConfig.custom?.directModel as string | undefined) ?? "");
  const selectedModel = selectedDirectModelId
    ? reasoningModels.find((m) => m.id === selectedDirectModelId)
    : selectedProviderId
      ? { name: selectedId, provider: providers.find((p) => p.id === selectedProviderId)?.name ?? "" }
      : models.find((m) => m.id === selectedId);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <ComposerModelTrigger
        model={selectedModel?.name ?? "Auto"}
        open={open}
        onClick={() => setOpen((value) => !value)}
      />
      <ComposerMenu open={open} align="start" className="max-h-96 overflow-y-auto">
        <ComposerMenuItem
          active={!selectedId && !selectedDirectModelId}
          onClick={() => {
            aui.composer.setRunConfig({ custom: {} });
            setOpen(false);
          }}
        >
          <span className="flex-1 text-start">Auto</span>
          <span className={cn(mono, "text-foreground/35")}>fast + research</span>
          {!selectedId && !selectedDirectModelId && <CheckIcon className="size-3.5" />}
        </ComposerMenuItem>
        {loading && <div className={cn(mono, "text-foreground/35 px-2.5 py-2")}>Loading models...</div>}
        {models.map((model) => (
          <ComposerMenuItem
            key={model.id}
            active={model.id === selectedId && !selectedProviderId}
            onClick={() => {
              aui.composer.setRunConfig({ custom: { model: model.id } });
              setOpen(false);
            }}
          >
            <ProviderLogo provider={model.provider} className="size-3.5 shrink-0" />
            <span className="flex-1 truncate text-start">{model.name}</span>
            <span className={cn(mono, "text-foreground/35 tabular-nums")}>
              {model.free ? "free" : model.inputPrice ?? ""}
            </span>
            {model.id === selectedId && !selectedProviderId && <CheckIcon className="size-3.5 shrink-0" />}
          </ComposerMenuItem>
        ))}
        {providers.map((provider) =>
          provider.models.map((modelId) => (
            <ComposerMenuItem
              key={`${provider.id}:${modelId}`}
              active={modelId === selectedId && provider.id === selectedProviderId}
              onClick={() => {
                aui.composer.setRunConfig({ custom: { model: modelId, providerId: provider.id } });
                setOpen(false);
              }}
            >
              <span className="flex-1 truncate text-start">{modelId}</span>
              <span className={cn(mono, "text-foreground/35 truncate")}>{provider.name}</span>
              {modelId === selectedId && provider.id === selectedProviderId && (
                <CheckIcon className="size-3.5 shrink-0" />
              )}
            </ComposerMenuItem>
          )),
        )}
        {(reasoningLoading || reasoningModels.length > 0) && (
          <div className={cn(mono, "text-foreground/25 px-2.5 pb-1 pt-2")}>direct · reasoning</div>
        )}
        {reasoningLoading && <div className={cn(mono, "text-foreground/35 px-2.5 py-2")}>Loading models...</div>}
        {reasoningModels.map((model) => (
          <ComposerMenuItem
            key={model.id}
            active={model.id === selectedDirectModelId}
            onClick={() => {
              // Reasoning effort defaults to "medium" the moment a direct
              // model is picked, rather than left unset - PlanToggleButton's
              // sibling, ReasoningEffortButton, only renders once
              // directModel is set, so there's no separate "turn on
              // reasoning" step to remember.
              aui.composer.setRunConfig({ custom: { directModel: model.id, reasoningEffort: "medium" } });
              setOpen(false);
            }}
          >
            <ProviderLogo provider={model.provider} className="size-3.5 shrink-0" />
            <span className="flex-1 truncate text-start">{model.name}</span>
            <span className={cn(mono, "text-foreground/35 tabular-nums")}>{model.inputPrice ?? ""}</span>
            {model.id === selectedDirectModelId && <CheckIcon className="size-3.5 shrink-0" />}
          </ComposerMenuItem>
        ))}
      </ComposerMenu>
    </div>
  );
};

/**
 * Real plan-then-execute toggle - sets runConfig.custom.plan, read by
 * hermes-adapter.ts and forwarded to the backend's SendMessageRequest.plan
 * (see streaming_routes.py's _run_plan_path). Preserves the currently
 * selected model/providerId across the toggle rather than clearing them -
 * turning plan mode back off should leave whatever model was picked
 * before untouched, even though plan mode itself always uses hermes-agent
 * regardless of model selection while it's on.
 */
const PlanToggleButton: FC = () => {
  const aui = useAui();
  const runConfigCustom = useAuiState((s) => s.composer.runConfig.custom);
  const active = runConfigCustom?.plan === true;

  return (
    <button
      type="button"
      aria-label="Plan mode"
      aria-pressed={active}
      title="Plan first, then execute step by step - best for complex, multi-part tasks"
      onClick={() => aui.composer.setRunConfig({ custom: { ...runConfigCustom, plan: !active } })}
      className={cn(
        "flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px] transition-colors",
        active
          ? "bg-foreground/[0.09] text-foreground"
          : "text-foreground/55 hover:bg-foreground/[0.06] hover:text-foreground/90 dark:hover:bg-foreground/[0.09]",
      )}
    >
      <ListChecksIcon className="size-3.5" />
      Plan
    </button>
  );
};

/**
 * Real running session cost in INR - derived fresh from the thread's own
 * message list (each completed assistant message's metadata.custom.
 * {usage,route}, see hermes-adapter.ts/hermes-history-adapter.ts) rather
 * than a separately-tracked accumulator, so it can never drift out of
 * sync with what actually happened. "Session" means this browser tab's
 * runtime: it re-derives from full history on every render, so it's
 * complete for anything the history adapter loaded, not just turns sent
 * since the page opened. Turns with unknown pricing (the escalated/
 * research-agent path) are excluded from the total rather than counted
 * as free - see computeTurnCost's docstring. Renders nothing until at
 * least one turn has real cost data.
 */
const SessionCostButton: FC = () => {
  const messages = useAuiState((s) => s.thread.messages);
  const { models } = useHermesModels();
  const { providers } = useProviders();
  const { models: reasoningModelsForCost } = useReasoningModels();
  const { rate: usdToInr } = useUsdToInr();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  // Derived here in the component body from the stable `messages` array
  // reference, not inside the useAuiState selector above - constructing
  // new arrays/objects inside a useAuiState selector breaks
  // useSyncExternalStore (see StoppedRunBlock elsewhere in this file for
  // the bug this exact pattern caused once already).
  const perModel = new Map<string, { inputTokens: number; outputTokens: number; usdCost: number }>();
  let sessionUsd = 0;
  let lastTurnUsd: number | null = null;

  for (const message of messages) {
    if (message.role !== "assistant") continue;
    const custom = message.metadata.custom as { usage?: HermesUsage; route?: HermesRoute } | undefined;
    if (!custom?.route) continue;
    const cost = computeTurnCost(custom.route, custom.usage, models, usdToInr, providers, reasoningModelsForCost);
    if (cost.usdCost === null) continue;
    sessionUsd += cost.usdCost;
    lastTurnUsd = cost.usdCost;
    const existing = perModel.get(cost.modelLabel) ?? { inputTokens: 0, outputTokens: 0, usdCost: 0 };
    existing.inputTokens += custom.usage?.promptTokens ?? 0;
    existing.outputTokens += custom.usage?.completionTokens ?? 0;
    existing.usdCost += cost.usdCost;
    perModel.set(cost.modelLabel, existing);
  }

  if (perModel.size === 0) return null;

  const lines = Array.from(perModel.entries()).map(([model, entry]) => ({
    model,
    inputTokens: entry.inputTokens,
    outputTokens: entry.outputTokens,
    cost: formatInr(usdToInr !== null ? entry.usdCost * usdToInr : null),
    share: sessionUsd > 0 ? entry.usdCost / sessionUsd : 0,
  }));

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "text-foreground/55 hover:bg-foreground/[0.06] hover:text-foreground/90 dark:hover:bg-foreground/[0.09] flex h-8 items-center gap-1 rounded-full px-3 text-[12.5px] transition-colors",
          mono,
        )}
      >
        {formatInr(usdToInr !== null ? sessionUsd * usdToInr : null)}
      </button>
      {open && (
        <div className="absolute bottom-full end-0 z-10 mb-2">
          <CostMeter
            runCost={lastTurnUsd !== null ? formatInr(usdToInr !== null ? lastTurnUsd * usdToInr : null) : "—"}
            sessionCost={formatInr(usdToInr !== null ? sessionUsd * usdToInr : null)}
            lines={lines}
          />
        </div>
      )}
    </div>
  );
};

/**
 * Real, pre-flight context-window usage for the composer - wires the
 * ComposerContext element (elements/composer.tsx) to
 * GET .../conversations/{id}/context-usage (app/conversations/
 * streaming_routes.py) via useContextUsage, instead of leaving that
 * element unrendered as dead code. Reflects what the *next* message would
 * actually cost against the target model's context window, not a running
 * session total (that's SessionCostButton, a separate concept).
 *
 * `tools` always renders as 0 today: no code path on the fast/direct-
 * OpenRouter send path attaches a `tools=` field to the request
 * (hermes-agent's own tool use is opaque to this service) - an honest
 * reflection of what's actually sent, not a placeholder waiting to be
 * filled in.
 *
 * Refetches (via useContextUsage's refreshKey) whenever a new turn lands
 * (thread.messages.length changes) or the direct-model picker changes -
 * both real signals that what the *next* send would look like has
 * changed. Renders nothing until a real conversation/workspace/token
 * triple exists and the backend has returned a usage figure.
 */
const ContextUsageButton: FC = () => {
  const { session } = useAuth();
  const { workspace } = useWorkspace();
  const { activeConversation } = useConversations();
  const runConfigCustom = useAuiState((s) => s.composer.runConfig.custom);
  const directModel = typeof runConfigCustom?.directModel === "string" ? runConfigCustom.directModel : undefined;
  const messageCount = useAuiState((s) => s.thread.messages.length);

  const usage = useContextUsage(
    {
      workspaceId: workspace?.id ?? "",
      conversationId: activeConversation?.id ?? "",
      token: session?.access_token ?? "",
      model: directModel,
    },
    messageCount,
  );

  if (!usage || usage.total <= 0) return null;

  return (
    <ComposerContext
      usage={{
        system: Math.round(usage.system / 1000),
        tools: Math.round(usage.tools / 1000),
        messages: Math.round(usage.messages / 1000),
        total: Math.round(usage.total / 1000),
      }}
    />
  );
};

// Approximate reference points for each effort tier, not a hard cap -
// OpenRouter's effort-level form ("low"/"medium"/"high") doesn't guarantee
// an exact token count the way its max_tokens form would. These are only
// used to size the progress bar in the ReasoningEffort element.
const REASONING_EFFORT_LEVELS = [
  { key: "low", label: "Low", budget: 1024 },
  { key: "medium", label: "Medium", budget: 4096 },
  { key: "high", label: "High", budget: 16384 },
];

/**
 * Real reasoning-effort control - only renders once a direct OpenRouter
 * model is selected (ModelPickerButton's "direct · reasoning" section),
 * since that's the only path that can honor it (hermes-agent has no
 * reasoning/effort concept at all, confirmed live against its own
 * /capabilities). `spent` is real cumulative reasoning tokens across this
 * session's direct-path replies (usage.completion_tokens_details.
 * reasoning_tokens, confirmed live against OpenRouter), derived the same
 * "re-scan thread.messages every render" way SessionCostButton computes
 * session cost, not a separate accumulator that could drift.
 */
const ReasoningEffortButton: FC = () => {
  const aui = useAui();
  const messages = useAuiState((s) => s.thread.messages);
  const runConfigCustom = useAuiState((s) => s.composer.runConfig.custom);
  const directModel = typeof runConfigCustom?.directModel === "string" ? runConfigCustom.directModel : undefined;
  const selectedKey = typeof runConfigCustom?.reasoningEffort === "string" ? runConfigCustom.reasoningEffort : "medium";
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  let spent = 0;
  for (const message of messages) {
    if (message.role !== "assistant") continue;
    const custom = message.metadata.custom as { usage?: HermesUsage; route?: HermesRoute } | undefined;
    if (custom?.route?.path !== "direct") continue;
    spent += custom.usage?.reasoningTokens ?? 0;
  }

  if (!directModel) return null;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label="Reasoning effort"
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "text-foreground/55 hover:bg-foreground/[0.06] hover:text-foreground/90 dark:hover:bg-foreground/[0.09] flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px] transition-colors",
        )}
      >
        <BrainIcon className="size-3.5" />
        {REASONING_EFFORT_LEVELS.find((level) => level.key === selectedKey)?.label ?? "Medium"}
      </button>
      {open && (
        <div className="absolute bottom-full end-0 z-10 mb-2">
          <ReasoningEffort
            levels={REASONING_EFFORT_LEVELS}
            selectedKey={selectedKey}
            spent={spent}
            onSelect={(key) => aui.composer.setRunConfig({ custom: { ...runConfigCustom, reasoningEffort: key } })}
            className="w-72 rounded-2xl border border-border bg-popover p-4 shadow-lg"
          />
        </div>
      )}
    </div>
  );
};

/**
 * Voice input via the browser's own SpeechRecognition API
 * (WebSpeechDictationAdapter, wired in HermesRuntimeProvider.tsx) -
 * speaking fills the composer text live, the same ComposerPrimitive.
 * Dictate/StopDictation contract assistant-ui's own reference thread
 * (src/components/assistant-ui/thread.tsx) already used. Hidden entirely
 * when the browser has no SpeechRecognition support (thread.capabilities.
 * dictation is only true once that adapter is actually configured).
 */
const DictationButton: FC = () => {
  const dictationActive = useAuiState((s) => s.composer.dictation != null);

  return (
    <AuiIf condition={(s) => s.thread.capabilities.dictation}>
      {dictationActive ? (
        <ComposerPrimitive.StopDictation asChild>
          <ComposerVoiceButton active aria-label="Stop voice input" />
        </ComposerPrimitive.StopDictation>
      ) : (
        <ComposerPrimitive.Dictate asChild>
          <ComposerVoiceButton active={false} aria-label="Start voice input" />
        </ComposerPrimitive.Dictate>
      )}
    </AuiIf>
  );
};

const ComposerSendAction: FC = () => {
  const streaming = useAuiState((s) => s.thread.isRunning);
  const idle = useAuiState((s) => s.composer.isEmpty);

  return (
    <>
      <AuiIf condition={(s) => !s.thread.isRunning}>
        <ComposerPrimitive.Send asChild>
          <ComposerSend streaming={false} idle={idle} aria-label="Send message" />
        </ComposerPrimitive.Send>
      </AuiIf>
      <AuiIf condition={(s) => s.thread.isRunning}>
        <ComposerPrimitive.Cancel asChild>
          <ComposerSend streaming={streaming} idle={idle} aria-label="Stop generating" />
        </ComposerPrimitive.Cancel>
      </AuiIf>
    </>
  );
};
