import type { Warning } from "@/lib/models";

type WarningResponse = { warning: Warning };
type WarningListResponse = { warnings: Warning[] };

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: "The warning service is unavailable." })) as { error?: string };
    throw new Error(body.error ?? "The warning service is unavailable.");
  }
  return response.json() as Promise<T>;
}

export const warningApi = {
  async list(): Promise<Warning[]> {
    const response = await fetch("/api/warnings", { headers: { accept: "application/json" }, cache: "no-store" });
    return (await parseResponse<WarningListResponse>(response)).warnings;
  },
  async upsert(warning: Warning): Promise<Warning> {
    const response = await fetch("/api/warnings", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(warning) });
    return (await parseResponse<WarningResponse>(response)).warning;
  },
  async update(warning: Warning): Promise<Warning> {
    const response = await fetch(`/api/warnings/${encodeURIComponent(warning.id)}`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(warning) });
    return (await parseResponse<WarningResponse>(response)).warning;
  },
};
