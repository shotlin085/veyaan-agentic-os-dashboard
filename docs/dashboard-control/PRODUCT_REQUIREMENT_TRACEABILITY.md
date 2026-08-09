# Product Requirement Traceability Matrix

| Requirement | Category | Target File / Component | Verification Criteria | Status |
|---|---|---|---|---|
| Single organization-owned control plane | Shell | `AppShell.tsx` | No SaaS pricing or checkout UI present | VERIFIED |
| Top bar with workspace & project switcher | Shell | `TopBar.tsx` | Displays workspace & global project selector | VERIFIED |
| Emergency Stop Protocol | Core Safety | `EmergencyStopModal.tsx` | Auditable shutdown scope selection & confirmation | VERIFIED |
| Command Palette (`Cmd+K`) | Navigation | `CommandPalette.tsx` | Fuzzy search and shortcut execution | VERIFIED |
| Flagship 1: Home Command Centre | Page | `src/app/page.tsx` | Hero assistant input, priority strip, interactive topology map | VERIFIED |
| Flagship 2: Personal Assistant | Page | `src/app/assistant/page.tsx` | Hermes SSE stream, interview cards, inline approvals, context rail | VERIFIED |
| Flagship 3: Visual Workflow Studio | Page | `src/app/workflows/page.tsx` | React Flow graph canvas, node library, inspector, dry run | VERIFIED |
| Projects Control | Page | `src/app/projects/page.tsx` | List of AI projects, phases, spend, milestone trees | VERIFIED |
| Department Management | Page | `src/app/departments/page.tsx` | 5 internal company divisions, manager, workload, health | VERIFIED |
| Agent Management & Factory | Page | `src/app/agents/page.tsx`, `/factory` | Agent cards, contract wizard, model policy, budget | VERIFIED |
| Prompt Studio | Page | `src/app/prompts/page.tsx` | Monaco markdown editor, variables, version diff | VERIFIED |
| Skill Studio | Page | `src/app/skills/page.tsx` | SKILL.md manifest editor, YAML frontmatter, tool policy | VERIFIED |
| Memory Console | Page | `src/app/memory/page.tsx` | RAG pgvector search, namespace filter, memory proposals | VERIFIED |
| Approval Centre | Page | `src/app/approvals/page.tsx` | Governance inbox, risk/impact badges, approve/reject buttons | VERIFIED |
| QA Centre | Page | `src/app/qa/page.tsx` | Release confidence (98.4%), WCAG 2.2 AA audit, defect tracking | VERIFIED |
| Observability & Correlation Logs | Page | `src/app/logs/page.tsx` | Event sequence timeline, JSON payload viewer, secret redaction | VERIFIED |
| Sandboxes & JCode Console | Page | `src/app/sandboxes/page.tsx` | Session runner output, terminal stream, git diff viewer | VERIFIED |
| Models & Costs Routing | Page | `src/app/costs/page.tsx` | Internal provider spend, latency, fallback routing | VERIFIED |
| Notification Centre | Page | `src/app/notifications/page.tsx` | Priority alert list, action-required cards | VERIFIED |
| Security & Organization Settings | Page | `src/app/settings/page.tsx` | Internal user session, RBAC role, zero billing UI | VERIFIED |
