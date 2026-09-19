"use client";

import { CloudSun, LocateFixed, Mountain, Navigation, Plus, Minus } from "lucide-react";
import type { Warning } from "@/lib/models";

interface RouteMapProps {
  warnings: Warning[];
  useAlternative: boolean;
  onWarningSelect: (warning: Warning) => void;
  compact?: boolean;
}

export function RouteMap({ warnings, useAlternative, onWarningSelect, compact = false }: RouteMapProps) {
  return (
    <div className={`route-map ${compact ? "route-map--compact" : ""}`} role="img" aria-label="Interactive route map from Nayapul to Annapurna Base Camp">
      <svg className="map-contours" viewBox="0 0 800 520" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
            <path d="M 48 0 L 0 0 0 48" fill="none" stroke="rgba(255,255,255,.055)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="800" height="520" fill="url(#grid)" />
        <path className="contour" d="M-60 430 C80 320 128 490 260 382 S475 250 600 345 S730 430 880 262" />
        <path className="contour" d="M-40 360 C88 255 180 420 305 300 S520 192 642 265 S760 350 855 215" />
        <path className="contour" d="M-60 270 C92 195 200 318 332 215 S525 110 676 190 S790 272 860 145" />
        <path className="river" d="M-20 420 C170 350 170 195 360 270 S590 440 820 300" />
        <path className="route-shadow" d="M86 430 C160 392 175 335 242 322 S340 275 386 244 S456 207 520 201 S616 145 704 80" />
        <path className="route-primary" d="M86 430 C160 392 175 335 242 322 S340 275 386 244 S456 207 520 201 S616 145 704 80" />
        {useAlternative && <path className="route-alt" d="M242 322 C284 380 374 356 424 296 S485 233 520 201" />}
        <circle cx="86" cy="430" r="8" className="map-start" />
        <circle cx="704" cy="80" r="9" className="map-end" />
      </svg>

      <div className="map-label" style={{ left: "9%", top: "83%" }}>Nayapul</div>
      <div className="map-label" style={{ left: "82%", top: "12%" }}>ABC · 4,130 m</div>
      <div className="map-label map-label--muted" style={{ left: "28%", top: "59%" }}>Chhomrong</div>
      {warnings.map((warning) => (
        <button
          type="button"
          key={warning.id}
          className={`map-warning map-warning--${warning.severity}`}
          style={{ left: `${warning.point.x}%`, top: `${warning.point.y}%` }}
          onClick={() => onWarningSelect(warning)}
          aria-label={`${warning.type} warning: ${warning.title}`}
        >
          <span>!</span>
        </button>
      ))}

      <div className="map-weather"><CloudSun size={18} /><strong>7°C</strong><span>· 3,240 m</span></div>
      <div className="map-controls" aria-label="Map controls">
        <button type="button" aria-label="Zoom in"><Plus size={17} /></button>
        <button type="button" aria-label="Zoom out"><Minus size={17} /></button>
        <button type="button" aria-label="Center on my location"><LocateFixed size={17} /></button>
      </div>
      {!compact && <div className="map-north"><Navigation size={16} /> N</div>}
      {useAlternative && <div className="alternate-chip"><Mountain size={15} /> Safer bypass selected</div>}
    </div>
  );
}
