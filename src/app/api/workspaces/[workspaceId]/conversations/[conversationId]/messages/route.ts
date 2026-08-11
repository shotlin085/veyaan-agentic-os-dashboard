import { NextResponse } from "next/server";
import { assistantGatewayUrl, bearerAuthorization } from "@/lib/server/assistant-gateway";

export const dynamic = "force-dynamic";

// Proxies Hermes's GET .../conversations/{id}/messages (real conversation
// history, added alongside this route) - separate from the POST on the
// same path in src/app/api/assistant/route.ts, which streams a new
// message rather than reading history.
export async function GET(request: Request, { params }: { params: { workspaceId: string; conversationId: string } }) {
  const authorization = bearerAuthorization(request);
  if (!authorization) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  try {
    const response = await fetch(
      assistantGatewayUrl(`/workspaces/${encodeURIComponent(params.workspaceId)}/conversations/${encodeURIComponent(params.conversationId)}/messages`),
      { headers: { authorization }, cache: "no-store" },
    );
    const text = await response.text();
    return new NextResponse(text, { status: response.status, headers: { "content-type": response.headers.get("content-type") ?? "application/json" } });
  } catch {
    return NextResponse.json({ error: "VEYAAN conversation API is unreachable." }, { status: 503 });
  }
}
