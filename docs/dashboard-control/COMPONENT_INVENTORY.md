# Component Inventory & Design System Registry

## Shell Components (`src/components/layout/`)
- `AppShell.tsx` — Global operating system container frame
- `TopBar.tsx` — Top bar with identity, workspace switcher, project context, search, environment badge, voice button, emergency stop trigger, user identity
- `NavRail.tsx` — Collapsible 16-route primary navigation rail
- `ActivityRail.tsx` — Collapsible live activity stream & pending approvals panel
- `CommandPalette.tsx` — `Cmd+K` keyboard-driven command palette modal
- `EmergencyStopModal.tsx` — Emergency shutdown protocol modal with auditable scope & reason input

## Shared & Domain Components
- `CommandCentrePage` — Hero prompt input, Priority Strip, VEYAAN Topology System Map, Department Overview, Cost Panel
- `PersonalAssistantPage` — Hermes SSE chat, Requirement Interview Cards, Inline Approval Cards, Context Rail, Composer
- `WorkflowStudioPage` — React Flow graph canvas, 20-category node library, Inspector drawer, Dry-run console
- `PromptStudioPage` — Monaco Markdown prompt editor, model playground, version diff
- `SkillStudioPage` — SKILL.md manifest editor with YAML frontmatter
- `MemoryConsolePage` — RAG vector search & namespace browser
- `ApprovalCentrePage` — Risk-rated approval inbox
- `QACentrePage` — Release confidence & WCAG 2.2 AA audit matrix
- `LogsObservabilityPage` — Correlation event timeline & secret redaction
- `SandboxesJCodePage` — Active coding sandbox runner & terminal output
- `ModelsCostsPage` — Internal provider spend routing & latency metrics
