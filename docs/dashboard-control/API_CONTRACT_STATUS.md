# API Contract Status & Adapter Layer

## Architecture Overview
The frontend communicates via a typed API client adapter pattern (`src/lib/api/`).
In development, if backend services are offline or returning 503, the adapter seamlessly falls back to typed, deterministic development fixtures clearly labeled as `[LOCAL_DEV_FIXTURE]`.

## Domain Contracts Defined in Zod (`src/lib/types/`)

1. **Workspace & User Contract (`workspace.ts`):**
   - `Workspace`: `id`, `name`, `environment`, `health`, `memberCount`
   - `User`: `id`, `name`, `email`, `role` (Owner, WorkspaceAdmin, ProductDirector, DepartmentManager, SpecialistOperator, Reviewer, Observer)

2. **Project Contract (`project.ts`):**
   - `Project`: `id`, `name`, `description`, `status` (Planning, Active, InQA, Completed, Paused, Stopped), `phase` (Idea, Requirements, Architecture, Design, Development, QA, Delivery), `costToday`, `budget`, `health`

3. **Department & Agent Contract (`agent.ts`):**
   - `Department`: `id`, `name`, `mission`, `manager`, `activeAgents`, `workloadPercentage`, `health`
   - `Agent`: `id`, `name`, `role`, `departmentId`, `state` (Idle, Working, Waiting, Blocked, AwaitingApproval, Testing, Failed, Paused), `currentTask`, `model`, `costToday`, `successRate`

4. **Workflow Contract (`workflow.ts`):**
   - `Workflow`: `id`, `name`, `version`, `status` (Draft, ReadyForTest, Published, Paused), `nodes` (ReactFlow format), `edges`

5. **Approval Contract (`approval.ts`):**
   - `ApprovalRequest`: `id`, `title`, `category`, `requestedBy`, `riskLevel` (Low, Medium, High, Critical), `impact`, `cost`, `status` (Pending, Approved, Rejected, ChangesRequested)

6. **Realtime Event Envelope Contract (`events.ts`):**
   - `EventEnvelope`: `event_id`, `event_type`, `occurred_at`, `workspace_id`, `project_id`, `agent_id`, `run_id`, `sequence`, `severity`, `payload`
