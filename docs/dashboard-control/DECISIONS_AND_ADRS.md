# Architecture Decision Records (ADRs)

## ADR-001: Next.js App Router & TypeScript Stack
- **Status:** APPROVED
- **Context:** Need a production-grade, modular, responsive, fast, and accessible web operating system.
- **Decision:** Use Next.js 14 App Router, React 18/19, TypeScript in strict mode, Tailwind CSS for styling, shadcn/ui accessible primitives, `@xyflow/react` for visual workflow graph rendering, `@monaco-editor/react` for code/prompt editing, and Framer Motion / `motion` for motion physics.
- **Consequences:** Provides fast SSR/SSG shell loading, client-side dynamic route transitions, strict type safety, and rich UI component library.

## ADR-002: Dual Backend API Adapter & Realtime Event Envelope Pattern
- **Status:** APPROVED
- **Context:** Need to integrate with VEYAAN Hermes Orchestrator (`:8001`) and Core Backend (`:8000`) with zero disruption if services are offline during offline development/testing.
- **Decision:** All frontend API calls pass through typed domain service adapters (`src/lib/api/`). If environment variable `NEXT_PUBLIC_USE_MOCKS` is true or if live endpoints fail, adapters seamlessly return typed fixtures marked as `[LOCAL_DEV_FIXTURE]`. Realtime events use the standardized envelope format: `{ event_id, event_type, occurred_at, workspace_id, project_id, department_id, agent_id, run_id, sequence, severity, payload }`.
- **Consequences:** Guarantees 100% resilient frontend functionality, testability, and zero false claims of completed backend integration.

## ADR-003: Strict Anti-SaaS Policy
- **Status:** APPROVED
- **Context:** User specified this is a private, organisation-owned operating system. Public SaaS pricing, plans, upgrades, subscriptions, trials, checkout, and customer billing UI are strictly forbidden.
- **Decision:** All commercial elements are replaced with internal operational controls: Workspace selector, Environment indicator, Internal Provider Spend & Token usage, Infrastructure Capacity, Security Status, Connected Services, and Emergency Controls.
