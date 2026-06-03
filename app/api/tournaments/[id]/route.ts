import { NextResponse } from "next/server";
import { sqliteDeleteTournament, sqliteSaveTournament } from "@/lib/sqlite-db";
import type { DbTournament } from "@/lib/sqlite-db";

export const runtime = "nodejs";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tournament = (await request.json()) as DbTournament;
    if (tournament.id !== id) {
      return NextResponse.json({ error: "ID mismatch" }, { status: 400 });
    }
    sqliteSaveTournament(tournament);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("PUT /api/tournaments/[id] failed", error);
    return NextResponse.json(
      { error: "Failed to update tournament" },
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
    sqliteDeleteTournament(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/tournaments/[id] failed", error);
    return NextResponse.json(
      { error: "Failed to delete tournament" },
      { status: 500 }
    );
  }
}
