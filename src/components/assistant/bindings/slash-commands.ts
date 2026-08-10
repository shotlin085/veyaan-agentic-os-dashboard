import { FileSearchIcon, ListChecksIcon, MessageSquareTextIcon, SearchCodeIcon, WrenchIcon } from "lucide-react";
import type { ComposerCommand } from "@/components/elements/composer";

export interface SlashCommand extends ComposerCommand {
  template: string;
}

/**
 * v1 catalog - text macros only. `/plan` doesn't toggle anything yet (real
 * plan-mode is unbuilt), it just prefills a prompt like the rest; once
 * plan-mode ships this is the one entry that gets upgraded to flip a real
 * flag instead of only inserting text.
 */
export const SLASH_COMMANDS: SlashCommand[] = [
  {
    name: "explain",
    description: "Explain how this works",
    icon: MessageSquareTextIcon,
    template: "Explain how this works, step by step: ",
  },
  {
    name: "review",
    description: "Review this for issues",
    icon: SearchCodeIcon,
    template: "Review this for bugs, edge cases, and style issues: ",
  },
  {
    name: "summarize",
    description: "Summarize this",
    icon: FileSearchIcon,
    template: "Summarize the following concisely: ",
  },
  {
    name: "debug",
    description: "Help me debug this",
    icon: WrenchIcon,
    template: "Help me debug this. Here's what's happening: ",
  },
  {
    name: "plan",
    description: "Ask for a step-by-step plan first",
    icon: ListChecksIcon,
    template: "Break this down into a step-by-step plan before doing anything else: ",
  },
];
