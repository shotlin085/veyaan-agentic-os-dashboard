"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { CheckIcon, Loader2Icon, XIcon } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthProvider";
import { consumeRememberedConnectorWorkspace } from "@/components/assistant/runtime/hermes-connectors";
import { inkButton, mono, paper } from "@/components/elements/surfaces";
import { cn } from "@/lib/utils";

type Status = "connecting" | "success" | "error";

/**
 * Real page route (not an /api/* Route Handler) - this is where every
 * connector's OAuth app must have its redirect URI registered
 * (CONNECTOR_CALLBACK_BASE_URL on the orchestrator). It has to be a page:
 * the dashboard's Supabase session lives in the browser's localStorage
 * (plain supabase-js client, see src/lib/auth/supabase.ts), so only
 * client-rendered code landing here - after the provider's full-page
 * redirect - can read the signed-in user's own access token to call the
 * exchange endpoint. workspaceId travels via sessionStorage (set by
 * whatever button started the authorize redirect), since the signed
 * `state` param is opaque to the browser - only the orchestrator can
 * decrypt it.
 */
export default function ConnectorCallbackPage() {
  const params = useParams<{ provider: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { session, loading: authLoading } = useAuth();

  const [status, setStatus] = useState<Status>("connecting");
  const [message, setMessage] = useState("Connecting your account...");

  useEffect(() => {
    if (authLoading) return;

    const provider = params.provider;
    const providerError = searchParams.get("error_description") ?? searchParams.get("error");
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const workspaceId = consumeRememberedConnectorWorkspace();

    if (providerError) {
      setStatus("error");
      setMessage(providerError);
      return;
    }
    if (!session?.access_token) {
      setStatus("error");
      setMessage("Your session expired before the connection finished. Sign in and try again.");
      return;
    }
    if (!code || !state || !workspaceId) {
      setStatus("error");
      setMessage("This connection link is missing information and can't be completed. Try connecting again.");
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch(`/api/workspaces/${workspaceId}/connectors/${provider}/exchange`, {
          method: "POST",
          headers: { authorization: `Bearer ${session.access_token}`, "content-type": "application/json" },
          body: JSON.stringify({ code, state }),
        });
        const payload = (await response.json().catch(() => ({}))) as {
          ok?: boolean;
          account_label?: string | null;
          error?: string;
          detail?: string;
        };
        if (cancelled) return;
        if (!response.ok || !payload.ok) {
          setStatus("error");
          setMessage(payload.error ?? payload.detail ?? "Could not complete the connection.");
          return;
        }
        setStatus("success");
        setMessage(payload.account_label ? `Connected as ${payload.account_label}.` : "Connected.");
        setTimeout(() => {
          if (!cancelled) router.replace("/settings");
        }, 1800);
      } catch {
        if (!cancelled) {
          setStatus("error");
          setMessage("Connector service is unreachable.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // Runs once the auth session is settled - re-running on every
    // searchParams/session object identity change would re-fire the
    // one-time code exchange (OAuth codes are single-use).
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
          <p className={cn(mono, "text-foreground/35")}>{String(params.provider ?? "").toUpperCase()}</p>
          <p className="mt-1 text-[13.5px] leading-6 text-foreground/80">{message}</p>
        </div>
        {status === "error" && (
          <Link href="/settings" className={cn(inkButton, "flex h-8 items-center rounded-full px-4 text-[12.5px] font-medium")}>
            Back to Settings
          </Link>
        )}
      </div>
    </div>
  );
}
