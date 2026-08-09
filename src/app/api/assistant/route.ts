import { NextResponse } from "next/server";
import { assistantGatewayUrl, bearerAuthorization } from "@/lib/server/assistant-gateway";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { workspaceId?: string; conversationId?: string; content?: string } | null;
  const authorization = bearerAuthorization(request);

  if (!body?.workspaceId || !body.conversationId || !body.content?.trim()) {
    return NextResponse.json({ error: "workspaceId, conversationId, and content are required" }, { status: 400 });
  }

  if (!authorization) {
    return NextResponse.json({ error: "Sign in with a workspace bearer token before sending messages." }, { status: 401 });
  }

  const upstream = await fetch(assistantGatewayUrl(`/workspaces/${encodeURIComponent(body.workspaceId)}/conversations/${encodeURIComponent(body.conversationId)}/messages`), {
    method: "POST",
    headers: { authorization, "content-type": "application/json", accept: "text/event-stream" },
    body: JSON.stringify({ content: body.content }),
    cache: "no-store",
    signal: AbortSignal.timeout(120_000),
  }).catch(() => null);

  if (!upstream) return NextResponse.json({ error: "Hermes Orchestrator is not reachable." }, { status: 503 });
  if (!upstream.ok || !upstream.body) {
    const detail = await upstream.text().catch(() => "Assistant request failed");
    return new NextResponse(detail || "Assistant request failed", { status: upstream.status, headers: { "content-type": "application/json" } });
  }

  return new Response(upstream.body, { status: upstream.status, headers: { "content-type": "text/event-stream", "cache-control": "no-cache, no-transform", connection: "keep-alive" } });
}
