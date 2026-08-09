import { NextResponse } from "next/server";
import {
  assistantGatewayUrl,
  bearerAuthorization,
  internalServiceHeaders,
} from "@/lib/server/assistant-gateway";

export const dynamic = "force-dynamic";
const workforceUrl = process.env.WORKFORCE_URL ?? "http://127.0.0.1:8030";

export async function GET(request: Request, { params }: { params: { workspaceId: string } }) {
  const authorization = bearerAuthorization(request);
  if (!authorization) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  try {
    const access = await fetch(assistantGatewayUrl(`/workspaces/${encodeURIComponent(params.workspaceId)}`), { headers: { authorization }, cache: "no-store" });
    if (!access.ok) return NextResponse.json({ error: "Workspace access was denied." }, { status: access.status === 404 ? 404 : 403 });
    const response = await fetch(
      `${workforceUrl}/internal/v1/departments?workspace_id=${encodeURIComponent(params.workspaceId)}`,
      {
        headers: internalServiceHeaders(
          "veyaan-assistant-gateway",
          process.env.WORKFORCE_SERVICE_SECRET,
        ),
        cache: "no-store",
      },
    );
    const body = await response.text();
    return new NextResponse(body, { status: response.status, headers: { "content-type": response.headers.get("content-type") ?? "application/json" } });
  } catch {
    return NextResponse.json({ error: "Agent Workforce is not reachable." }, { status: 503 });
  }
}
