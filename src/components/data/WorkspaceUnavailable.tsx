import { ArrowUpRight, Database, LockKeyhole } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

export function WorkspaceUnavailable({ title, description, icon: Icon = Database }: { title: string; description: string; icon?: typeof Database }) {
  return <div className="mx-auto max-w-6xl space-y-6 pb-12"><header className="border-b border-border pb-5"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-foreground/20 bg-foreground/10 text-foreground"><Icon className="h-5 w-5" /></div><div><p className="font-mono text-[10px] uppercase tracking-[0.2em] text-foreground">VEYAAN / WORKSPACE</p><h1 className="mt-1 text-2xl font-semibold text-white">{title}</h1></div></div><p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p></header><Card><EmptyState title="Workspace data unavailable" description="Sign in with an active workspace membership to load this screen. The dashboard does not display placeholder records." locked /></Card><Link href="/settings" className="inline-flex items-center gap-2 text-xs font-semibold text-foreground hover:text-white">Open connection settings <ArrowUpRight className="h-3.5 w-3.5" /></Link></div>;
}
