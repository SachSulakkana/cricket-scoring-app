import { NextResponse } from "next/server";
import { deleteTournament, getTournament, listTeams, saveTournament } from "@/lib/firestore-db";
import type { DbTournament } from "@/lib/firestore-db";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tournament = await getTournament(id);
    if (!tournament) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
    }
    const teamIds = new Set(tournament.selectedTeamIds ?? []);
    const teams = (await listTeams()).filter((team) => teamIds.has(team.id));
    return NextResponse.json({ tournament, teams });
  } catch (error) {
    console.error("GET /api/tournaments/[id] failed", error);
    return NextResponse.json(
      { error: "Failed to load tournament" },
      { status: 500 }
    );
  }
}

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
    await saveTournament(tournament);
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
    await deleteTournament(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/tournaments/[id] failed", error);
    return NextResponse.json(
      { error: "Failed to delete tournament" },
      { status: 500 }
    );
  }
}
