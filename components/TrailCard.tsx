import { ArrowUpRight, Clock3, MapPin, Mountain, Route } from "lucide-react";
import type { Trek } from "@/lib/models";

interface TrailCardProps {
  trek: Trek;
  featured?: boolean;
  onOpen: (trek: Trek) => void;
}

export function TrailCard({ trek, featured = false, onOpen }: TrailCardProps) {
  return (
    <button
      type="button"
      className={`trail-card ${featured ? "trail-card--featured" : ""}`}
      onClick={() => onOpen(trek)}
      aria-label={`Open ${trek.name} trek details`}
    >
      {trek.image ? (
        <div className="trail-card__image">
          <img src={trek.image} alt="A trekker on the Annapurna trail at sunrise" />
          <span className={`status-pill status-pill--${trek.safety.toLowerCase().replace(" ", "-")}`}>{trek.safety}</span>
        </div>
      ) : (
        <div className="trail-card__graphic" aria-hidden="true">
          <span className={`status-pill status-pill--${trek.safety.toLowerCase().replace(" ", "-")}`}>{trek.safety}</span>
          <Mountain size={42} strokeWidth={1.2} />
          <svg viewBox="0 0 240 80" preserveAspectRatio="none"><path d="M0 72 L38 40 L72 62 L118 18 L162 54 L196 31 L240 68" /></svg>
        </div>
      )}
      <div className="trail-card__body">
        <div className="trail-card__heading">
          <div>
            <p className="eyebrow">{trek.region}</p>
            <h3>{trek.name}</h3>
          </div>
          <span className="icon-button" aria-hidden="true"><ArrowUpRight size={18} /></span>
        </div>
        <div className="trek-stats" aria-label="Trek facts">
          <span><Mountain size={15} />{trek.maxElevationM.toLocaleString()} m</span>
          <span><Route size={15} />{trek.distanceKm} km</span>
          <span><Clock3 size={15} />{trek.days} days</span>
        </div>
        <div className="trail-card__footer">
          <span className={`difficulty difficulty--${trek.difficulty.toLowerCase()}`}>{trek.difficulty}</span>
          <span><MapPin size={14} /> {trek.safety} conditions</span>
        </div>
      </div>
    </button>
  );
}
