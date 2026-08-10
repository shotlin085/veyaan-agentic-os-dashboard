import { NextResponse } from "next/server";
import { assistantGatewayUrl, bearerAuthorization } from "@/lib/server/assistant-gateway";

export const dynamic = "force-dynamic";

// Called client-side by src/app/mcp-servers/[name]/callback/page.tsx -
// same reason as the connectors callback page: the browser is the only
// place with a live session to attach.
export async function POST(request: Request, { params }: { params: { workspaceId: string; name: string } }) {
  const authorization = bearerAuthorization(request);
  if (!authorization) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const body = await request.text();
  try {
    const response = await fetch(
      assistantGatewayUrl(`/workspaces/${encodeURIComponent(params.workspaceId)}/hermes/mcp-servers/${encodeURIComponent(params.name)}/oauth-callback`),
      { method: "POST", headers: { authorization, "content-type": "application/json" }, body, cache: "no-store" },
    );
    const text = await response.text();
    return new NextResponse(text, { status: response.status, headers: { "content-type": response.headers.get("content-type") ?? "application/json" } });
  } catch {
    return NextResponse.json({ error: "MCP server service is unreachable." }, { status: 503 });
  }
}
