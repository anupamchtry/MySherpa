import { env } from "cloudflare:workers";
import type { Warning } from "@/lib/models";

type WarningRow = { payload: string };

function database(): D1Database {
  if (!env.DB) throw new Error("Warning storage is temporarily unavailable.");
  return env.DB;
}

function validateWarning(value: unknown): Warning {
  if (!value || typeof value !== "object") throw new Error("A warning record is required.");
  const warning = value as Partial<Warning>;
  if (!warning.id || !warning.clientReportId || !warning.trekId || !warning.title || !warning.createdAt) throw new Error("The warning record is incomplete.");
  if (!Array.isArray(warning.evidence) || !Array.isArray(warning.confirmations)) throw new Error("The warning evidence is invalid.");
  return warning as Warning;
}

export async function listWarnings(): Promise<Warning[]> {
  const result = await database().prepare("SELECT payload FROM warnings ORDER BY updated_at DESC").all<WarningRow>();
  return result.results.flatMap((row) => { try { return [JSON.parse(row.payload) as Warning]; } catch { return []; } });
}

export async function findWarning(id: string): Promise<Warning | null> {
  const row = await database().prepare("SELECT payload FROM warnings WHERE id = ? LIMIT 1").bind(id).first<WarningRow>();
  if (!row) return null;
  try { return JSON.parse(row.payload) as Warning; } catch { return null; }
}

export async function upsertWarning(input: unknown): Promise<Warning> {
  const warning = validateWarning(input);
  const stored: Warning = { ...warning, syncStatus: "synced" };
  const updatedAt = new Date().toISOString();
  await database().prepare(`INSERT INTO warnings (id, client_report_id, trek_id, status, severity, created_at, updated_at, payload)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(client_report_id) DO UPDATE SET trek_id = excluded.trek_id, status = excluded.status, severity = excluded.severity, updated_at = excluded.updated_at, payload = excluded.payload`)
    .bind(stored.id, stored.clientReportId, stored.trekId, stored.status, stored.severity, stored.createdAt, updatedAt, JSON.stringify(stored)).run();
  return stored;
}

export async function replaceWarning(id: string, input: unknown): Promise<Warning | null> {
  const current = await findWarning(id);
  const warning = validateWarning(input);
  if (!current && warning.dataStatus !== "demo") return null;
  return upsertWarning({ ...warning, id, clientReportId: warning.clientReportId ?? id });
}
