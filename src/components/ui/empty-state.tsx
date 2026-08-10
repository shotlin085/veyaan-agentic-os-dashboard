import { LockKeyhole, Plus } from "lucide-react";
import { Button } from "./button";
import { Card } from "./card";

export function EmptyState({ title, description, action, onAction, locked = false }: { title: string; description: string; action?: string; onAction?: () => void; locked?: boolean }) {
  return <Card className="border-dashed bg-popover/50 p-8 text-center sm:p-10">
    <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-muted text-foreground">{locked ? <LockKeyhole className="h-5 w-5" /> : <Plus className="h-5 w-5" />}</div>
    <h2 className="mt-4 text-sm font-semibold text-white">{title}</h2>
    <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-muted-foreground">{description}</p>
    {action && onAction && <Button className="mt-5" size="sm" onClick={onAction}>{action}</Button>}
  </Card>;
}
