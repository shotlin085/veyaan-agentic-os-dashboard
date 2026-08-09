# Accessibility Compliance Matrix (WCAG 2.2 AA)

## Guidelines & Verification Status

1. **Color Contrast (1.4.3 & 1.4.11):**
   - Text contrast >= 4.5:1 against deep navy background (`#060911`).
   - Active operational cyan (`#00F0FF`) contrast verified on dark card surfaces (`#0A0F1D`).
   - Non-color status indicators: All status badges include explicit text labels (e.g. "Working", "Approved", "Pending").

2. **Keyboard Navigation & Visible Focus (2.4.7):**
   - Visible focus ring: `2px solid #00F0FF` with `offset-2` configured in `globals.css`.
   - Command palette trigger accessible via `Cmd+K` or `Ctrl+K`.
   - All interactive controls (TopBar, NavRail, ActivityRail, Modals) fully tabbable.

3. **Screen Reader Announcements & Live Regions (4.1.3):**
   - Realtime event streams and assistant streaming responses announce via `aria-live="polite"`.
   - Modals trap focus and manage ARIA dialog attributes (`role="dialog"`).

4. **Reduced Motion (2.3.3):**
   - Framer motion / CSS animations respect `prefers-reduced-motion: reduce`.
