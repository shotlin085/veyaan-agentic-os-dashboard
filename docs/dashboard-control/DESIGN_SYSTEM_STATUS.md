# Design System Tokens & Foundations

## 1. Color Palette (Semantic Design Tokens)

```css
:root {
  /* Surface & Background (Deep near-black navy layers) */
  --bg-app: #060911;           /* Deep space navy background */
  --bg-surface-1: #0A0F1D;     /* Primary surface card */
  --bg-surface-2: #111827;     /* Secondary elevated surface */
  --bg-surface-3: #1F2937;     /* Hover surface / highlight */
  --bg-glass: rgba(10, 15, 29, 0.75);

  /* Luminous Borders */
  --border-subtle: rgba(255, 255, 255, 0.07);
  --border-glow: rgba(0, 240, 255, 0.25);
  --border-active: #00F0FF;

  /* Typography Colors */
  --text-primary: #F3F4F6;
  --text-secondary: #9CA3AF;
  --text-muted: #6B7280;
  --text-inverse: #030712;

  /* Operational Accents */
  --accent-cyan: #00F0FF;       /* Primary operational action & active states */
  --accent-cyan-glow: rgba(0, 240, 255, 0.15);
  --accent-purple: #7C3AED;     /* Hermes intelligence & orchestration */
  --accent-purple-glow: rgba(124, 58, 237, 0.15);

  /* Functional Status Colors */
  --status-success: #10B981;    /* Emerald — Healthy, completed, verified */
  --status-warning: #F59E0B;    /* Amber — Pending approval, caution */
  --status-danger: #EF4444;     /* Red — Critical, emergency, failed */
  --status-working: #3B82F6;    /* Blue — Active agent task execution */
  --status-waiting: #8B5CF6;    /* Violet — Waiting for input/sandbox */
}
```

## 2. Typography Tokens
- **Interface Font:** `Inter`, `Outfit`, `sans-serif`
- **Monospace Font:** `JetBrains Mono`, `Fira Code`, `monospace`
- **Hierarchy:**
  - Display: 32px / 1.2 line-height / SemiBold (700)
  - H1 Page Title: 24px / 1.3 / SemiBold (600)
  - H2 Section Title: 18px / 1.4 / Medium (500)
  - Card Title: 15px / 1.4 / Medium (500)
  - Body: 14px / 1.5 / Normal (400)
  - Small / Caption: 12px / 1.4 / Normal (400)
  - Mono / Code: 13px / 1.4 / Monospace

## 3. Motion & Animation Tokens
- Transition Fast: `150ms cubic-bezier(0.4, 0, 0.2, 1)`
- Transition Normal: `250ms cubic-bezier(0.4, 0, 0.2, 1)`
- Spring Bouncy: `type: "spring", stiffness: 300, damping: 25`
- Reduced Motion Fallback: Opacity transitions only.

## 4. Accessibility Rules
- Contrast ratio >= 4.5:1 for standard text, >= 3:1 for large headings and UI icons.
- Keyboard focus ring: 2px solid `#00F0FF` with `offset-2`.
- Screen reader live region (`aria-live="polite"`) for streaming assistant text and event notifications.
