"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { CheckIcon, Loader2Icon, XIcon } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthProvider";
import { consumeRememberedMcpWorkspace } from "@/components/assistant/runtime/hermes-mcp-servers";
import { inkButton, mono, paper } from "@/components/elements/surfaces";
import { cn } from "@/lib/utils";

type Status = "connecting" | "success" | "error";

/**
 * Real page route (not an /api/* Route Handler) - MCP_SERVER_CALLBACK_BASE_URL
 * on the orchestrator points here. Same reasoning as
 * /connectors/[provider]/callback: the dashboard's Supabase session lives
 * in the browser's localStorage, so only client-rendered code landing
 * here - after the provider's full-page redirect - can read the
 * signed-in user's own access token to forward the code/state onward to
 * Hermes's own OAuth callback handler.
 */
export default function McpServerCallbackPage() {
  const params = useParams<{ name: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { session, loading: authLoading } = useAuth();

  const [status, setStatus] = useState<Status>("connecting");
  const [message, setMessage] = useState("Connecting your MCP server...");

  useEffect(() => {
    if (authLoading) return;

    const name = params.name;
    const providerError = searchParams.get("error_description") ?? searchParams.get("error");
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const workspaceId = consumeRememberedMcpWorkspace();

    if (!session?.access_token) {
      setStatus("error");
      setMessage("Your session expired before the connection finished. Sign in and try again.");
      return;
    }
    if (!workspaceId) {
      setStatus("error");
      setMessage("This connection link is missing information and can't be completed. Try connecting again.");
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch(`/api/workspaces/${workspaceId}/hermes/mcp-servers/${name}/oauth-callback`, {
          method: "POST",
          headers: { authorization: `Bearer ${session.access_token}`, "content-type": "application/json" },
          body: JSON.stringify({ code, state, error: providerError }),
        });
        const payload = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string; detail?: string };
        if (cancelled) return;
        if (!response.ok || !payload.ok) {
          setStatus("error");
          setMessage(payload.error ?? payload.detail ?? "Could not complete the connection.");
          return;
        }
        setStatus("success");
        setMessage("Connected. Restart the gateway from Settings to make it usable in real conversations.");
        setTimeout(() => {
          if (!cancelled) router.replace("/settings");
        }, 2200);
      } catch {
        if (!cancelled) {
          setStatus("error");
          setMessage("MCP server service is unreachable.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading]);

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className={cn(paper, "flex w-full max-w-sm flex-col items-center gap-4 rounded-2xl p-8 text-center")}>
        <span
          className={cn(
            "flex size-11 items-center justify-center rounded-full",
            status === "success" && "bg-status-healthy/15 text-status-healthy",
            status === "error" && "bg-destructive/15 text-destructive",
            status === "connecting" && "bg-foreground/[0.06] text-foreground/60",
          )}
        >
          {status === "connecting" && <Loader2Icon className="size-5 animate-spin" />}
          {status === "success" && <CheckIcon className="size-5" />}
          {status === "error" && <XIcon className="size-5" />}
        </span>
        <div>
          <p className={cn(mono, "text-foreground/35")}>{String(params.name ?? "")}</p>
          <p className="mt-1 text-[13.5px] leading-6 text-foreground/80">{message}</p>
        </div>
        {status !== "connecting" && (
          <Link href="/settings" className={cn(inkButton, "flex h-8 items-center rounded-full px-4 text-[12.5px] font-medium")}>
            Back to Settings
          </Link>
        )}
      </div>
    </div>
  );
}
