import { NextResponse } from "next/server";
import { isAuthError, requireUser } from "@/lib/api-auth";
import { parseJsonBody } from "@/lib/api-route-utils";
import { playerSchema } from "@/lib/api-schemas";
import { savePlayer } from "@/lib/db";
import type { Player } from "@/lib/cricket-types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await requireUser(request);
  if (isAuthError(user)) return user;

  try {
    const parsed = await parseJsonBody(request, playerSchema);
    if ("error" in parsed) return parsed.error;

    await savePlayer(user.uid, parsed.data as Player);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/players failed", error);
    return NextResponse.json(
      { error: "Failed to save player" },
      { status: 500 }
    );
  }
}
