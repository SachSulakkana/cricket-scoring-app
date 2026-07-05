import { NextResponse } from "next/server";
import { requireMutationAuth } from "@/lib/api-auth";
import { parseJsonBody } from "@/lib/api-route-utils";
import { playerSchema } from "@/lib/api-schemas";
import { savePlayer } from "@/lib/firestore-db";
import type { Player } from "@/lib/cricket-types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const authError = requireMutationAuth(request);
  if (authError) return authError;

  try {
    const parsed = await parseJsonBody(request, playerSchema);
    if ("error" in parsed) return parsed.error;

    await savePlayer(parsed.data as Player);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/players failed", error);
    return NextResponse.json(
      { error: "Failed to save player" },
      { status: 500 }
    );
  }
}
