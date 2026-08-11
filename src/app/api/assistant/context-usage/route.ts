import { NextResponse } from "next/server";
import { assistantGatewayUrl, bearerAuthorization } from "@/lib/server/assistant-gateway";

export const dynamic = "force-dynamic";

/**
 * Proxies to GET .../workspaces/{workspaceId}/conversations/{conversationId}
 * /context-usage (app/conversations/streaming_routes.py) - a real, pre-flight
 * token-count preview for the *next* message on a conversation, not a mock.
 * Plain JSON, unlike /api/assistant's streaming POST - this is a cheap
 * read-only lookup the composer can call on every relevant change.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId");
  const conversationId = searchParams.get("conversationId");
  const model = searchParams.get("model");
  const authorization = bearerAuthorization(request);

  if (!workspaceId || !conversationId) {
    return NextResponse.json({ error: "workspaceId and conversationId are required" }, { status: 400 });
  }
  if (!authorization) {
    return NextResponse.json({ error: "Sign in with a workspace bearer token first." }, { status: 401 });
  }

  const path = `/workspaces/${encodeURIComponent(workspaceId)}/conversations/${encodeURIComponent(conversationId)}/context-usage${
    model ? `?model=${encodeURIComponent(model)}` : ""
  }`;

  const upstream = await fetch(assistantGatewayUrl(path), {
    method: "GET",
    headers: { authorization, accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  }).catch(() => null);

  if (!upstream) {
    return NextResponse.json({ error: "VEYAAN is not reachable." }, { status: 503 });
  }

  const data = (await upstream.json().catch(() => null)) as
    | { system?: number; tools?: number; messages?: number; total?: number; detail?: string }
    | null;

  if (!upstream.ok || !data) {
    return NextResponse.json(
      { error: data?.detail ?? "Context usage request failed." },
      { status: upstream.status || 502 },
    );
  }

  return NextResponse.json(data);
}
