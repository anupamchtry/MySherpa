export type Difficulty = "Easy" | "Moderate" | "Challenging";
export type Safety = "Good" | "Caution" | "High alert";

export interface Trek {
  id: string;
  name: string;
  region: string;
  days: number;
  distanceKm: number;
  maxElevationM: number;
  difficulty: Difficulty;
  safety: Safety;
  safetyScore: number;
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
  severity: "medium" | "high";
  photo?: string;
  point: { latitude: number; longitude: number } | { x: number; y: number };
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
  alternativeMinutes: number;
}
