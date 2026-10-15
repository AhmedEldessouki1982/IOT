# Smart Home Dashboard Redesign Plan

## Direction

Design for a household member standing at the entry or holding a phone: room
state should read in a glance, and the first actions should be lights, door,
scenes, and shutdown. Installer detail stays available in its own sections.
The visual signature is a warm amber lit state against quiet graphite or
chalk surfaces; the amber is reserved for an active light and its room.

## Tokens

### Color

| Token | Dark | Light | Use |
| --- | --- | --- | --- |
| `--color-canvas` | `#141511` | `#F4F3EE` | App background |
| `--color-surface` | `#1D1F19` | `#FFFFFF` | Cards and sidebar |
| `--color-surface-raised` | `#282A23` | `#EAEAE3` | Nested rows and selected controls |
| `--color-text-primary` | `#F4F2E9` | `#20221C` | Primary text |
| `--color-text-secondary` | `#B9BCAF` | `#55594F` | Supporting text; minimum 4.5:1 |
| `--color-accent` | `#F2B544` | `#805000` | Lit state and primary action |
| `--color-ok` | `#72C993` | `#246B3D` | Secure and healthy states |
| `--color-danger` | `#F07B74` | `#A12620` | Alarm and offline state |
| `--color-boundary` | `#686B60` | `#77796F` | Control and panel boundaries; minimum 3:1 |

The six base colors per theme are canvas, surface, raised surface, primary
text, secondary text, and accent. The functional tokens `--color-ok`,
`--color-danger`, and `--color-boundary` add status and boundary colors;
`--color-boundary-soft`, `--color-accent-ink`, and `--color-overlay` are
supporting values. Semantic colors never carry status alone. Borders use solid
neutral tokens, never translucent white overlays. Dark and light accents are
chosen independently for contrast.

### Type

- UI and body: **Manrope Variable**. Its open counters and sturdy numerals suit
  a wall display viewed at a distance while keeping household copy familiar.
- Device identifiers only: **IBM Plex Mono**. Its forms distinguish technical
  ids in the installer registry without turning normal labels into code.
- Display role: Manrope Variable at a heavier weight for the greeting and
  prominent counts, keeping the interface to one downloaded family.

Six sizes: `12px`, `14px`, `16px`, `20px`, `26px`, `34px`, exposed as
`--font-size-xs` through `--font-size-2xl`. Body copy uses 14px or larger.

### Spacing, radius, motion

- Spacing scale: `4px`, `8px`, `12px`, `16px`, `24px`, `32px`, `40px`, `48px`.
- Radii: `6px` for controls and `12px` for grouped surfaces.
- Motion durations: `100ms` for pressed feedback, `160ms` for state changes,
  and `190ms` for room detail open/close. Reduced-motion mode removes them.
- Breakpoints: `640px` for compact layout adjustments and `1024px` for the
  persistent sidebar; mobile navigation applies below 1024px.

## Layout

Desktop uses a fixed-width left navigation rail and a flexible content column.
At widths below 1024px, the navigation becomes a safe-area-aware bottom tab
bar with a More menu for the three installer sections.

### Home, desktop (>=1024px)

```text
+------------------+  +---------------------------------------------------+
| Home             |  | Hi, Ahmed                         Tue 12:30       |
| Rooms            |  | Live home status                                    |
| Scenes           |  +---------------------------------------------------+
| Security         |  | Lights on | Doors | Sensors | Hub | Last activity |
| Devices          |  +---------------------------+-----------------------+
| Activity         |  | Quick actions             | Active now            |
| Settings         |  | Evening Cooking Away      | Kitchen pendant       |
|                  |  | Shut down...              | Reception ceiling     |
|                  |  +---------------------------+-----------------------+
|                  |  | Recent activity                                  |
|                  |  | Door locked                         12:24       |
+------------------+  +---------------------------------------------------+
```

### Home, mobile (390px)

```text
+--------------------------------------+
| Hi, Ahmed                 12:30      |
| Offline notice appears below when needed |
+--------------------------------------+
| Lights on   Doors   Sensors   Hub    |
+--------------------------------------+
| Quick actions                        |
| Evening   Cooking   Away             |
| Shut down home                       |
+--------------------------------------+
| Active now                           |
| [icon] Kitchen pendant          ON   |
| [icon] Reception ceiling        ON   |
+--------------------------------------+
| Recent activity                      |
| Front door locked              12:24 |
+--------------------------------------+
| Home  Rooms  Scenes  Security  More  |
+--------------------------------------+
```

### Rooms, desktop (>=1024px)

```text
+------------------+  +---------------------------------------------------+
| Home             |  | Rooms                                             |
| Rooms             |  | Seven rooms, equal-width cards, content height.   |
| Scenes           |  +----------------------+----------------------------+
| Security         |  | Reception            | Kitchen                    |
| Devices          |  | icon  name  1 of 4 on| icon  name  2 of 9 on     |
| Activity         |  | device rows          | device rows                |
| Settings         |  +----------------------+----------------------------+
|                  |  | Main Toilet          | Corridor                   |
|                  |  | device rows          | device rows                |
|                  |  +----------------------+----------------------------+
|                  |  | Small Bedroom        | Bedroom 2                  |
|                  |  +----------------------+----------------------------+
|                  |  | Master Suite                                      |
+------------------+  +---------------------------------------------------+
```

### Rooms, mobile (390px)

```text
+--------------------------------------+
| Hi, Ahmed                 12:30      |
| Offline notice appears below when needed |
+--------------------------------------+
| Rooms                                |
+--------------------------------------+
| Reception                1 of 4 on   |
| [icon] Reception ceiling       [on]  |
| [icon] Front door             Locked |
| [icon] Room temperature       21.5 C |
| [icon] Line 1                  [off] |
+--------------------------------------+
| Kitchen                  2 of 9 on   |
| [icon] Kitchen light         [on]    |
| ...                                  |
+--------------------------------------+
| Home  Rooms  Scenes  Security  More  |
+--------------------------------------+
```

Room cards use `repeat(auto-fill, minmax(320px, 1fr))` with start alignment;
below that minimum they occupy one column. Each device follows one row anatomy:
20px icon, label and optional detail, right-aligned value or control, at least
52px high. Gang switches use the same row and retain their existing timer and
press gestures.

## Navigation and Interaction

- At 1024px and above, keep all seven sections visible in a persistent sidebar
  with icon, label, and a non-color active marker.
- Below 1024px, show Home, Rooms, Scenes, Security, and More in the bottom bar;
  More opens Devices, Activity, and Settings. Each item has a 48px minimum hit
  area and the bar includes `env(safe-area-inset-bottom)` padding.
- The header contains the greeting, clock, and a single status line. Offline
  state is a persistent banner below it; local demo controls remain usable.
- Scenes appear in Home and Scenes. Theme selection belongs in Settings. The
  room/device count belongs in the Devices summary.
- Shutdown is available in Home quick actions and Security and asks for an
  explicit confirmation before invoking the existing shutdown handler.
- Active devices on Home are sorted with lights first; activity remains a
  short chronological list. Rooms owns the only full room grid.

## Self-critique

The KPI strip, sidebar, and equal-width card grid are familiar dashboard
patterns. I reduced their template feel by removing chart-like decoration and
extra labels, keeping the KPI cells quiet, and making the one memorable state
the warm lit room/device treatment. The mobile bar could resemble a generic
five-tab app; it is limited to the four household destinations plus a clearly
named More menu so installer sections do not crowd the touch controls.
