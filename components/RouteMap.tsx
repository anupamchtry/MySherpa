"use client";

import { useEffect, useRef, useState } from "react";
import type { LatLngTuple, LocationEvent, Map as LeafletMap } from "leaflet";
import "leaflet/dist/leaflet.css";
import { BedDouble, Layers3, LocateFixed, Minus, Mountain, Plus } from "lucide-react";
import abcRouteJson from "@/data/abcRoute.json";
import abcPlacesJson from "@/data/abcPlaces.json";
import type { MapPlace, Warning } from "@/lib/models";

type MapLayer = "satellite" | "terrain";
type RoutePoint = [number, number, number];
type RouteSegment = { id: string; name: string; points: RoutePoint[] };

const abcSegments = abcRouteJson.segments as RouteSegment[];
const abcPlaces = abcPlacesJson as MapPlace[];
const trekCenters: Record<string, [number, number]> = {
  "annapurna-base-camp": [28.414, 83.821], "manaslu-circuit": [28.55, 84.64], "poon-hill": [28.401, 83.69], "langtang-valley": [28.21, 85.55], "mardi-himal": [28.47, 83.9],
};

const tileLayers = {
  satellite: { url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", attribution: "Tiles © Esri — Sources: Esri, Vantor, Earthstar Geographics and GIS User Community", maxZoom: 19 },
  terrain: { url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", attribution: "Map data © OpenStreetMap contributors · Style © OpenTopoMap (CC-BY-SA)", maxZoom: 17 },
} as const;

const waypoints: Array<{ name: string; elevation: string; point: [number, number] }> = [
  { name: "Nayapul trailhead", elevation: "1,070 m", point: [28.29657, 83.76781] },
  { name: "Ghandruk", elevation: "1,940 m", point: [28.377, 83.808] },
  { name: "Chhomrong", elevation: "2,170 m", point: [28.4188, 83.8182] },
  { name: "Sinuwa", elevation: "2,340 m", point: [28.4357, 83.8385] },
  { name: "Dovan", elevation: "2,600 m", point: [28.4699, 83.8696] },
  { name: "Deurali", elevation: "3,230 m", point: [28.4983, 83.8992] },
  { name: "Machhapuchhare Base Camp", elevation: "3,700 m", point: [28.52632, 83.90894] },
  { name: "Annapurna Base Camp", elevation: "4,130 m", point: [28.53056, 83.87833] },
];

const affectedOriginalSegment: LatLngTuple[] = [
  [28.409532, 83.800044], [28.4169, 83.8082], [28.4245, 83.8132], [28.431855, 83.832589],
];

interface RouteMapProps {
  warnings: Warning[];
  onWarningSelect: (warning: Warning) => void;
  onPlaceSelect?: (place: MapPlace) => void;
  compact?: boolean;
  trekId?: string;
}

function warningCoordinates(warning: Warning): [number, number] | null {
  return "latitude" in warning.point ? [warning.point.latitude, warning.point.longitude] : null;
}

function warningPopup(warning: Warning) {
  const node = document.createElement("div");
  node.className = "leaflet-warning-popup";
  const minutes = Math.max(1, Math.round((Date.now() - new Date(warning.createdAt).getTime()) / 60000));
  const age = minutes < 60 ? `${minutes} min ago` : minutes < 1440 ? `${Math.round(minutes / 60)} hr ago` : `${Math.round(minutes / 1440)} days ago`;
  const eyebrow = document.createElement("small"); eyebrow.textContent = `${warning.type} · ${warning.severity} · ${warning.status.replaceAll("_", " ")}`;
  const title = document.createElement("strong"); title.textContent = warning.title;
  const location = document.createElement("span"); location.textContent = `${warning.location} · ${warning.reportCount === 1 ? "Reported by one traveller" : `${warning.reportCount} reports`} · ${warning.confirmations.length} confirmation${warning.confirmations.length === 1 ? "" : "s"} · ${age} · ${warning.source}`;
  if (warning.photo) { const image = document.createElement("img"); image.src = warning.photo; image.alt = `Demo field evidence for ${warning.title}`; node.appendChild(image); }
  node.appendChild(eyebrow); node.appendChild(title); node.appendChild(location);
  return node;
}

function placePopup(place: MapPlace) {
  const node = document.createElement("div"); node.className = "leaflet-place-popup";
  const category = document.createElement("small"); category.textContent = `${place.category} · OpenStreetMap listing`;
  const title = document.createElement("strong"); title.textContent = place.name;
  const note = document.createElement("span"); note.textContent = place.note;
  node.appendChild(category); node.appendChild(title); node.appendChild(note);
  return node;
}

export function RouteMap({ warnings, onWarningSelect, onPlaceSelect, compact = false, trekId }: RouteMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const [layer, setLayer] = useState<MapLayer>("satellite");
  const [mapReady, setMapReady] = useState(false);
  const [tileError, setTileError] = useState(false);
  const [positionState, setPositionState] = useState<"idle" | "locating" | "found" | "error">("idle");
  const resolvedTrekId = trekId ?? warnings[0]?.trekId ?? "annapurna-base-camp";
  const hasRecordedTrack = resolvedTrekId === "annapurna-base-camp";

  useEffect(() => {
    if (!containerRef.current) return;
    let disposed = false;
    setMapReady(false); setTileError(false);

    void (async () => {
      const L = await import("leaflet");
      if (disposed || !containerRef.current) return;
      const map = L.map(containerRef.current, { zoomControl: false, attributionControl: true, preferCanvas: true, minZoom: 7 });
      mapRef.current = map;
      let userPositionLayer: import("leaflet").LayerGroup | null = null;
      map.on("locationfound", (event: LocationEvent) => {
        userPositionLayer?.remove();
        const accuracy = Math.min(event.accuracy, 1000);
        const accuracyCircle = L.circle(event.latlng, { radius: accuracy, color: "#1479d0", fillColor: "#4aa8f2", fillOpacity: .12, weight: 1 });
        const marker = L.circleMarker(event.latlng, { radius: 8, color: "#fff", weight: 3, fillColor: "#1479d0", fillOpacity: 1 }).bindPopup(`<strong>You are here</strong><br>Accuracy ±${Math.round(event.accuracy)} m`);
        userPositionLayer = L.layerGroup([accuracyCircle, marker]).addTo(map);
        marker.openPopup(); setPositionState("found");
      });
      map.on("locationerror", () => setPositionState("error"));
      const tiles = tileLayers[layer];
      L.tileLayer(tiles.url, { attribution: tiles.attribution, maxZoom: tiles.maxZoom, crossOrigin: true })
        .on("tileerror", () => setTileError(true)).on("load", () => setTileError(false)).addTo(map);

      if (hasRecordedTrack) {
        const bounds = L.latLngBounds([]);
        abcSegments.forEach((segment) => {
          const positions = segment.points.map(([lat, lon]) => [lat, lon] as LatLngTuple);
          positions.forEach((point) => bounds.extend(point));
          L.polyline(positions, { color: "#11261f", weight: 8, opacity: .68, lineCap: "round", lineJoin: "round", interactive: false }).addTo(map);
          L.polyline(positions, { color: "#b9e96f", weight: 4, opacity: .98, lineCap: "round", lineJoin: "round", interactive: false }).addTo(map);
        });

        if (warnings.length) {
          L.polyline(affectedOriginalSegment, { color: "#7b1f17", weight: 9, opacity: .64, lineCap: "round", interactive: false }).addTo(map);
          L.polyline(affectedOriginalSegment, { color: "#ef6153", weight: 5, opacity: 1, dashArray: "8 7", lineCap: "round" }).bindTooltip("Original segment — warning reported", { sticky: true }).addTo(map);
        }

        map.fitBounds(bounds, { padding: compact ? [22, 22] : [42, 42] });

        waypoints.forEach((waypoint, index) => {
          const endpoint = index === 0 || index === waypoints.length - 1;
          L.circleMarker(waypoint.point, { radius: endpoint ? 7 : 5, color: "#fff", weight: 2, fillColor: index === waypoints.length - 1 ? "#b9e96f" : "#1f7257", fillOpacity: 1 })
            .bindTooltip(`<strong>${waypoint.name}</strong><br>${waypoint.elevation}`, { direction: "top", offset: [0, -8] }).addTo(map);
        });

        abcPlaces.forEach((place) => {
          const icon = L.divIcon({ className: "trail-place-marker-shell", html: '<span class="trail-place-marker" aria-hidden="true">⌂</span>', iconSize: [26, 26], iconAnchor: [13, 13], popupAnchor: [0, -12] });
          L.marker([place.latitude, place.longitude], { icon, title: place.name, alt: place.name }).on("click", () => onPlaceSelect?.(place)).bindPopup(placePopup(place)).addTo(map);
        });
      } else map.setView(trekCenters[resolvedTrekId] ?? [28.3, 84.1], 10);

      warnings.forEach((warning) => {
        const point = warningCoordinates(warning); if (!point) return;
        const icon = L.divIcon({ className: "trail-warning-marker-shell", html: `<span class="trail-warning-marker trail-warning-marker--${warning.severity}" aria-hidden="true"><b>!</b><i>${warning.reportCount}</i></span>`, iconSize: [42, 46], iconAnchor: [21, 41], popupAnchor: [0, -38] });
        L.marker(point, { icon, title: `${warning.title}: ${warning.reportCount} reports`, alt: warning.title }).on("click", () => onWarningSelect(warning)).bindPopup(warningPopup(warning), { minWidth: 230 }).addTo(map);
      });

      L.control.scale({ imperial: false, position: "bottomright" }).addTo(map);
      window.setTimeout(() => { if (!disposed) { map.invalidateSize(); setMapReady(true); } }, 50);
    })();
    return () => { disposed = true; mapRef.current?.remove(); mapRef.current = null; };
  }, [compact, hasRecordedTrack, layer, onPlaceSelect, onWarningSelect, resolvedTrekId, warnings]);

  return <div className={`route-map route-map--leaflet ${compact ? "route-map--compact" : ""}`} aria-label="Interactive Annapurna Base Camp route map">
    <div ref={containerRef} className="leaflet-map-canvas" />
    {!mapReady && <div className="map-loading"><span />Loading map…</div>}
    {tileError && <div className="map-tile-error">Map imagery is unavailable. Route geometry can still be cached for offline use.</div>}
    <div className="map-layer-switcher" role="group" aria-label="Choose map imagery">
      <button type="button" className={layer === "satellite" ? "active" : ""} onClick={() => setLayer("satellite")}><Layers3 size={15} />Satellite</button>
      <button type="button" className={layer === "terrain" ? "active" : ""} onClick={() => setLayer("terrain")}><Mountain size={15} />Terrain</button>
    </div>
    <div className="map-controls" aria-label="Map controls">
      <button type="button" onClick={() => mapRef.current?.zoomIn()} aria-label="Zoom in"><Plus size={17} /></button>
      <button type="button" onClick={() => mapRef.current?.zoomOut()} aria-label="Zoom out"><Minus size={17} /></button>
    </div>
    <button type="button" className={`my-position-button my-position-button--${positionState}`} onClick={() => { setPositionState("locating"); mapRef.current?.locate({ setView: true, maxZoom: 15, enableHighAccuracy: true, timeout: 15000 }); }}><LocateFixed size={17} />{positionState === "locating" ? "Locating…" : positionState === "found" ? "My position" : positionState === "error" ? "Try location again" : "Show my position"}</button>
    <div className="map-legend"><span><i className="route-key" />Recorded route</span>{warnings.length > 0 && <span><i className="danger-route-key" />Affected segment</span>}<span><i className="warning-key" />Hazard reports</span><span><BedDouble size={13} />Places</span></div>
    <div className="map-data-note"><strong>{hasRecordedTrack ? "ABC field map" : "Regional map"}</strong><span>{hasRecordedTrack ? "GPX + OpenStreetMap places · verify locally" : "Detailed GPS track not yet available"}</span></div>
  </div>;
}
