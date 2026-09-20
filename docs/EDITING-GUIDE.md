# My Sherpa editing guide

This guide explains where to make common changes without having to understand the whole project first.

## Start here

Trek, route and seed warning data live in local files. User reports, confirmations, coordinator actions and the ABC download persist in browser IndexedDB. Reports and coordinator changes also synchronise through server API routes to Cloudflare D1.

Run the project from the `MySherpa` folder:

```bash
npm run dev
```

Open the local address shown in the terminal. Stop it with `Ctrl+C`. Before keeping a change, run:

```bash
npx tsc --noEmit
npm run build
```

## Frontend: what users see

### Main screens and navigation

Edit `app/page.tsx` for:

- top and bottom navigation;
- Home, Explore, Nearby, Community and Trek Details screen composition;
- opening and closing the warning form;
- selected trek and selected warning state;
- download, sync and coordinator action orchestration.

This is the first file to inspect when adding a new screen or changing the order of information on a screen.

### Colors, spacing and mobile layout

Edit `app/globals.css` for:

- colors in the `:root` variables;
- button sizes and visibility;
- cards, map overlays and modal layout;
- mobile rules inside `@media (max-width: 640px)`;
- tablet rules inside `@media (max-width: 900px)`.

Prefer changing a shared variable such as `--green` instead of replacing the same color in many places. Test mobile layouts around 360 px, 390 px and 430 px widths.

### Trek cards and warning cards

- `components/TrailCard.tsx`: trek cards used on Home and Explore.
- `components/WarningCard.tsx`: community warning cards, evidence and report counts.
- `components/WarningComposer.tsx`: camera, photo capture, GPS, time, battery and warning form submission.
- `components/CoordinatorDashboard.tsx`: pending queue, verification actions and coordinator statistics.

Keep a component responsible for one job. For example, camera logic belongs in `WarningComposer.tsx`, not in `app/page.tsx`.

### Map and routing

Edit `components/RouteMap.tsx` for:

- Leaflet setup and map layers;
- trail, warning, place and current-position markers;
- affected-section styling;
- map popups and route comparison controls.

The recorded ABC route is in `data/abcRoute.json`. Named route places are in `data/abcPlaces.json`. `data/abcAlternativeRoute.json` is retained as an unused experiment; the product no longer presents it as an automatic safe route.

Do not manually invent coordinates for production routing. A backend routing service should calculate routes and return GeoJSON with its source, creation time and constraints.

## Data: easiest place to practise

Edit `data/mockData.ts` to add or change:

- treks;
- sample warnings;
- nearby cards.

Every warning must match the `Warning` shape in `lib/models.ts`, including `status`, `reportCount`, `evidence` and coordinates.

Edit `lib/models.ts` when introducing a new shared field. TypeScript will then show every place that needs updating.

## Business logic and services

- `lib/routeSafety.ts`: decides whether warnings affect a route and returns the route assessment.
- `lib/offlineStore.ts`: IndexedDB reads and writes for reports and downloaded route packages.
- `services/trekService.ts`: defines the frontend-facing data service and its current mock implementation.
- `services/warningApi.ts`: browser client for report listing, upload and coordinator updates.
- `app/api/warnings/`: server routes and D1 warning repository.
- `db/schema.ts` and `drizzle/`: database schema and migrations.

Keep decisions such as “does this warning affect the route?” out of visual components. That makes the same logic reusable by a backend, mobile app or automated test.

## PWA and offline behavior

- `public/manifest.webmanifest`: install name, colors, icons and standalone behavior.
- `public/sw.js`: files cached for offline use and fetch behavior.
- `components/PwaRegister.tsx`: registers the service worker in production.
- `app/layout.tsx`: page metadata, viewport and PWA manifest connection.

When changing cached assets, change `CACHE_NAME` in `public/sw.js` so installed devices receive a new cache.

Camera, GPS and battery APIs should be tested over HTTPS or localhost. Battery information is not available in every browser, so the interface must continue working when it is missing.

## Backend and production hardening

The warning backend already provides durable D1 storage and idempotent retries keyed by `clientReportId`. Apply `drizzle/0000_trail_warnings.sql` when provisioning a new database. Before a public production launch, add:

1. Authentication and roles: trekker, guide, coordinator and administrator.
2. Warning API: create reports, upload images, moderate content and record audit history.
3. Media storage: signed uploads, virus scanning, image resizing and private originals.
4. Route processor: match verified warnings to trail segments; only return an alternative when a real routing service can provide provenance and constraints.
5. Nearby data: periodically import and refresh OpenStreetMap or partner listings.
6. Notifications: alert users whose saved route intersects a new verified hazard.
7. Audit and conflict handling: preserve every moderation transition and resolve concurrent edits explicitly.

Keep browser code talking through service modules. Current warning endpoints are:

```text
GET  /api/warnings
POST /api/warnings
PUT  /api/warnings/:id
```

Future trek, media and routing services can add endpoints without moving request code into visual components.

Never put database passwords, map-provider secrets or private API keys in React files or `public/`. Keep them in server-side environment variables.

## A safe way to make your first edits

1. Change one visible label in `app/page.tsx`.
2. Change one shared color in `app/globals.css`.
3. Add one trek to `data/mockData.ts`.
4. Run the TypeScript check and production build.
5. Review the mobile screen before making the next change.

Small, verified changes are easier to learn from and easier to undo.
