import { NextResponse } from "next/server";
import { assistantGatewayUrl, bearerAuthorization } from "@/lib/server/assistant-gateway";

export const dynamic = "force-dynamic";

// Proxies POST .../conversations/{id}/images/enhance-prompt (app/
// conversations/streaming_routes.py) - a real, separate LLM call that
// expands a brief idea into a detailed image-generation prompt, no
// generation and nothing persisted yet.
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { workspaceId?: string; conversationId?: string; idea?: string }
    | null;
  const authorization = bearerAuthorization(request);

  if (!body?.workspaceId || !body.conversationId || !body.idea?.trim()) {
    return NextResponse.json({ error: "workspaceId, conversationId, and idea are required" }, { status: 400 });
  }
  if (!authorization) {
    return NextResponse.json({ error: "Sign in with a workspace bearer token first." }, { status: 401 });
  }

  const upstream = await fetch(
    assistantGatewayUrl(
      `/workspaces/${encodeURIComponent(body.workspaceId)}/conversations/${encodeURIComponent(body.conversationId)}/images/enhance-prompt`,
    ),
    {
      method: "POST",
      headers: { authorization, "content-type": "application/json" },
      body: JSON.stringify({ idea: body.idea }),
      cache: "no-store",
      signal: AbortSignal.timeout(30_000),
    },
  ).catch(() => null);

  if (!upstream) return NextResponse.json({ error: "VEYAAN is not reachable." }, { status: 503 });
  const data = (await upstream.json().catch(() => null)) as { enhanced_prompt?: string; detail?: string } | null;
  if (!upstream.ok || !data) {
    return NextResponse.json({ error: data?.detail ?? "Could not enhance that prompt." }, { status: upstream.status || 502 });
  }
  return NextResponse.json(data);
}
