import { nearbyPlaces, treks, warnings } from "@/data/mockData";
import type { NearbyPlace, Trek, Warning } from "@/lib/models";

const pause = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));

export interface TrekService {
  search(query: string): Promise<Trek[]>;
  getById(id: string): Promise<Trek | undefined>;
  getWarnings(trekId?: string): Promise<Warning[]>;
  getNearby(): Promise<NearbyPlace[]>;
}

export const mockTrekService: TrekService = {
  async search(query) {
    await pause();
    const q = query.toLowerCase().trim();
    return q ? treks.filter((trek) => `${trek.name} ${trek.region} ${trek.tags.join(" ")}`.toLowerCase().includes(q)) : treks;
  },
  async getById(id) {
    await pause(180);
    return treks.find((trek) => trek.id === id);
  },
  async getWarnings(trekId) {
    await pause(180);
    return trekId ? warnings.filter((warning) => warning.trekId === trekId) : warnings;
  },
  async getNearby() {
    await pause(180);
    return nearbyPlaces;
  },
};

// Future adapters should implement TrekService and map remote weather, satellite,
// auth, map, notification, route-processing and warning-analysis APIs into these models.
