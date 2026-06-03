import { NextResponse } from "next/server";
import {
  sqliteDeletePlayer,
  sqliteSavePlayer,
  sqliteSyncPlayerInTeams,
} from "@/lib/sqlite-db";
import type { Player } from "@/lib/cricket-types";

export const runtime = "nodejs";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const player = (await request.json()) as Player;
    if (player.id !== id) {
      return NextResponse.json({ error: "ID mismatch" }, { status: 400 });
    }
    sqliteSavePlayer(player);
    sqliteSyncPlayerInTeams(player);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("PUT /api/players/[id] failed", error);
    return NextResponse.json(
      { error: "Failed to update player" },
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
    sqliteDeletePlayer(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/players/[id] failed", error);
    return NextResponse.json(
      { error: "Failed to delete player" },
      { status: 500 }
    );
  }
}
