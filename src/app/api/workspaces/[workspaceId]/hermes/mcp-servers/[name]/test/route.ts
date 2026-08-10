import { NextResponse } from "next/server";
import { assistantGatewayUrl, bearerAuthorization } from "@/lib/server/assistant-gateway";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: { workspaceId: string; name: string } }) {
  const authorization = bearerAuthorization(request);
  if (!authorization) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  try {
    const response = await fetch(
      assistantGatewayUrl(`/workspaces/${encodeURIComponent(params.workspaceId)}/hermes/mcp-servers/${encodeURIComponent(params.name)}/test`),
      { method: "POST", headers: { authorization }, cache: "no-store" },
    );
    const text = await response.text();
    return new NextResponse(text, { status: response.status, headers: { "content-type": response.headers.get("content-type") ?? "application/json" } });
  } catch {
    return NextResponse.json({ error: "MCP server service is unreachable." }, { status: 503 });
  }
}
