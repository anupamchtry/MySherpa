import { replaceWarning } from "../repository";

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const warning = await replaceWarning(id, await request.json());
    return warning ? Response.json({ warning }) : Response.json({ error: "Warning not found." }, { status: 404 });
  } catch (error) {
    console.error("warning-update-failed", error);
    return Response.json({ error: error instanceof Error ? error.message : "The warning could not be updated." }, { status: 400 });
  }
}
