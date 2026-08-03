import { NextResponse } from "next/server";
import { isAuthError, requireUser } from "@/lib/api-auth";
import { parseJsonBody } from "@/lib/api-route-utils";
import { teamSchema } from "@/lib/api-schemas";
import { saveTeam } from "@/lib/firestore-db";
import type { Team } from "@/lib/cricket-types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await requireUser(request);
  if (isAuthError(user)) return user;

  try {
    const parsed = await parseJsonBody(request, teamSchema);
    if ("error" in parsed) return parsed.error;

    await saveTeam(user.uid, parsed.data as Team);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/teams failed", error);
    return NextResponse.json({ error: "Failed to save team" }, { status: 500 });
  }
}
