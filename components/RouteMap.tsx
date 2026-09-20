"use client";

import { useEffect, useRef, useState } from "react";
import type { LatLngTuple, Map as LeafletMap } from "leaflet";
import "leaflet/dist/leaflet.css";
import { CloudSun, Layers3, LocateFixed, Minus, Mountain, Plus } from "lucide-react";
import abcRouteJson from "@/data/abcRoute.json";
import type { Warning } from "@/lib/models";

type MapLayer = "satellite" | "terrain";
type RoutePoint = [number, number, number];
type RouteSegment = { id: string; name: string; points: RoutePoint[] };

const abcSegments = abcRouteJson.segments as RouteSegment[];
const trekCenters: Record<string, [number, number]> = {
  "annapurna-base-camp": [28.414, 83.821],
  "manaslu-circuit": [28.55, 84.64],
  "poon-hill": [28.401, 83.69],
  "langtang-valley": [28.21, 85.55],
  "mardi-himal": [28.47, 83.9],
};

const tileLayers = {
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles © Esri — Sources: Esri, Vantor, Earthstar Geographics and the GIS User Community",
    maxZoom: 19,
  },
  terrain: {
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution: "Map data © OpenStreetMap contributors · Style © OpenTopoMap (CC-BY-SA)",
    maxZoom: 17,
  },
} as const;

const abcWaypoints: Array<{ name: string; elevation: string; point: [number, number] }> = [
  { name: "Nayapul", elevation: "1,070 m", point: [28.29657, 83.76781] },
  { name: "Chhomrong", elevation: "2,170 m", point: [28.4188, 83.8182] },
  { name: "MBC", elevation: "3,700 m", point: [28.52632, 83.90894] },
  { name: "ABC", elevation: "4,130 m", point: [28.53056, 83.87833] },
];

interface RouteMapProps {
  warnings: Warning[];
  useAlternative: boolean;
  onWarningSelect: (warning: Warning) => void;
  compact?: boolean;
  trekId?: string;
}

function warningCoordinates(warning: Warning): [number, number] | null {
  if ("latitude" in warning.point) return [warning.point.latitude, warning.point.longitude];
  return null;
}

function createWarningPopup(warning: Warning) {
  const wrapper = document.createElement("div");
  wrapper.className = "leaflet-warning-popup";
  const type = document.createElement("small");
  type.textContent = `${warning.type} · ${warning.postedAt}`;
  const title = document.createElement("strong");
  title.textContent = warning.title;
  const location = document.createElement("span");
  location.textContent = warning.location;
  wrapper.appendChild(type);
  wrapper.appendChild(title);
  wrapper.appendChild(location);
  return wrapper;
}

export function RouteMap({ warnings, useAlternative, onWarningSelect, compact = false, trekId }: RouteMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const [layer, setLayer] = useState<MapLayer>("satellite");
  const [mapReady, setMapReady] = useState(false);
  const [tileError, setTileError] = useState(false);
  const resolvedTrekId = trekId ?? warnings[0]?.trekId ?? "annapurna-base-camp";
  const hasRecordedTrack = resolvedTrekId === "annapurna-base-camp";

  useEffect(() => {
    if (!containerRef.current) return;
    let disposed = false;
    setMapReady(false);
    setTileError(false);

    void (async () => {
    const L = await import("leaflet");
    if (disposed || !containerRef.current) return;
    const map = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: true,
      preferCanvas: true,
      minZoom: 7,
    });
    mapRef.current = map;

    const selectedTiles = tileLayers[layer];
    L.tileLayer(selectedTiles.url, {
      attribution: selectedTiles.attribution,
      maxZoom: selectedTiles.maxZoom,
      crossOrigin: true,
    })
      .on("tileerror", () => setTileError(true))
      .on("load", () => setTileError(false))
      .addTo(map);

    if (hasRecordedTrack) {
      const bounds = L.latLngBounds([]);
      abcSegments.forEach((segment) => {
        const positions = segment.points.map(([latitude, longitude]) => [latitude, longitude] as LatLngTuple);
        positions.forEach((position) => bounds.extend(position));
        L.polyline(positions, {
          color: "#102b23",
          weight: 9,
          opacity: 0.72,
          lineCap: "round",
          lineJoin: "round",
          interactive: false,
        }).addTo(map);
        L.polyline(positions, {
          color: useAlternative ? "#f0b24f" : "#d8f08c",
          weight: useAlternative ? 5 : 4,
          opacity: 0.96,
          dashArray: useAlternative ? "10 8" : undefined,
          lineCap: "round",
          lineJoin: "round",
          interactive: false,
        }).addTo(map);
      });
      map.fitBounds(bounds, { padding: compact ? [22, 22] : [42, 42] });

      abcWaypoints.forEach((waypoint, index) => {
        const isEndpoint = index === 0 || index === abcWaypoints.length - 1;
        L.circleMarker(waypoint.point, {
          radius: isEndpoint ? 7 : 5,
          color: "#ffffff",
          weight: 2,
          fillColor: index === abcWaypoints.length - 1 ? "#d8f08c" : "#1f7257",
          fillOpacity: 1,
        })
          .bindTooltip(`<strong>${waypoint.name}</strong><br>${waypoint.elevation}`, {
            direction: "top",
            offset: [0, -8],
          })
          .addTo(map);
      });
    } else {
      map.setView(trekCenters[resolvedTrekId] ?? [28.3, 84.1], 10);
    }

    warnings.forEach((warning) => {
      const point = warningCoordinates(warning);
      if (!point) return;
      const icon = L.divIcon({
        className: "trail-warning-marker-shell",
        html: `<span class="trail-warning-marker trail-warning-marker--${warning.severity}" aria-hidden="true">!</span>`,
        iconSize: [34, 42],
        iconAnchor: [17, 37],
        popupAnchor: [0, -34],
      });
      L.marker(point, { icon, title: warning.title, alt: warning.title })
        .on("click", () => onWarningSelect(warning))
        .bindPopup(createWarningPopup(warning))
        .addTo(map);
    });

    L.control.scale({ imperial: false, position: "bottomright" }).addTo(map);
    window.setTimeout(() => {
      if (disposed) return;
      map.invalidateSize();
      setMapReady(true);
    }, 50);
    })();

    return () => {
      disposed = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [compact, hasRecordedTrack, layer, onWarningSelect, resolvedTrekId, useAlternative, warnings]);

  return (
    <div className={`route-map route-map--leaflet ${compact ? "route-map--compact" : ""}`} aria-label="Interactive satellite map of the Annapurna Base Camp trek">
      <div ref={containerRef} className="leaflet-map-canvas" />
      {!mapReady && <div className="map-loading"><span />Loading terrain…</div>}
      {tileError && <div className="map-tile-error">Map tiles are unavailable. The recorded trail remains ready for offline caching.</div>}

      <div className="map-layer-switcher" role="group" aria-label="Choose map imagery">
        <button type="button" className={layer === "satellite" ? "active" : ""} onClick={() => setLayer("satellite")}><Layers3 size={15} />Satellite</button>
        <button type="button" className={layer === "terrain" ? "active" : ""} onClick={() => setLayer("terrain")}><Mountain size={15} />Terrain</button>
      </div>

      <div className="map-weather"><CloudSun size={18} /><strong>7°C</strong><span>· ABC corridor</span></div>
      <div className="map-controls" aria-label="Map controls">
        <button type="button" onClick={() => mapRef.current?.zoomIn()} aria-label="Zoom in"><Plus size={17} /></button>
        <button type="button" onClick={() => mapRef.current?.zoomOut()} aria-label="Zoom out"><Minus size={17} /></button>
        <button type="button" onClick={() => mapRef.current?.locate({ setView: true, maxZoom: 15 })} aria-label="Center on my location"><LocateFixed size={17} /></button>
      </div>

      <div className="map-data-note">
        <strong>{hasRecordedTrack ? "Recorded ABC GPX" : "Regional satellite view"}</strong>
        <span>{hasRecordedTrack ? "Planning reference · verify locally" : "Detailed GPS track not yet available"}</span>
      </div>
      {useAlternative && <div className="alternate-chip"><Mountain size={15} />Safety-routing preview · not for navigation</div>}
    </div>
  );
}
