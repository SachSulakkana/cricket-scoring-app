import { NextResponse } from "next/server";
import { isAuthError, requireUser } from "@/lib/api-auth";
import { parseJsonBody } from "@/lib/api-route-utils";
import { playersImportSchema } from "@/lib/api-schemas";
import { bulkImportPlayers } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await requireUser(request);
  if (isAuthError(user)) return user;

  try {
    const parsed = await parseJsonBody(request, playersImportSchema);
    if ("error" in parsed) return parsed.error;

    const imported = await bulkImportPlayers(user.uid, parsed.data.players);
    return NextResponse.json({ imported });
  } catch (error) {
    console.error("POST /api/players/import failed", error);
    return NextResponse.json(
      { error: "Failed to import players" },
      { status: 500 }
    );
  }
}
