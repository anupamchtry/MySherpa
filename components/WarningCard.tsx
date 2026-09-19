import { BadgeCheck, Clock3, Flag, MapPin } from "lucide-react";
import type { Warning } from "@/lib/models";

export function WarningCard({ warning, onReport }: { warning: Warning; onReport: (warning: Warning) => void }) {
  return (
    <article className="warning-card">
      {warning.photo && <img src={warning.photo} alt="Community trail report from the affected route" />}
      <div className="warning-card__content">
        <div className="warning-card__meta">
          <span className={`warning-type warning-type--${warning.severity}`}>{warning.type}</span>
          <span><Clock3 size={14} /> {warning.postedAt}</span>
        </div>
        <h3>{warning.title}</h3>
        <p className="warning-card__detail">{warning.detail}</p>
        <p className="warning-location"><MapPin size={15} />{warning.location}</p>
        <div className="warning-card__footer">
          <span className="warning-author">{warning.author}{warning.verified && <BadgeCheck size={15} aria-label="Verified contributor" />}</span>
          <button type="button" className="text-button" onClick={() => onReport(warning)}><Flag size={14} /> Report warning</button>
        </div>
      </div>
    </article>
  );
}
