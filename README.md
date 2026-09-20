# My Sherpa

My Sherpa is a mobile-first React/Next.js offline-first PWA for planning treks in Nepal with community safety reports, an ABC trail package, and nearby services.

New to the codebase? Start with [`docs/EDITING-GUIDE.md`](docs/EDITING-GUIDE.md) for a file-by-file guide to frontend, map, PWA, data and future backend work.

## Setup

Requires Node.js 22+. Install dependencies, then start the development server:

```bash
pnpm install
pnpm dev
```

Create a production build with `pnpm build`. No secrets are required for the mock prototype.

## Architecture

- `app/` — application shell, responsive screens, global design tokens, metadata
- `components/` — reusable trail cards, warnings, Leaflet map, camera report flow, PWA registration, and coordinator dashboard
- `lib/` — shared models, IndexedDB persistence, and route-safety business logic
- `services/` — typed service interfaces and the mock service adapter
- `data/` — realistic mock treks, warnings, and nearby places
- `public/` — product assets, PWA manifest, icons, and offline service worker

UI orchestration stays in the app layer; durable local reports and route packages go through `lib/offlineStore.ts`; route assessment is isolated in `lib/routeSafety.ts`; map rendering and marker interaction live in `components/RouteMap.tsx`; remote-ready trek access goes through `TrekService`.

## Mock data and states

The prototype includes Annapurna Base Camp, Manaslu Circuit, Poon Hill, Langtang Valley, and Mardi Himal. Reports preserve a camera image, GPS coordinates and accuracy, capture time, battery level when exposed, confirmation history, verification status, and a stable client ID. Reports and the ABC offline package survive refresh in IndexedDB. Generated sample evidence is explicitly labeled **Demo evidence** and must not be interpreted as a real incident.

The connectivity UI has Online, Offline, Pending Sync, and Synchronising states. “Sync now” is a deliberately simulated, deduplicated local transition: it does not upload to a server. Coordinator Demo actions are also local but durable.

## Map data

The ABC screen uses Leaflet with switchable Esri World Imagery and OpenTopoMap layers. The main route geometry is sampled from TrekGuard's publicly downloadable recorded GPX planning track for the [Annapurna Base Camp route](https://trekguard.app/routes/annapurna-base-camp/). Named route-side lodges in `data/abcPlaces.json` were queried from OpenStreetMap; phone numbers, capacity, opening status, and availability must be independently verified. The app highlights affected sections but does not invent an automatic detour.

Neither route is a surveyed navigation product. Users must verify junctions, closures, weather, and local guidance before walking. Other trek screens show their regional basemap until verified GPX tracks are added.

## Future backend integration

Implement `TrekService` with a remote adapter and keep its return models stable. Add adapters for weather, satellite/environment monitoring, authentication, notification delivery, map tiles/geocoding, image upload, and backend route/warning processing. Secrets must stay in server-side environment variables—never in browser bundles. Community submissions should be authenticated, virus-scanned, moderated, rate-limited, and geospatially matched to route segments before they affect routing.

For backend integration, replace the simulated sync transition with idempotent uploads keyed by `clientReportId`, return canonical server IDs, and retain an audit trail for confirmation and coordinator status changes. Assistance dispatch is not implemented; the interface only exposes checked phone contacts and downloaded checkpoint information.

## Verification

`node scripts/test-offline-flow.mjs` is the browser automation used during development. It requires a Chromium DevTools target on port 9222 and a local server. The verified flow downloads ABC, reloads offline, saves a report with evidence, confirms IndexedDB persistence after refresh, reconnects, performs one deduplicated simulated sync, verifies the warning in Coordinator Demo, and confirms it appears on the map.
