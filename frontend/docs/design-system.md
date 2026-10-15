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

Switch thumbs slide in 160ms; scene buttons respond to press in 100ms. Views,
the More menu, confirmation prompts, and room details enter in 190ms. There are
no looping or staggered animations. CSS motion is enabled only with
`prefers-reduced-motion: no-preference`; the room dialog also checks that
preference in JavaScript. Motion does not delay commands or change device state.

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
