# Security Posture & Audit Audit Record

## Security Principles Enforced

1. **Strict Internal-Only Application Control:**
   - ZERO public pricing, plan upgrades, subscriptions, customer billing, or checkout UI.
   - Access restricted to authenticated VEYAAN internal team members.

2. **No Provider Secrets in Frontend Bundles:**
   - All LLM API keys (OpenAI, Anthropic, Gemini, OpenRouter) remain strictly in backend environment configurations (`veyaan-hermes-orchestrator/.env` and `veyaan-core-backend/.env`).
   - Browser requests communicate only with authenticated internal backend proxy endpoints.

3. **Auditable Emergency Stop & Governance Interlocks:**
   - Emergency Stop Modal (`EmergencyStopModal.tsx`) requires mandatory auditable reason and logs scope shutdown events to backend audit store.
   - High-impact approvals require explicit confirmation and role permission check.

4. **Secret Redaction:**
   - Log explorer automatically redacts Bearer tokens, API keys, and authorization headers (`[REDACTED]`).
