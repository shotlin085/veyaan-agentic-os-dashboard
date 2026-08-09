import { NextResponse } from "next/server";
import { assistantGatewayUrl, bearerAuthorization } from "@/lib/server/assistant-gateway";

export const dynamic = "force-dynamic";

/**
 * "New workflow" = assign a real Agent Workforce instance a real piece of
 * work. There's no dedicated "workflow" entity anywhere in the backend
 * (confirmed by direct investigation) - Workforce's own real, already-
 * deployed chain (agent definition -> version -> instance -> assignment)
 * is the closest genuine equivalent, so this route drives that chain
 * server-side rather than exposing five separate round trips to the
 * client. Every step below is a real, persisted call through the gateway's
 * existing /v1/workforce proxy - nothing here is simulated.
 */

async function workforceCall(authorization: string, path: string, body: unknown) {
  const response = await fetch(assistantGatewayUrl(`/v1/workforce/${path}`), {
    method: "POST",
    headers: { authorization, "content-type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const parsed = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(String(parsed?.detail ?? parsed?.error ?? `Agent Workforce rejected a step (status ${response.status}).`));
  }
  return parsed;
}

export async function POST(request: Request, { params }: { params: { workspaceId: string } }) {
  const authorization = bearerAuthorization(request);
  if (!authorization) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const payload = await request.json().catch(() => null);
  const agentName = typeof payload?.agentDisplayName === "string" ? payload.agentDisplayName.trim() : "";
  const task = typeof payload?.task === "string" ? payload.task.trim() : "";
  const actor = typeof payload?.actor === "string" && payload.actor ? payload.actor : "dashboard";
  if (!agentName || !task) {
    return NextResponse.json({ error: "agentDisplayName and task are required." }, { status: 400 });
  }

  const slug = `${agentName.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40)}-${Date.now().toString(36)}`;

  try {
    const definition = await workforceCall(authorization, "agents", {
      name: slug,
      description: `Auto-provisioned from a Workflow Studio task for "${agentName}".`,
      created_by: actor,
      workspace_id: params.workspaceId,
      contract: {
        first_priority: "Understand the task fully before acting on it.",
        allowed_responsibilities: ["Complete the assigned task"],
        forbidden_responsibilities: [],
        input_schema: { type: "object" },
        output_schema: { type: "object" },
        completion_rules: { success_criteria: ["The task is done and reviewed"] },
        escalation_rules: { escalate_to: "workspace-owner" },
      },
    });

    const version = await workforceCall(authorization, `agents/${definition.id}/versions`, {
      version_label: "v1",
      created_by: actor,
    });

    await workforceCall(authorization, `agents/${definition.id}/versions/${version.id}/activate`, {
      actor,
      reason: "Initial activation for a new workflow.",
    });

    const instance = await workforceCall(authorization, "instances", {
      workspace_id: params.workspaceId,
      definition_id: definition.id,
      version_id: version.id,
      created_by: actor,
    });

    const assignment = await workforceCall(authorization, "assignments", {
      workspace_id: params.workspaceId,
      instance_id: instance.id,
      assigned_by: actor,
      work_order: { task },
    });

    return NextResponse.json({
      assignment_id: assignment.id,
      instance_id: instance.id,
      definition_id: definition.id,
      status: assignment.status,
      task,
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not create this workflow." }, { status: 502 });
  }
}
