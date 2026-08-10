"use client";

import type { ComponentProps } from "react";
import { PinIcon, SearchIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { field, mono, paper } from "./surfaces";

export interface SearchableThread {
  id: string;
  title: string;
  group: string;
  preview: string;
  pinned?: boolean;
}

export function ThreadSearch({
  threads,
  query,
  activeId,
  onQueryChange,
  onSelect,
  onTogglePin,
  className,
  ...props
}: Omit<
  ComponentProps<"div">,
  "children" | "threads" | "query" | "activeId" | "onQueryChange" | "onSelect" | "onTogglePin"
> & {
  threads: readonly SearchableThread[];
  query: string;
  activeId: string;
  onQueryChange?: (query: string) => void;
  onSelect?: (id: string) => void;
  onTogglePin?: (id: string, pinned: boolean) => void;
}) {
  const matches = threads.filter((thread) =>
    `${thread.title} ${thread.preview}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  const pinned = matches.filter((thread) => thread.pinned);
  const groups = [
    ...new Set(matches.filter((t) => !t.pinned).map((t) => t.group)),
  ];

  const ordered = [
    ...pinned,
    ...groups.flatMap((group) =>
      matches.filter((thread) => !thread.pinned && thread.group === group),
    ),
  ];

  const move = (delta: number) => {
    if (ordered.length === 0) return;
    const at = ordered.findIndex((thread) => thread.id === activeId);
    // activeId can be filtered out by the query; start from the edge the key implies
    const from = at === -1 ? (delta > 0 ? -1 : 0) : at;
    const next = ordered[(from + delta + ordered.length) % ordered.length];
    if (next) onSelect?.(next.id);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      move(1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      move(-1);
    }
  };

  const row = (thread: SearchableThread) => (
    <div
      key={thread.id}
      className={cn(
        "group/thread flex items-start gap-1 rounded-xl px-2 py-1 transition-colors",
        thread.id === activeId
          ? "bg-foreground/[0.05]"
          : "hover:bg-foreground/[0.03]",
      )}
    >
      <button
        type="button"
        onClick={() => onSelect?.(thread.id)}
        className="flex min-w-0 flex-1 flex-col gap-0.5 text-start"
      >
        <span className="flex items-center gap-1.5">
          {thread.pinned && (
            <PinIcon className="text-foreground/30 size-2.5 shrink-0 fill-current" />
          )}
          <span className="min-w-0 flex-1 truncate text-[13px]">
            {thread.title}
          </span>
        </span>
        <span className="text-foreground/35 truncate text-xs">
          {thread.preview}
        </span>
      </button>
      {onTogglePin && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onTogglePin(thread.id, !thread.pinned);
          }}
          aria-label={thread.pinned ? "Unpin thread" : "Pin thread"}
          aria-pressed={thread.pinned}
          className={cn(
            "shrink-0 rounded-md p-1 text-foreground/30 transition-colors hover:bg-foreground/[0.08] hover:text-foreground/80",
            thread.pinned ? "opacity-100" : "opacity-0 group-hover/thread:opacity-100 focus-visible:opacity-100",
          )}
        >
          <PinIcon className={cn("size-3", thread.pinned && "fill-current")} />
        </button>
      )}
    </div>
  );

  return (
    <div
      data-slot="thread-search"
      className={cn(
        paper,
        "flex w-full max-w-sm flex-col gap-1.5 rounded-2xl p-3",
        className,
      )}

      {...props}
    >
      <div
        className={cn(
          field,
          "flex items-center gap-2 rounded-xl px-2.5 py-1.5",
        )}
      >
        <SearchIcon className="text-foreground/30 size-3.5 shrink-0" />
        <input
          value={query}
          onChange={(event) => onQueryChange?.(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Search threads"
          aria-label="Search threads"
          className="text-foreground/85 placeholder:text-foreground/30 min-w-0 flex-1 bg-transparent text-[13px] outline-none"
        />
      </div>

      {pinned.length > 0 && (
        <div className="flex flex-col">
          <span className={cn(mono, "text-foreground/25 px-2 pb-1")}>
            pinned
          </span>
          {pinned.map(row)}
        </div>
      )}

      {groups.map((group) => (
        <div key={group} className="flex flex-col">
          <span className={cn(mono, "text-foreground/25 px-2 pb-1")}>
            {group}
          </span>
          {matches
            .filter((thread) => !thread.pinned && thread.group === group)
            .map(row)}
        </div>
      ))}

      {matches.length === 0 && (
        <span className="text-foreground/30 px-2 py-4 text-center text-xs">
          No thread matches “{query}”
        </span>
      )}
    </div>
  );
}
