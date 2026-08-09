import * as React from "react";
import { cn } from "@/lib/utils";

export function Badge({ className, tone = "neutral", ...props }: React.HTMLAttributes<HTMLSpanElement> & { tone?: "neutral" | "cyan" | "success" | "warning" | "danger" | "purple" }) {
  const tones = { neutral: "border-border-subtle bg-bg-surface-2 text-text-secondary", cyan: "border-accent-cyan/25 bg-accent-cyan/10 text-accent-cyan", success: "border-status-success/25 bg-status-success/10 text-status-success", warning: "border-status-warning/25 bg-status-warning/10 text-status-warning", danger: "border-status-danger/25 bg-status-danger/10 text-status-danger", purple: "border-accent-purple/25 bg-accent-purple/10 text-accent-purple" };
  return <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider", tones[tone], className)} {...props} />;
}
