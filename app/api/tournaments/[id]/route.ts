import { NextResponse } from "next/server";
import { isAuthError, requireUser, verifyRequestUser } from "@/lib/api-auth";
import { parseJsonBody } from "@/lib/api-route-utils";
import { tournamentSchema } from "@/lib/api-schemas";
import {
  deleteTournament,
  getTournament,
  listTeams,
  saveTournament,
} from "@/lib/firestore-db";
import type { DbTournament } from "@/lib/firestore-db";
import {
  LIVE_SHARE_QUERY_PARAM,
  resolveUidFromLiveShareKey,
} from "@/lib/live-share";

export const runtime = "nodejs";

async function resolveTournamentUid(
  request: Request
): Promise<string | NextResponse> {
  const user = await verifyRequestUser(request);
  if (user) return user.uid;

  const key = new URL(request.url).searchParams.get(LIVE_SHARE_QUERY_PARAM);
  if (key?.trim()) {
    const uid = await resolveUidFromLiveShareKey(key);
    if (uid) return uid;
    return NextResponse.json({ error: "Invalid share key" }, { status: 404 });
  }

  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const uidOrError = await resolveTournamentUid(request);
  if (typeof uidOrError !== "string") return uidOrError;

  try {
    const { id } = await params;
    const tournament = await getTournament(uidOrError, id);
    if (!tournament) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
    }
    const teamIds = new Set(tournament.selectedTeamIds ?? []);
    const teams = (await listTeams(uidOrError)).filter((team) =>
      teamIds.has(team.id)
    );
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
  const user = await requireUser(request);
  if (isAuthError(user)) return user;

  try {
    const { id } = await params;
    const parsed = await parseJsonBody(request, tournamentSchema);
    if ("error" in parsed) return parsed.error;

    if (parsed.data.id !== id) {
      return NextResponse.json({ error: "ID mismatch" }, { status: 400 });
    }
    await saveTournament(user.uid, parsed.data as DbTournament);
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
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireUser(request);
  if (isAuthError(user)) return user;

  try {
    const { id } = await params;
    await deleteTournament(user.uid, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/tournaments/[id] failed", error);
    return NextResponse.json(
      { error: "Failed to delete tournament" },
      { status: 500 }
    );
  }
}
