import { NextResponse } from "next/server";
import { assistantGatewayUrl, bearerAuthorization } from "@/lib/server/assistant-gateway";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: { workspaceId: string } }) {
  const authorization = bearerAuthorization(request);
  if (!authorization) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const payload = await request.json().catch(() => null);
  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ error: "A request body is required." }, { status: 400 });
  }

  try {
    const response = await fetch(assistantGatewayUrl("/v1/workforce/agents"), {
      method: "POST",
      headers: { authorization, "content-type": "application/json" },
      body: JSON.stringify({ ...payload, workspace_id: params.workspaceId }),
      cache: "no-store",
    });
    const body = await response.text();
    return new NextResponse(body, {
      status: response.status,
      headers: { "content-type": response.headers.get("content-type") ?? "application/json" },
    });
  } catch {
    return NextResponse.json({ error: "Agent Workforce is not reachable." }, { status: 503 });
  }
}
