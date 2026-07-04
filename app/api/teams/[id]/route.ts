import { NextResponse } from "next/server";
import { deleteTeam, saveTeam } from "@/lib/firestore-db";
import type { Team } from "@/lib/cricket-types";

export const runtime = "nodejs";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const team = (await request.json()) as Team;
    if (team.id !== id) {
      return NextResponse.json({ error: "ID mismatch" }, { status: 400 });
    }
    await saveTeam(team);
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
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
