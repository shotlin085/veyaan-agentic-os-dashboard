# Application Route Map — Next.js App Router

| Route Path | Page Name | Primary Component | Key Sub-Views / Tabs |
|---|---|---|---|
| `/` | Home Command Centre | `CommandCentrePage` | Hero command input, priority strip, system topology map, activity timeline |
| `/assistant` | Personal Assistant | `PersonalAssistantPage` | Chat workspace, requirement interview cards, context rail, voice composer |
| `/projects` | Projects | `ProjectsListPage` | Project list, status filters, cost summaries |
| `/projects/[id]` | Project Detail | `ProjectDetailPage` | Overview, Brief, Requirements, Plan, Departments, Agents, Tasks, QA, Costs |
| `/departments` | Department Management | `DepartmentsPage` | Department cards, workload grid, division metrics |
| `/departments/[id]` | Department Detail | `DepartmentDetailPage` | Mission, Manager, Agents, Tasks, Prompts, Skills, Costs |
| `/agents` | Agent Management | `AgentsListPage` | Agent grid, state badges, performance metrics |
| `/agents/[id]` | Agent Detail | `AgentDetailPage` | Contract, Runs, Tasks, Prompts, Skills, Tools, Memory, Model Policy |
| `/agents/factory` | Agent Factory | `AgentFactoryPage` | Step-by-step agent creation wizard, contract linting, safety simulation |
| `/workflows` | Workflow Studio | `WorkflowStudioPage` | Visual graph editor (React Flow), node library, property inspector, execution console |
| `/prompts` | Prompt Studio | `PromptStudioPage` | Prompt library, Monaco Markdown editor, version diff, model comparison playground |
| `/skills` | Skill Studio | `SkillStudioPage` | SKILL.md editor, non-coder guided wizard, tool policy, test harness |
| `/memory` | Memory Console | `MemoryConsolePage` | RAG search, namespace browser, memory proposals inbox, access audit |
| `/approvals` | Approval Centre | `ApprovalCentrePage` | Governance inbox, risk/impact metrics, diff inspector, step-up approval |
| `/qa` | QA Centre | `QACentrePage` | Release confidence dashboard, requirement coverage matrix, test runs, defects |
| `/logs` | Logs & Observability | `LogsObservabilityPage` | Correlation log explorer, event stream viewer, secret redaction, replay |
| `/sandboxes` | Sandboxes & JCode | `SandboxesJCodePage` | Active sandboxes, JCode session terminal, git diff viewer, preview frame |
| `/costs` | Models & Costs | `ModelsCostsPage` | Provider spend, token routing policies, budget caps, latency/quality charts |
| `/notifications` | Notification Centre | `NotificationsPage` | Priority notifications, channel preferences, assignment drawer |
| `/settings` | Organization Settings | `SettingsPage` | Workspace, members, RBAC roles, secret keys, integrations, security policy |
