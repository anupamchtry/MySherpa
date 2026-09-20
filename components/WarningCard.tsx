"use client";

import { BadgeCheck, Camera, Clock3, Flag, MapPin, Users } from "lucide-react";
import type { ConfirmationKind, Warning } from "@/lib/models";

const statusLabels = { unconfirmed: "Unconfirmed", community_confirmed: "Community Confirmed", guide_verified: "Guide Verified", resolved: "Resolved", outdated: "Outdated", disputed: "Disputed" } as const;
const confirmationLabels: Record<ConfirmationKind, string> = { still_present: "Still present", condition_worsened: "Condition worsened", trail_passable: "Trail appears passable", unable_to_verify: "Unable to verify" };

function reportAge(warning: Warning) {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(warning.createdAt).getTime()) / 60000));
  if (minutes < 60) return `${minutes || 1} min ago`;
  if (minutes < 1440) return `${Math.round(minutes / 60)} hr ago`;
  return `${Math.round(minutes / 1440)} days ago`;
}

export function WarningCard({ warning, onFlag, onConfirm }: { warning: Warning; onFlag: (warning: Warning) => void; onConfirm: (warning: Warning, kind: ConfirmationKind) => void }) {
  return <article className="warning-card">
    {warning.photo && <div className="warning-card__media"><img src={warning.photo} alt={`Field evidence for ${warning.title}`} />{warning.dataStatus === "demo" && <span>Demo evidence</span>}</div>}
    <div className="warning-card__content">
      <div className="warning-card__meta"><span className={`warning-type warning-type--${warning.severity}`}>{warning.type} · {warning.severity}</span><span className={`review-status review-status--${warning.status}`}>{statusLabels[warning.status]}</span><span><Clock3 size={14} /> {reportAge(warning)}</span></div>
      <h3>{warning.title}</h3><p className="warning-card__detail">{warning.detail}</p><p className="warning-location"><MapPin size={15} />{warning.location}</p>
      <div className="warning-proof"><span><Users size={14} />{warning.reportCount === 1 ? "Reported by one traveller" : `${warning.reportCount} reports in this area`}</span><span><Camera size={14} />{warning.evidence.length} photo{warning.evidence.length === 1 ? "" : "s"}</span></div>
      <p className="evidence-meta">Source: {warning.source} · {warning.confirmations.length} confirmation{warning.confirmations.length === 1 ? "" : "s"}{warning.lastConfirmedAt ? ` · Last confirmed ${new Date(warning.lastConfirmedAt).toLocaleString()}` : " · Not yet independently verified"}</p>
      {warning.publicUpdate && <p className="public-update"><BadgeCheck size={15} />Coordinator update: {warning.publicUpdate}</p>}
      {!(["resolved", "outdated"] as string[]).includes(warning.status) && <details className="confirm-report"><summary>Confirm trail condition</summary><div>{(Object.keys(confirmationLabels) as ConfirmationKind[]).map((kind) => <button type="button" key={kind} onClick={() => onConfirm(warning, kind)}>{confirmationLabels[kind]}</button>)}</div></details>}
      <div className="warning-card__footer"><span className="warning-author">{warning.author}{warning.status === "guide_verified" && <BadgeCheck size={15} aria-label="Guide verified" />}</span><button type="button" className="text-button" onClick={() => onFlag(warning)}><Flag size={14} /> Flag content</button></div>
    </div>
  </article>;
}
