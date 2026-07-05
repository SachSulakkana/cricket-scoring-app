import { NextResponse } from "next/server";
import { requireMutationAuth } from "@/lib/api-auth";
import { parseJsonBody } from "@/lib/api-route-utils";
import { playersImportSchema } from "@/lib/api-schemas";
import { bulkImportPlayers } from "@/lib/firestore-db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const authError = requireMutationAuth(request);
  if (authError) return authError;

  try {
    const parsed = await parseJsonBody(request, playersImportSchema);
    if ("error" in parsed) return parsed.error;

    const imported = await bulkImportPlayers(parsed.data.players);
    return NextResponse.json({ imported });
  } catch (error) {
    console.error("POST /api/players/import failed", error);
    return NextResponse.json(
      { error: "Failed to import players" },
      { status: 500 }
    );
  }
}
