import { NextResponse } from "next/server";
import { assistantGatewayUrl, bearerAuthorization } from "@/lib/server/assistant-gateway";

export const dynamic = "force-dynamic";

// Called client-side by src/app/connectors/[provider]/callback/page.tsx -
// see that page's comment for why the exchange has to happen from the
// browser (the Supabase session lives in localStorage, not a cookie a
// server-side Route Handler could read).
export async function POST(request: Request, { params }: { params: { workspaceId: string; provider: string } }) {
  const authorization = bearerAuthorization(request);
  if (!authorization) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const body = await request.text();
  try {
    const response = await fetch(
      assistantGatewayUrl(
        `/workspaces/${encodeURIComponent(params.workspaceId)}/connectors/${encodeURIComponent(params.provider)}/exchange`,
      ),
      { method: "POST", headers: { authorization, "content-type": "application/json" }, body, cache: "no-store" },
    );
    const text = await response.text();
    return new NextResponse(text, { status: response.status, headers: { "content-type": response.headers.get("content-type") ?? "application/json" } });
  } catch {
    return NextResponse.json({ error: "Connector service is unreachable." }, { status: 503 });
  }
}
