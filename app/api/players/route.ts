import { NextResponse } from "next/server";
import { sqliteSavePlayer } from "@/lib/sqlite-db";
import type { Player } from "@/lib/cricket-types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const player = (await request.json()) as Player;
    sqliteSavePlayer(player);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/players failed", error);
    return NextResponse.json(
      { error: "Failed to save player" },
      { status: 500 }
    );
  }
}
