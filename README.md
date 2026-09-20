# My Sherpa

My Sherpa is a mobile-first React/Next.js offline-first PWA for planning treks in Nepal with community safety reports, an ABC trail package, and nearby services.

New to the codebase? Start with [`docs/EDITING-GUIDE.md`](docs/EDITING-GUIDE.md) for a file-by-file guide to the frontend, map, PWA, data and server.

## Setup

Requires Node.js 22+. Install dependencies, then start the development server:

```bash
npm install
npm run dev
```

Create a production build with `npm run build`. No secrets are required for local development.

## Architecture

- `app/` — application shell, responsive screens, API routes, global design tokens, metadata
- `components/` — reusable trail cards, warnings, Leaflet map, camera report flow, PWA registration, and coordinator dashboard
- `lib/` — shared models, IndexedDB persistence, and route-safety business logic
- `services/` — typed client interfaces for trek data and warning API access
- `data/` — realistic mock treks, warnings, and nearby places
- `db/` and `drizzle/` — D1 schema and SQL migrations
- `public/` — product assets, PWA manifest, icons, and offline service worker

UI orchestration stays in the app layer; durable local reports and route packages go through `lib/offlineStore.ts`; route assessment is isolated in `lib/routeSafety.ts`; map rendering and marker interaction live in `components/RouteMap.tsx`; remote-ready trek access goes through `TrekService`.

## Mock data and states

The prototype includes Annapurna Base Camp, Manaslu Circuit, Poon Hill, Langtang Valley, and Mardi Himal. Reports preserve a camera image, GPS coordinates and accuracy, capture time, battery level when exposed, confirmation history, verification status, and a stable client ID. Reports and the ABC offline package survive refresh in IndexedDB. Generated sample evidence is explicitly labeled **Demo evidence** and must not be interpreted as a real incident.

The navigation does not show a permanent connectivity banner. Unsynced reports are shown where action is useful: Community displays a pending count and a **Sync** action. Reports are written to IndexedDB first, then uploaded through `/api/warnings` to D1. A stable `clientReportId` makes retries idempotent. Coordinator Demo status changes use the same API and remain queued locally if the connection fails.

## Map data

The ABC screen uses Leaflet with switchable Esri World Imagery and OpenTopoMap layers. The main route geometry is sampled from TrekGuard's publicly downloadable recorded GPX planning track for the [Annapurna Base Camp route](https://trekguard.app/routes/annapurna-base-camp/). Named route-side lodges in `data/abcPlaces.json` were queried from OpenStreetMap; phone numbers, capacity, opening status, and availability must be independently verified. The app highlights affected sections but does not invent an automatic detour.

Neither route is a surveyed navigation product. Users must verify junctions, closures, weather, and local guidance before walking. Other trek screens show their regional basemap until verified GPX tracks are added.

## Backend and future integration

Warning storage is implemented with Next/Vinext API routes and Cloudflare D1. `GET /api/warnings` lists reports, `POST /api/warnings` creates or idempotently retries a report, and `PUT /api/warnings/:id` saves coordinator changes. The browser keeps the offline-first IndexedDB copy and sync queue.

Production hardening should move image data to R2/object storage, add authentication and roles, retain an immutable audit trail, validate and resize uploads, rate-limit submissions, and add adapters for weather, satellite/environment data, notifications, geocoding and route processing. Secrets belong in server-side environment variables—never browser bundles. Assistance uses direct-call guidance and downloaded emergency/checkpoint information; it does not claim a dispatch was sent.

## Verification

`node scripts/test-offline-flow.mjs` is the browser automation used during development. It requires a Chromium DevTools target on port 9222 and a local server. The flow downloads ABC, reloads offline, saves a report with evidence, confirms IndexedDB persistence after refresh, reconnects, performs one idempotent API sync, verifies the warning in Coordinator Demo, and confirms it appears on the map.
