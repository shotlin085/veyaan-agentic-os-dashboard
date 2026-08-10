import { NextResponse } from "next/server";
import { assistantGatewayUrl, bearerAuthorization } from "@/lib/server/assistant-gateway";

export const dynamic = "force-dynamic";

const VOICE_TOKEN_URL = process.env.VOICE_TOKEN_URL ?? "https://voice.agnixstudio.com/token";

// This used to POST the orchestrator's own /voice/sessions, whose
// LIVEKIT_PUBLIC_URL points at the us-east-1 backend box - the wrong
// region. The real LiveKit deployment (and its token-minting service)
// lives on the dedicated Mumbai voice server (see CLAUDE.md), reachable
// publicly only at voice.agnixstudio.com/token. That service verifies
// the Supabase bearer token itself (JWKS, same approach as the backend,
// no shared secret) - the workspace check below is a dashboard-side
// gate (don't offer voice to someone with no real workspace access),
// not something the token server itself requires.
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const authorization = bearerAuthorization(request);
  const workspaceId = typeof body.workspaceId === "string" ? body.workspaceId.trim() : "";
  if (!authorization || !workspaceId) {
    return NextResponse.json({ detail: "Sign in and select a workspace before starting voice." }, { status: 401 });
  }
  try {
    const workspaceResponse = await fetch(assistantGatewayUrl(`/workspaces/${encodeURIComponent(workspaceId)}`), {
      headers: { authorization },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (!workspaceResponse.ok) {
      const detail = await workspaceResponse.text().catch(() => "Workspace access was denied.");
      return NextResponse.json({ detail: detail || "Workspace access was denied." }, { status: workspaceResponse.status === 404 ? 404 : 403 });
    }
    const response = await fetch(VOICE_TOKEN_URL, {
      method: "POST",
      headers: { "content-type": "application/json", authorization },
      body: JSON.stringify({}),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });

    const payload = await response.json().catch(() => ({
      detail: "The voice server returned an invalid response.",
    }));
    return NextResponse.json(payload, { status: response.status });
  } catch {
    return NextResponse.json(
      { detail: "The voice server is unreachable." },
      { status: 503 },
    );
  }
}
