import { NextResponse } from "next/server";
import { requireMutationAuth } from "@/lib/api-auth";
import { parseJsonBody } from "@/lib/api-route-utils";
import { teamSchema } from "@/lib/api-schemas";
import { deleteTeam, saveTeam } from "@/lib/firestore-db";
import type { Team } from "@/lib/cricket-types";

export const runtime = "nodejs";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requireMutationAuth(request);
  if (authError) return authError;

  try {
    const { id } = await params;
    const parsed = await parseJsonBody(request, teamSchema);
    if ("error" in parsed) return parsed.error;

    if (parsed.data.id !== id) {
      return NextResponse.json({ error: "ID mismatch" }, { status: 400 });
    }
    await saveTeam(parsed.data as Team);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("PUT /api/teams/[id] failed", error);
    return NextResponse.json(
      { error: "Failed to update team" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requireMutationAuth(request);
  if (authError) return authError;

  try {
    const { id } = await params;
    await deleteTeam(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/teams/[id] failed", error);
    return NextResponse.json(
      { error: "Failed to delete team" },
      { status: 500 }
    );
  }
}
