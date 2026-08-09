import { z } from "zod";

// Roles
export const UserRoleSchema = z.enum([
  "Owner",
  "WorkspaceAdmin",
  "ProductDirector",
  "DepartmentManager",
  "SpecialistOperator",
  "Reviewer",
  "Observer",
]);
export type UserRole = z.infer<typeof UserRoleSchema>;

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  departmentId?: string;
}

// Workspace Context
export interface WorkspaceContext {
  id: string;
  name: string;
  environment: "development" | "staging" | "production";
  isConnected: boolean;
  activeProjectCount: number;
  activeAgentCount: number;
  todayCostUsd: number;
  monthlyBudgetUsd: number;
  healthScore: number;
}

// Project Domain
export const ProjectPhaseSchema = z.enum([
  "Idea",
  "Requirements",
  "Architecture",
  "Design",
  "Development",
  "QA",
  "Delivery",
]);
export type ProjectPhase = z.infer<typeof ProjectPhaseSchema>;

export const ProjectStatusSchema = z.enum([
  "Planning",
  "Active",
  "InQA",
  "Completed",
  "Paused",
  "Stopped",
]);
export type ProjectStatus = z.infer<typeof ProjectStatusSchema>;

export interface ProjectItem {
  id: string;
  name: string;
  code: string;
  description: string;
  owner: string;
  status: ProjectStatus;
  phase: ProjectPhase;
  progressPercentage: number;
  activeDepartmentCount: number;
  activeAgentCount: number;
  pendingApprovalsCount: number;
  todayCostUsd: number;
  totalBudgetUsd: number;
  health: "Healthy" | "AtRisk" | "Blocked";
  updatedAt: string;
}

// Department Domain
export interface DepartmentItem {
  id: string;
  name: string;
  code: string;
  mission: string;
  managerName: string;
  activeAgentsCount: number;
  runningWorkflowsCount: number;
  workloadPercentage: number;
  health: "Optimal" | "Busy" | "Overloaded" | "Blocked";
  todayCostUsd: number;
}

// Agent Domain
export const AgentStateSchema = z.enum([
  "Idle",
  "Starting",
  "Working",
  "Waiting",
  "Blocked",
  "AwaitingApproval",
  "Testing",
  "Failed",
  "Paused",
  "Completed",
]);
export type AgentState = z.infer<typeof AgentStateSchema>;

export interface AgentItem {
  id: string;
  name: string;
  role: string;
  departmentId: string;
  departmentName: string;
  manager: string;
  state: AgentState;
  currentTask?: string;
  model: string;
  successRate: number;
  tasksCompleted: number;
  todayCostUsd: number;
  lastVerifiedOutput?: string;
  isPaused: boolean;
}

// Approval Domain
export const ApprovalRiskSchema = z.enum(["Low", "Medium", "High", "Critical"]);
export type ApprovalRisk = z.infer<typeof ApprovalRiskSchema>;

export interface ApprovalItem {
  id: string;
  title: string;
  category: "Brief" | "Architecture" | "Design" | "AgentCreation" | "PromptPublish" | "WorkflowPublish" | "Budget" | "Deployment" | "Emergency";
  requestedBy: string;
  projectName?: string;
  departmentName?: string;
  riskLevel: ApprovalRisk;
  impactSummary: string;
  estimatedCostUsd?: number;
  createdAt: string;
  expiresAt?: string;
  status: "Pending" | "Approved" | "Rejected" | "RevisionRequested";
  reasonRequired?: boolean;
}

// Realtime Event Envelope
export interface SystemEventEnvelope {
  event_id: string;
  event_type: string;
  occurred_at: string;
  workspace_id: string;
  project_id?: string;
  department_id?: string;
  agent_id?: string;
  run_id?: string;
  sequence: number;
  severity: "info" | "warning" | "error" | "critical";
  payload: Record<string, unknown>;
}
