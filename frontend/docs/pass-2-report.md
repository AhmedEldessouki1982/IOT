# Dashboard Pass 2

## Phase 0

Ubuntu 400/500/700 and Ubuntu Mono 400/700 replace Manrope and Plex. Font
registration and valid weights are tested. Live numerals use the mono family.
This commit also incorporates the previously uncommitted frontend refinements
from the preceding request (sidebar, Home grouping, switch feedback); subsequent
phases reconcile their motion with the new no-initial-animation policy.

Commit: `b8946bd`. Files: `package.json`, `package-lock.json`, `src/main.tsx`,
`src/styles/{tokens,base,refinements}.css`, `src/styles/components/{devices,panels}.css`,
`src/App.tsx`, `src/dashboard/{RoomCard,RoomDetail}.tsx`, `test/font-tokens.test.mjs`,
and these design/report docs.

## Phase 1

Commit: `c10b603`. Appliance icons now reach the row (the exhaustive icon map
already existed). Demo rows no longer receive misleading red dots. Live rows
show labeled reporting status, including stale/missing data. Room chips only add
information; row dividers, chevrons, quick actions, mobile tabs and KPIs align.

Files: `src/components/{DeviceConnection,SwitchCard}.tsx`,
`src/dashboard/RoomCard.tsx`, `src/features/devices/CardDevice.tsx`,
`src/styles/refinements.css`, `test/device-icons.test.mjs`.

## Phase 2

Commit: `31fc0e5`. Tokenized motion, reduced-motion configuration, initial-value
guards, a local-action registry, bounded stagger and cancellable RAF numbers.

Files: `src/hooks/{localActions,motionTokens,useAnimatedNumber,useExternalChange,useStateChange}.ts`,
`src/hooks/motionRules.{js,d.ts}`, `src/main.tsx`,
`src/styles/{tokens,refinements}.css`, `test/{motion-decisions,motion-rules}.test.mjs`.

## Phase 3

Commit: `e44ad02`. Lit-state tint/icon feedback, local-versus-external flashes,
polite announcements, and lock-shackle/confirmation motion. Initial REST data
is gated by MotionReadiness; first observed device values do not flash.

Files: `src/App.tsx`, `src/main.tsx`,
`src/components/{DeviceMotion,LockIcon,SwitchCard}.tsx`,
`src/dashboard/RoomDetail.tsx`, `src/features/devices/CardDevice.tsx`,
`src/features/devices/kinds/LockDevice.tsx`,
`src/hooks/{MotionReadiness,useExternalChange,useStateChange}.ts`,
`src/styles/components/rooms.css`, `src/styles/motion.css`.

## Phase 4

Commit: `8cf9b8d`. Optional `durationSeconds` is included in existing timer
snapshots/broadcasts and persistence. Old JSON remains valid; no command or
expiry behavior changes. The UI ring uses that total, or the first observed
remaining value cached by device and expiry. The last 60 seconds pulse only
when motion is enabled; removal fades out.

Files: `src/components/{SwitchCard,TimerBadge}.tsx`,
`src/dashboard/{RoomCard,RoomDetail}.tsx`, `src/hooks/useTimers.ts`,
`src/hooks/timerVisual.{js,d.ts}`, `src/styles/motion.css`,
`test/timer-visual.test.mjs`; backend `nestjs/src/timers/{timers,timer-persistence}.service.ts`
and `nestjs/test/{timers-automation,timer-duration-persistence}.test.mjs`.

## Phase 5

Commit: `dfbab9a`. Scene dispatch/done/retry feedback and visual-only stagger;
hold-to-shutdown with accessible native confirmation; animated counts; concurrent
view transitions; shared room expansion; reconnect banner with bounded-purpose pulse.

Files: `src/App.tsx`, `src/components/{ConnectionBanner,EmergencyShutdown,HomeStatusStrip,SceneActionButton,SceneControls,StatusValue,ViewFrame}.tsx`,
`src/dashboard/{RoomCard,RoomDetail}.tsx`, `src/hooks/useSceneRunner.ts`,
`src/styles/motion.css`, `src/views/ScenesView.tsx`.

## Phase 6

Commit: the final `feat(frontend): add safe opt-in wall-panel idle mode` commit
containing this report. The URL, local Settings and environment default can opt
in; household mode defaults off. Idle defaults to five minutes; zero disables it.
The overlay shows clock/date/hub/home summary and moves the clock each minute.
Capturing listeners consume the whole first pointer/touch/key gesture, including
multiple fingers. An open confirmation dialog prevents idle entry.

Files: `.env.example`, `src/App.tsx`, `src/components/KioskOverlay.tsx`,
`src/hooks/{useKiosk.ts,idleMachine.js,idleMachine.d.ts}`, `src/views/SettingsView.tsx`,
`test/idle-machine.test.mjs`, `scripts/verify-motion.mjs`, `docs/motion-captures/*`,
`docs/{design-system,ui-redesign-plan,pass-2-report}.md`.
Final browser-review fixes also touch `EmergencyShutdown.tsx`, `LockDevice.tsx`,
`HomeView.tsx`, `localActions.ts`, `useAnimatedNumber.ts`, `motionRules.{js,d.ts}`,
`motion-decisions.test.mjs`, and `styles/{motion,refinements,tokens}.css`: stable
lock dimensions, genuine label crossfade, scene flashes on newly visible active
rows, hold cancellation on blur, and token-driven easing.

## Command Results

After every phase, ran `npx tsc --noEmit && npm test && npm run build` in
`frontend/`. All completed with exit code 0. The test runner reports files as
top-level tests; counts below are passing test files, not individual assertions.

| Phase | TypeScript | Test output | Vite CSS output |
| --- | --- | --- | --- |
| 0 | Passed | 4 pass, 0 fail | 39.09 kB |
| 1 | Passed | 5 pass, 0 fail | 40.56 kB |
| 2 | Passed | 7 pass, 0 fail | 40.91 kB |
| 3 | Passed | 7 pass, 0 fail | 43.88 kB |
| 4 | Passed | 8 pass, 0 fail | 44.61 kB |
| 5 | Passed | 8 pass, 0 fail | 46.14 kB |
| 6 | Passed | 9 pass, 0 fail | 47.64 kB |

Phase 4 backend: `cd nestjs && npm test` built successfully and reported
`5 pass, 0 fail`. MQTT remained mocked. Final frontend output: 2330 modules
transformed, JS 395.60 kB (124.22 kB gzip), CSS 47.64 kB (8.19 kB gzip).
The build contains Ubuntu/Ubuntu Mono assets and no Manrope/Plex assets.
No existing dashboard structural test was weakened or removed.

## Browser Evidence

`scripts/verify-motion.mjs` ran through an isolated headless Chrome's DevTools
Protocol with fake fetch responses and injected socket-state callbacks. The
configured Chrome MCP connector still could not attach; this is direct CDP,
not an MCP test. No physical relay commands were sent.

`docs/motion-captures/results.json` records all results. The adjacent `index.html`
opens the 76-frame gallery: lit state, external update, lock, timer, scene,
idle and wake. Captures use 1440x900 and 390x844 with reduced motion on and off.

- Ubuntu is loaded and is the first computed body family in all four runs.
- 56 view/theme/viewport/motion combinations: no horizontal overflow or targets below 44px.
- No initial device flashes; no infinite animations when online with no timers/kiosk.
- Lit animation runs normally and is absent under reduced motion.
- Injected external update flashes and announces the affected light.
- Zero measured layout shift across the tested light/external/lock sequence.
- Timer ring reflects 45/600 seconds; one allowed warning loop normally, zero with reduced motion.
- Scene feedback reaches done and announces the scene; commands dispatch immediately.
- Short shutdown holds cancel, long holds apply, and keyboard confirmation opens without commands.
- Pointer and keyboard waking send no commands and dismiss the overlay.
- No JavaScript exceptions were recorded.

## Defaults, Limits and Deviations

- Default idle: 5 minutes; 0 disables. Settings accepts 0 to 120 whole minutes.
- Shutdown hold: 1.2 seconds. Local-action suppression: 1.5 seconds.
- No animated properties outside the allowed set were intentionally introduced.
- The first phase includes the prior request's uncommitted visual refinements;
  the last phase includes small fixes found during the requested browser review.
- Scene completion is optimistic. Existing store methods swallow network
  failures and expose no hardware acknowledgment. Their behavior was preserved;
  known offline scenes surface partial application/retry, and rejected callbacks
  surface an error. Detecting all delivery failures requires a future store/API change.
- Backend changes are restricted to timer-duration metadata and related tests.
- The ring's legacy fallback is session-local; reloading an old-format timer
  starts its fallback total at the remaining value then observed.
- Captures accelerate the one-minute idle timeout only; they exercise production
  capture listeners and state-machine logic. Native multi-finger touch safety is
  unit-tested; browser wake checks use mouse and keyboard at both viewport sizes.
- Layout-shift measurements cover the isolated state-change sequence, not every
  possible content insertion or scene/device combination. No real wall-panel
  hardware performance or physical Tasmota behavior was verified.
- This pass's CSS is larger than the prior pass's 43 kB budget, chiefly due to
  the five self-hosted font weights and new requested motion/idle styles. The
  pass-2 acceptance criteria did not repeat that budget; no external font requests
  or additional runtime libraries were introduced.
- No commits were pushed.
