import { NextResponse } from "next/server";
import { assistantGatewayUrl, bearerAuthorization } from "@/lib/server/assistant-gateway";

export const dynamic = "force-dynamic";

// Proxies GET .../conversations/{id}/images/jobs/{jobId} (app/
// conversations/streaming_routes.py) - polled every few seconds by the
// client while a generation job is running. On first observing
// status=="completed" the backend persists the assistant turn itself
// (idempotently), so this route stays a thin, stateless proxy.
export async function GET(request: Request, { params }: { params: { jobId: string } }) {
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId");
  const conversationId = searchParams.get("conversationId");
  const authorization = bearerAuthorization(request);

  if (!workspaceId || !conversationId) {
    return NextResponse.json({ error: "workspaceId and conversationId are required" }, { status: 400 });
  }
  if (!authorization) {
    return NextResponse.json({ error: "Sign in with a workspace bearer token first." }, { status: 401 });
  }

  const upstream = await fetch(
    assistantGatewayUrl(
      `/workspaces/${encodeURIComponent(workspaceId)}/conversations/${encodeURIComponent(conversationId)}/images/jobs/${encodeURIComponent(params.jobId)}`,
    ),
    {
      headers: { authorization },
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    },
  ).catch(() => null);

  if (!upstream) return NextResponse.json({ error: "VEYAAN is not reachable." }, { status: 503 });
  const data = (await upstream.json().catch(() => null)) as
    | { status?: string; image_urls?: string[]; error?: string; detail?: string }
    | null;
  if (!upstream.ok || !data) {
    return NextResponse.json({ error: data?.detail ?? "Could not check generation status." }, { status: upstream.status || 502 });
  }
  return NextResponse.json(data);
}
