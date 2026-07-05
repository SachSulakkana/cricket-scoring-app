import { NextResponse } from "next/server";
import { requireMutationAuth } from "@/lib/api-auth";
import { parseJsonBody } from "@/lib/api-route-utils";
import { playerSchema } from "@/lib/api-schemas";
import {
  deletePlayer,
  savePlayer,
  syncPlayerInTeams,
} from "@/lib/firestore-db";
import type { Player } from "@/lib/cricket-types";

export const runtime = "nodejs";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requireMutationAuth(request);
  if (authError) return authError;

  try {
    const { id } = await params;
    const parsed = await parseJsonBody(request, playerSchema);
    if ("error" in parsed) return parsed.error;

    if (parsed.data.id !== id) {
      return NextResponse.json({ error: "ID mismatch" }, { status: 400 });
    }
    await savePlayer(parsed.data as Player);
    await syncPlayerInTeams(parsed.data as Player);
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
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requireMutationAuth(request);
  if (authError) return authError;

  try {
    const { id } = await params;
    await deletePlayer(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/players/[id] failed", error);
    return NextResponse.json(
      { error: "Failed to delete player" },
      { status: 500 }
    );
  }
}
