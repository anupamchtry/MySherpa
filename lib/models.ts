export type Difficulty = "Easy" | "Moderate" | "Challenging";
export type Safety = "Good" | "Caution" | "High alert";
export type WarningStatus = "unconfirmed" | "community_confirmed" | "guide_verified" | "resolved" | "outdated" | "disputed";
export type WarningSeverity = "low" | "medium" | "high";
export type SyncStatus = "synced" | "pending" | "synchronising";
export type ConfirmationKind = "still_present" | "condition_worsened" | "trail_passable" | "unable_to_verify";

export interface Trek {
  id: string;
  name: string;
  region: string;
  days: number;
  distanceKm: number;
  maxElevationM: number;
  difficulty: Difficulty;
  safety: Safety;
  temperatureC: number;
  description: string;
  image?: string;
  tags: string[];
}

export interface Warning {
  id: string;
  trekId: string;
  type: "Landslide" | "Bridge" | "Weather" | "Trail";
  title: string;
  detail: string;
  location: string;
  postedAt: string;
  author: string;
  verified: boolean;
  status: WarningStatus;
  severity: WarningSeverity;
  photo?: string;
  reportCount: number;
  evidence: WarningEvidence[];
  dataStatus: "demo" | "community";
  source: string;
  createdAt: string;
  lastConfirmedAt?: string;
  confirmations: WarningConfirmation[];
  syncStatus: SyncStatus;
  clientReportId?: string;
  publicUpdate?: string;
  point: { latitude: number; longitude: number } | { x: number; y: number };
}

export interface WarningConfirmation {
  id: string;
  kind: ConfirmationKind;
  createdAt: string;
  source: string;
}

export interface WarningEvidence {
  id: string;
  image: string;
  capturedAt: string;
  latitude: number;
  longitude: number;
  accuracyM: number;
  batteryPercent?: number;
  contributor: string;
}

export interface MapPlace {
  id: string;
  name: string;
  category: "Lodge" | "Restaurant" | "Health" | "Water" | "Shelter";
  latitude: number;
  longitude: number;
  elevationM?: number;
  phone?: string;
  rooms?: number;
  beds?: number;
  note: string;
  source: "OpenStreetMap";
}

export interface NearbyPlace {
  id: string;
  name: string;
  kind: "Lodge" | "Local business" | "EV charger" | "Fuel pump" | "Trekking group";
  distanceKm: number;
  open: boolean;
  meta: string;
}

export interface RouteAssessment {
  impacted: boolean;
  warningCount: number;
  message: string;
  affectedSection: string;
  lastConfirmedAt?: string;
}

export interface EmergencyContact { label: string; number: string; note: string; }
export interface OfflineRoutePackage {
  trekId: string;
  savedAt: string;
  warningCount: number;
  trek: Trek;
  warnings: Warning[];
  places: MapPlace[];
  route: unknown;
  emergencyContacts: EmergencyContact[];
  checkpoints: string[];
}
