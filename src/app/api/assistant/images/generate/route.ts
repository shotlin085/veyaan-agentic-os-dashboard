import { NextResponse } from "next/server";
import { assistantGatewayUrl, bearerAuthorization, describeUpstreamDetail } from "@/lib/server/assistant-gateway";

export const dynamic = "force-dynamic";

// Proxies POST .../conversations/{id}/images/generate (app/conversations/
// streaming_routes.py) - calls the real browsermcp MCP tool directly
// (flow_generate_image_async / chatgpt_generate_image_async) and persists
// the user's turn immediately; returns a job_id to poll, not the image
// itself (generation runs async on the browsermcp side).
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { workspaceId?: string; conversationId?: string; prompt?: string; engine?: string }
    | null;
  const authorization = bearerAuthorization(request);

  if (!body?.workspaceId || !body.conversationId || !body.prompt?.trim() || !body.engine) {
    return NextResponse.json({ error: "workspaceId, conversationId, prompt, and engine are required" }, { status: 400 });
  }
  if (!authorization) {
    return NextResponse.json({ error: "Sign in with a workspace bearer token first." }, { status: 401 });
  }

  const upstream = await fetch(
    assistantGatewayUrl(
      `/workspaces/${encodeURIComponent(body.workspaceId)}/conversations/${encodeURIComponent(body.conversationId)}/images/generate`,
    ),
    {
      method: "POST",
      headers: { authorization, "content-type": "application/json" },
      body: JSON.stringify({ prompt: body.prompt, engine: body.engine }),
      cache: "no-store",
      signal: AbortSignal.timeout(30_000),
    },
  ).catch(() => null);

  if (!upstream) return NextResponse.json({ error: "VEYAAN is not reachable." }, { status: 503 });
  const data = (await upstream.json().catch(() => null)) as { job_id?: string; turn_id?: string; detail?: unknown } | null;
  if (!upstream.ok || !data) {
    return NextResponse.json(
      { error: describeUpstreamDetail(data?.detail, "Could not start image generation.") },
      { status: upstream.status || 502 },
    );
  }
  return NextResponse.json(data);
}
