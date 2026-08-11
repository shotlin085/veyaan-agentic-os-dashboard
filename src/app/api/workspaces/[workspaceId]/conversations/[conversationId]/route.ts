import { NextResponse } from "next/server";
import { assistantGatewayUrl, bearerAuthorization } from "@/lib/server/assistant-gateway";

export const dynamic = "force-dynamic";

// Proxies Hermes's new PATCH (rename) and DELETE on a single conversation.
// Not wired into the UI yet (ThreadList's own rename/delete icons are
// still decorative - see src/components/elements/thread-list.tsx) but
// the backend surface is real, so the proxy is added alongside it rather
// than left for a later pass to rediscover is missing.

export async function PATCH(request: Request, { params }: { params: { workspaceId: string; conversationId: string } }) {
  const authorization = bearerAuthorization(request);
  if (!authorization) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  try {
    const response = await fetch(
      assistantGatewayUrl(`/workspaces/${encodeURIComponent(params.workspaceId)}/conversations/${encodeURIComponent(params.conversationId)}`),
      { method: "PATCH", headers: { authorization, "content-type": "application/json" }, body: JSON.stringify(body), cache: "no-store" },
    );
    const text = await response.text();
    return new NextResponse(text, { status: response.status, headers: { "content-type": response.headers.get("content-type") ?? "application/json" } });
  } catch {
    return NextResponse.json({ error: "VEYAAN conversation API is unreachable." }, { status: 503 });
  }
}

export async function DELETE(request: Request, { params }: { params: { workspaceId: string; conversationId: string } }) {
  const authorization = bearerAuthorization(request);
  if (!authorization) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  try {
    const response = await fetch(
      assistantGatewayUrl(`/workspaces/${encodeURIComponent(params.workspaceId)}/conversations/${encodeURIComponent(params.conversationId)}`),
      { method: "DELETE", headers: { authorization }, cache: "no-store" },
    );
    if (response.status === 204) return new NextResponse(null, { status: 204 });
    const text = await response.text();
    return new NextResponse(text, { status: response.status, headers: { "content-type": response.headers.get("content-type") ?? "application/json" } });
  } catch {
    return NextResponse.json({ error: "VEYAAN conversation API is unreachable." }, { status: 503 });
  }
}
