# Frontend Design System

## Tokens

`src/styles/tokens.css` is the only source for color values. It defines dark
and light themes with six core colors (canvas, surface, raised surface, primary
text, secondary text, amber accent), plus semantic good/danger colors and
neutral boundaries. Text and boundary contrast is checked in
`test/design-tokens.test.mjs`.

Ubuntu is the self-hosted UI family, using only 400, 500, and 700 weights.
Ubuntu Mono 400/700 provides stable widths for clocks, countdowns and live
numbers as well as device IDs. The registered family names are tested against
the package CSS. Noto Sans Arabic is an installed-system fallback for Arabic;
it is not downloaded by the dashboard. The six-size scale remains unchanged.

The six type roles are 12, 14, 16, 20, 26, and 34px (`xs` through `2xl`). The
spacing scale is 4, 8, 12, 16, 24, 32, 40, and 48px. Controls use a 6px radius;
grouped surfaces use 12px. Motion tokens are 100, 160, and 190ms; reduced
motion removes nonessential transitions.

## Interaction Refinement

The sidebar carries the home-control identity and an appearance shortcut. Home
uses one divided status strip, full-width scene actions, and adjacent active-device
and activity lists. Sections remain unframed so the controls carry the emphasis.

See the motion catalog below for timings and reduced-motion behavior.

## Motion

Every timing lives in `styles/tokens.css`; JavaScript reads it through
`hooks/motionTokens.ts`. Standard and emphasized easing use named cubic-bezier
tokens; rings use the linear easing token.

| Token | Milliseconds | Behavior |
| --- | ---: | --- |
| press | 100 | Button feedback |
| state | 160 | Switch track/thumb, label fade, timer exit |
| view | 180 | View and connection-banner transitions |
| panel | 190 | Room detail expansion |
| off | 200 | Room tint off |
| lock | 220 | Shackle settle and outline confirmation |
| lit | 280 | Room tint and icon emphasis |
| number | 400 | Integer count interpolation |
| flash | 900 | External device highlight |
| scene-step | 90 | Visual-only stagger, capped at eight steps |
| tick | 1000 | Timer ring depletion and final-minute pulse |
| done / hold | 1200 | Scene confirmation / deliberate shutdown hold |
| idle | 1500 | Wall-panel dimming and reconnect pulse |
| drift | 2000 | Idle clock position change |

### Behavior Catalog

- Light/appliance: thumb slides and icon briefly scales to 1.08; a room's warm
  tint is a pseudo-element opacity change. There is no animated shadow.
- External update: `useExternalChange` ignores the first observed value and
  local actions within 1500ms. An accent overlay fades from 18% opacity while
  a polite live region announces the new state. Scene changes use the same
  overlay, with visual delays only; commands are dispatched immediately.
- Lock: the custom SVG shackle rotates/translates, text fades, and the outline
  confirms once. The control has a fixed width to prevent label-induced shifts.
- Timer: a 28px ring represents remaining/original seconds. New backend timers
  persist `durationSeconds`; old timers use their first observed remainder,
  cached per device and expiry while the app runs. Only the final 60 seconds
  pulse. Removal fades the ring out.
- Scenes: idle, dispatching, done, or retry state. There is no fake looping
  spinner. Existing store promises do not expose HTTP/MQTT delivery failures;
  done means local/optimistic application, not a hardware acknowledgement.
  Known offline live-device scenes show partial-application guidance and retry.
- Shutdown: hold for 1.2 seconds; releasing early cancels. Keyboard/assistive
  activation opens a native modal with Cancel and Shut down. Commands are unchanged.
- KPIs: only subsequent numeric changes interpolate; other values fade. Live
  digits use Ubuntu Mono. Initial data loading is suppressed by MotionReadiness.
- Views: concurrent presence transitions accept input immediately; shared room
  expansion uses the same token system. Initial mounting does not animate.
- Connection: the banner fades/slides; only actual reconnect attempts enable
  its pulse. It disappears when connected.
- Wall panel: opt in with `?kiosk=1`, the local Settings switch, or
  `VITE_KIOSK_DEFAULT=true`. Five minutes is the default; zero disables idle.
  Settings persist locally. Disabling removes the enabling URL parameter.
  A clock/date/status summary drifts every minute. Household mode stays awake.
  Capturing listeners consume the complete waking pointer/touch/key sequence.

### Adding Motion Safely

Use `useStateChange`, `useExternalChange` and `useAnimatedNumber`; do not infer
changes from rendering or remounting. Register local actions by the same device
key used by the row. Keep callbacks and command timing independent of animation.
Prefer opacity and transforms; color and SVG stroke transitions are allowed.
Never animate dimensions, position offsets, shadows, filters, or `transition: all`.
Loops are limited to reconnect feedback, the final timer minute, and idle drift.
Anything beyond the eighth staggered item shares the last batch's delay.

CSS motion lives behind `prefers-reduced-motion: no-preference`. Framer Motion
uses the user preference globally and explicit reduced durations for presence.
Reduced motion also removes scene stagger and idle drift. Test the pure decisions,
run the font/token/motion-rule checks, and use `scripts/verify-motion.mjs` with an
isolated debugging Chrome to inspect both motion modes with mocked API traffic.

## Anatomy

- Device row: 28px icon, flexible label, then a right-aligned value or control; minimum 52px tall.
- Room card: room icon and name, light count, status line aligned to the title, then every device row.
- Active rooms use a restrained amber surface tint; the rest use neutral surfaces and 1px boundaries.
- Desktop navigation is a persistent labeled sidebar. Smaller screens use four household tabs and a More menu, with safe-area padding.
- Devices uses a semantic table on wide screens and labeled stacked rows on compact screens.

## Do Not

- Add per-room accent colors, decorative gradients, blur, HUD corners, or ambient glow.
- Use uppercase tracked labels, ordinary monospace labels, or dot-separated end-user metadata.
- Put unrelated nested cards inside section cards or create a second device-control pattern.
- Use color alone for state, shrink targets below 44px, or remove visible keyboard focus.
- Add runtime font/CDN requests; the dashboard must remain readable on an offline LAN.
