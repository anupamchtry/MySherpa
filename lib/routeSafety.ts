import type { RouteAssessment, Warning } from "@/lib/models";

export function assessRoute(warnings: Warning[]): RouteAssessment {
  const highRisk = warnings.filter((warning) => warning.severity === "high");
  const confirmations = warnings.map((warning) => warning.lastConfirmedAt ?? warning.createdAt).filter(Boolean).sort();
  return {
    impacted: warnings.length > 0,
    warningCount: warnings.length,
    message: highRisk.length
      ? `${highRisk.length} high-risk warning${highRisk.length === 1 ? "" : "s"} intersect the planned route.`
      : warnings.length
        ? "A caution marker is close to the planned route."
        : "No active warnings intersect this route.",
    affectedSection: warnings.some((warning) => warning.trekId === "annapurna-base-camp") ? "Chhomrong–Sinuwa corridor" : "Section near the reported marker",
    lastConfirmedAt: confirmations.at(-1),
  };
}
