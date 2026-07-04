import { NextResponse } from "next/server";
import { bulkImportTeams } from "@/lib/firestore-db";
import type { Team } from "@/lib/cricket-types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { teams?: Team[] };
    const teams = Array.isArray(body.teams) ? body.teams : [];
    const imported = await bulkImportTeams(teams);
    return NextResponse.json({ imported });
  } catch (error) {
    console.error("POST /api/teams/import failed", error);
    return NextResponse.json(
      { error: "Failed to import teams" },
      { status: 500 }
    );
  }
}
