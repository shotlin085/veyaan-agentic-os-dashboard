# Master Execution Plan & Task Roadmap

## Implementation Strategy
We follow an incremental, strictly architecture-guided build loop:
1. Architecture & Control Records (Phase 0)
2. Repository & Next.js Foundation Setup
3. Global Shell & Navigation System (Phase 1)
4. Three Flagship Pages: Command Centre, Personal Assistant, Workflow Studio (Phase 2)
5. Project, Department & Agent Management (Phase 3)
6. Prompt, Skill, Memory & Approval Studios (Phase 4)
7. Logs, QA, Sandboxes & Cost Control (Phase 5)
8. Notifications & Settings (Phase 6)
9. Operational Verification, Test Suite & Hardening (Phase 7)

## Detailed Task Breakdown

### Phase 0 — Architecture & Foundation
- `TASK-0001`: Initialize persistent control documentation system in `docs/dashboard-control/` [DONE]
- `TASK-0002`: Initialize Next.js 14 App Router project in `veyaan-agentic-os-dashboard` with TypeScript, Tailwind CSS, Lucide icons, Framer Motion, React Flow, Zustand, TanStack Query. [IN_PROGRESS]
- `TASK-0003`: Configure Design Tokens, CSS Variables, and Tailwind Theme in `src/app/globals.css`.

### Phase 1 — Global Application Shell
- `TASK-0004`: Build Top Bar Component (Workspace switcher, Project context selector, Search, Command Palette launcher, Environment indicator, Connection status, User menu).
- `TASK-0005`: Build Primary Navigation Rail (16 core routes, icons, badge counters, keyboard focus).
- `TASK-0006`: Build Activity Rail (Live agent updates, pending approvals, system warnings, cost alerts).
- `TASK-0007`: Build Command Palette (`Cmd+K` modal with fuzzy search & immediate actions).
- `TASK-0008`: Build App Shell Layout wrapper (`src/app/layout.tsx` & `src/components/layout/AppShell.tsx`).

### Phase 2 — Flagship Pages
- `TASK-0009`: Flagship Page 1 — Home Command Centre (`src/app/page.tsx`).
  - Hero command input area & Personal Assistant trigger.
  - Priority Strip (Approvals, questions, blocked agents, failed tests).
  - VEYAAN System Map (Original interactive topology visualization of Projects, Departments, Agents, Memory, Sandboxes).
  - Department overview & agent performance cards.
  - Operational internal cost metrics panel.
  - Factual activity stream.
  - Emergency Stop modal.
- `TASK-0010`: Flagship Page 2 — Personal Assistant (`src/app/assistant/page.tsx`).
  - Streaming Hermes conversation workspace.
  - Interactive Requirement Interview Cards.
  - Approval Cards in chat stream.
  - Context Rail (Current project, phase, active agents, session cost).
  - Voice input simulator & push-to-talk controller.
- `TASK-0011`: Flagship Page 3 — Workflow Studio (`src/app/workflows/page.tsx`).
  - Node library palette (20 node categories).
  - Canvas with React Flow, minimap, auto-layout, zoom controls.
  - Configuration inspector panel for node parameters & policies.
  - Bottom execution & lint console.
  - Workflow draft/publish lifecycle controls.

### Phase 3 to 7 — Remaining Pages & Refinements
- `TASK-0012`: Projects Control (`/projects` & `/projects/[id]`)
- `TASK-0013`: Department Management (`/departments` & `/departments/[id]`)
- `TASK-0014`: Agent Management & Agent Factory (`/agents`, `/agents/[id]`, `/agents/factory`)
- `TASK-0015`: Prompt Studio & Skill Studio (`/prompts`, `/skills`)
- `TASK-0016`: Memory Console & Approval Centre (`/memory`, `/approvals`)
- `TASK-0017`: QA Centre, Logs & Observability (`/qa`, `/logs`)
- `TASK-0018`: Sandboxes, JCode & Models/Costs (`/sandboxes`, `/costs`)
- `TASK-0019`: Notifications & Settings (`/notifications`, `/settings`)
- `TASK-0020`: Verification, Accessibility (WCAG 2.2 AA), Automated Tests & Handoff
