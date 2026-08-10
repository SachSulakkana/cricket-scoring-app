import { NextResponse } from "next/server";
import { isAuthError, requireUser } from "@/lib/api-auth";
import { parseJsonBody } from "@/lib/api-route-utils";
import { tournamentSchema } from "@/lib/api-schemas";
import { saveTournament } from "@/lib/db";
import type { DbTournament } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await requireUser(request);
  if (isAuthError(user)) return user;

  try {
    const parsed = await parseJsonBody(request, tournamentSchema);
    if ("error" in parsed) return parsed.error;

    await saveTournament(user.uid, parsed.data as DbTournament);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/tournaments failed", error);
    return NextResponse.json(
      { error: "Failed to save tournament" },
      { status: 500 }
    );
  }
}
