import type {
  AgentItem,
  ApprovalItem,
  DepartmentItem,
  ProjectItem,
  SystemEventEnvelope,
  UserProfile,
  WorkspaceContext,
} from "@/lib/types";

/**
 * The dashboard deliberately has no local fixture fallback. An empty result
 * means the authenticated workspace API has not supplied records yet.
 */
export const EMPTY_CURRENT_USER: UserProfile | null = null;
export const EMPTY_WORKSPACE: WorkspaceContext | null = null;
export const EMPTY_PROJECTS: ProjectItem[] = [];
export const EMPTY_DEPARTMENTS: DepartmentItem[] = [];
export const EMPTY_AGENTS: AgentItem[] = [];
export const EMPTY_APPROVALS: ApprovalItem[] = [];
export const EMPTY_EVENTS: SystemEventEnvelope[] = [];

// Compatibility names for unfinished detail screens. They are intentionally
// empty and must never be treated as a fallback dataset.
export const DEV_CURRENT_USER = EMPTY_CURRENT_USER as unknown as UserProfile;
export const DEV_WORKSPACE = EMPTY_WORKSPACE as unknown as WorkspaceContext;
export const DEV_PROJECTS = EMPTY_PROJECTS;
export const DEV_DEPARTMENTS = EMPTY_DEPARTMENTS;
export const DEV_AGENTS = EMPTY_AGENTS;
export const DEV_APPROVALS = EMPTY_APPROVALS;
export const DEV_EVENTS = EMPTY_EVENTS;
