import { NextResponse } from "next/server";
import {
  assistantGatewayBaseUrl,
  assistantGatewayUrl,
  internalServiceHeaders,
  requireGatewayWorkspaceAccess,
} from "@/lib/server/assistant-gateway";

const services = [
  { name: "Hermes Orchestrator", url: assistantGatewayBaseUrl, path: "/health/live" },
  { name: "JCode Runner", url: process.env.JCODE_RUNNER_URL ?? "http://127.0.0.1:8020", path: "/health/live" },
  { name: "Core Backend", url: process.env.CORE_BACKEND_URL ?? "http://127.0.0.1:8000", path: "/health/live" },
] as const;

type GatewayServiceHealth = { live: boolean; ready: boolean; detail?: string };

type ServiceTile = { name: string; state: "online" | "degraded" | "offline"; detail: string; live?: string };

// Agent Workforce and Observability no longer get fetched directly from this
// public, internet-facing route: both are reached only through the assistant
// gateway's authenticated `/v1/status`, which already holds the internal
// service credentials needed to reach them. See gateway `app/main.py`.
function mapGatewayStatus(name: string, health: GatewayServiceHealth | undefined): ServiceTile {
  if (!health) return { name, state: "offline", detail: "Service status unavailable" };
  if (health.live && health.ready) return { name, state: "online", detail: health.detail ?? "ready" };
  if (health.live) return { name, state: "degraded", detail: health.detail ?? "dependencies unavailable" };
  return { name, state: "offline", detail: health.detail ?? "Service is not reachable" };
}

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const access = await requireGatewayWorkspaceAccess(request);
  if (!access.ok) {
    return NextResponse.json({ error: access.detail }, { status: access.status });
  }

  const results: ServiceTile[] = await Promise.all(services.map(async (service) => {
    try {
      const serviceHeaders = service.name === "JCode Runner"
        ? internalServiceHeaders("veyaan-assistant-gateway", process.env.RUNNER_SERVICE_SECRET)
        : {};
      const liveResponse = await fetch(`${service.url}${service.path}`, { headers: serviceHeaders, cache: "no-store", signal: AbortSignal.timeout(3000) });
      const liveBody = (await liveResponse.json().catch(() => ({}))) as Record<string, unknown>;
      if (!liveResponse.ok) return { name: service.name, state: "degraded" as const, detail: `Liveness HTTP ${liveResponse.status}` };
      const readyResponse = await fetch(`${service.url}/health/ready`, { headers: serviceHeaders, cache: "no-store", signal: AbortSignal.timeout(3000) });
      const readyBody = (await readyResponse.json().catch(() => ({}))) as Record<string, unknown>;
      const live = String(liveBody.status ?? "alive");
      if (!readyResponse.ok) {
        return { name: service.name, state: "degraded" as const, detail: String(readyBody.detail ?? readyBody.status ?? "dependencies unavailable"), live };
      }
      return { name: service.name, state: "online" as const, detail: "ready", live };
    } catch {
      return { name: service.name, state: "offline" as const, detail: "Service is not reachable" };
    }
  }));

  let gatewayStatus: { workforce?: GatewayServiceHealth; observability?: GatewayServiceHealth } = {};
  try {
    const statusResponse = await fetch(assistantGatewayUrl("/v1/status"), {
      headers: { authorization: access.authorization },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (statusResponse.ok) gatewayStatus = (await statusResponse.json()) as typeof gatewayStatus;
  } catch { /* mapped to offline below */ }

  results.push(mapGatewayStatus("Agent Workforce", gatewayStatus.workforce));
  results.push(mapGatewayStatus("Observability", gatewayStatus.observability));

  let capabilities: Record<string, unknown> | null = null;
  const runner = services[1];
  try {
    const response = await fetch(`${runner.url}/internal/v1/capabilities`, {
      headers: internalServiceHeaders("veyaan-assistant-gateway", process.env.RUNNER_SERVICE_SECRET),
      cache: "no-store",
      signal: AbortSignal.timeout(3000),
    });
    if (response.ok) capabilities = (await response.json()) as Record<string, unknown>;
  } catch { /* health state already reports runner reachability */ }

  const rawCapabilities = capabilities?.capabilities;
  const capabilityStates = rawCapabilities && typeof rawCapabilities === "object"
    ? Object.fromEntries(Object.entries(rawCapabilities as Record<string, unknown>).map(([name, state]) => [name, state === "ready" ? "ready" : state === "planned" ? "planned" : "unavailable"]))
    : {};

  const workspaceId = request.headers.get("x-veyaan-workspace-id");
  const workspace = access.workspaces.find((item) => item.id === workspaceId) ?? access.workspaces[0] ?? null;

  return NextResponse.json({
    services: results,
    capabilities,
    capabilityStates,
    authenticated: true,
    workspace,
    workspaceCount: access.workspaces.length,
    checkedAt: new Date().toISOString(),
  });
}
