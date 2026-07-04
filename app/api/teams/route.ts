import { NextResponse } from "next/server";
import { saveTeam } from "@/lib/firestore-db";
import type { Team } from "@/lib/cricket-types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const team = (await request.json()) as Team;
    await saveTeam(team);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/teams failed", error);
    return NextResponse.json({ error: "Failed to save team" }, { status: 500 });
  }
}
