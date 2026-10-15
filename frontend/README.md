# Frontend

The local-first smart-home dashboard is a React, Vite, and TypeScript app. Its
room and scene configuration lives in `src/dashboard/rooms.ts` and
`src/dashboard/scenes.ts`. The interface includes Home, Rooms, Scenes, Security,
Devices, Activity, and Settings; Home is a household summary, while Rooms owns
the full room grid.

The UI uses locally bundled Manrope and IBM Plex Mono fonts and makes no Google
Fonts request. Dark and light themes are persisted by the existing theme store.
At 1024px and above, navigation is a left sidebar; below that it becomes a
safe-area-aware bottom bar with Devices, Activity, and Settings under More.

```sh
npm install
npm run dev
npx tsc --noEmit
npm test
npm run build
```

See [the redesign plan](docs/ui-redesign-plan.md),
[design-system reference](docs/design-system.md), and
[before/after browser captures](docs/ui-screenshots/README.md).
