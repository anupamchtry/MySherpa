# My Sherpa

My Sherpa is a mobile-first React/Next.js prototype for planning treks in Nepal with community safety reports, route-impact detection, safer alternatives, and nearby services.

## Setup

Requires Node.js 22+. Install dependencies, then start the development server:

```bash
pnpm install
pnpm dev
```

Create a production build with `pnpm build`. No secrets are required for the mock prototype.

## Architecture

- `app/` — application shell, responsive screens, global design tokens, metadata
- `components/` — reusable trail cards, warning cards, and map UI
- `lib/` — shared models and route-safety business logic
- `services/` — typed service interfaces and the mock service adapter
- `data/` — realistic mock treks, warnings, and nearby places
- `public/` — local product assets and favicon

UI state stays in the app layer; route assessment is isolated in `lib/routeSafety.ts`; map rendering and marker interaction live in `components/RouteMap.tsx`; data access goes through `TrekService`. This keeps the prototype easy to replace piece by piece.

## Mock data and states

The prototype includes Annapurna Base Camp, Manaslu Circuit, Poon Hill, Langtang Valley, and Mardi Himal. It models active landslide, bridge, and weather warnings plus lodges, local businesses, energy stops, and trekking groups. Search loading, no-results, error toast, upload preview, and browser offline states are represented.

## Future backend integration

Implement `TrekService` with a remote adapter and keep its return models stable. Add adapters for weather, satellite/environment monitoring, authentication, notification delivery, map tiles/geocoding, image upload, and backend route/warning processing. Secrets must stay in server-side environment variables—never in browser bundles. Community submissions should be authenticated, virus-scanned, moderated, rate-limited, and geospatially matched to route segments before they affect routing.

The client also registers read-only WebMCP tools for trek search and opening a route plan when a supporting browser is available.
