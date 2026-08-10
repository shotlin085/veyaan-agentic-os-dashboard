"use client";

import { useEffect, useState } from "react";
import { LockKeyhole, SettingsIcon } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useWorkspace } from "@/lib/workspace/WorkspaceProvider";
import { McpServerPanel, type McpServer } from "@/components/elements/mcp-server-panel";
import { mono } from "@/components/elements/surfaces";
import { cn } from "@/lib/utils";

interface RawToolset {
  name: string;
  label: string;
  description: string;
  enabled: boolean;
  configured: boolean;
  tools: string[];
}

/**
 * Real Hermes toolsets (BE-4's /workspaces/{id}/hermes/toolsets
 * passthrough - see the new API route this page calls). No onAuthorize
 * handler is wired: there's no endpoint to flip a toolset's enabled state
 * from here, so showing an "Authorize" button would be decorative. This
 * is read-only, honestly.
 */
export default function SettingsPage() {
  const { session } = useAuth();
  const { workspace } = useWorkspace();
  const [toolsets, setToolsets] = useState<RawToolset[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | undefined>(undefined);

  useEffect(() => {
    const token = session?.access_token;
    const workspaceId = workspace?.id;
    if (!token || !workspaceId) {
      setToolsets(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/workspaces/${workspaceId}/hermes/toolsets`, {
      headers: { authorization: `Bearer ${token}` },
      cache: "no-store",
    })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(String(payload.detail ?? payload.error ?? "Toolsets request failed."));
        return payload as { data?: RawToolset[] };
      })
      .then((payload) => {
        if (!cancelled) setToolsets(payload.data ?? []);
      })
      .catch((cause: unknown) => {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "Toolsets request failed.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [session?.access_token, workspace?.id]);

  const servers: McpServer[] = (toolsets ?? []).map((toolset) => ({
    id: toolset.name,
    name: toolset.label,
    transport: toolset.description,
    status: toolset.enabled ? "connected" : "failed",
    tools: toolset.tools,
  }));

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 p-6 pb-16">
      <header className="flex items-center gap-3 border-b border-border pb-5">
        <div className="flex size-9 items-center justify-center rounded-xl bg-foreground/[0.06] text-foreground/70">
          <SettingsIcon className="size-4" />
        </div>
        <div>
          <p className={cn(mono, "text-foreground/35")}>VEYAAN / WORKSPACE</p>
          <h1 className="text-xl font-semibold text-foreground">Settings</h1>
        </div>
      </header>

      <p className="max-w-2xl text-sm leading-6 text-foreground/55">
        The real toolsets Hermes has available in this workspace, and whether each is actually
        enabled and configured on the runtime - not a fixture, and not editable from here yet.
      </p>

      {!session || !workspace ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border py-16 text-center">
          <LockKeyhole className="size-6 text-foreground/30" />
          <p className="text-sm text-foreground/55">
            Sign in and select an active workspace from the sidebar to load real toolset data.
          </p>
        </div>
      ) : error ? (
        <p className="text-[13px] leading-snug text-destructive/80">{error}</p>
      ) : loading && !toolsets ? (
        <p className={cn(mono, "text-foreground/35")}>Loading toolsets...</p>
      ) : (
        <McpServerPanel
          servers={servers}
          expandedId={expandedId}
          onToggle={(id) => setExpandedId((current) => (current === id ? undefined : id))}
          className="w-full max-w-none"
        />
      )}
    </div>
  );
}
