import { listWarnings, upsertWarning } from "./repository";

export async function GET() {
  try { return Response.json({ warnings: await listWarnings() }, { headers: { "cache-control": "no-store" } }); }
  catch (error) { console.error("warning-list-failed", error); return Response.json({ error: "Warnings could not be loaded." }, { status: 503 }); }
}

export async function POST(request: Request) {
  try { return Response.json({ warning: await upsertWarning(await request.json()) }, { status: 201 }); }
  catch (error) { console.error("warning-save-failed", error); return Response.json({ error: error instanceof Error ? error.message : "The warning could not be saved." }, { status: 400 }); }
}
