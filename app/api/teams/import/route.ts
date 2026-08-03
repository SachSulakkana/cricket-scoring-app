import { NextResponse } from "next/server";
import { isAuthError, requireUser } from "@/lib/api-auth";
import { parseJsonBody } from "@/lib/api-route-utils";
import { teamsImportSchema } from "@/lib/api-schemas";
import { bulkImportTeams } from "@/lib/firestore-db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await requireUser(request);
  if (isAuthError(user)) return user;

  try {
    const parsed = await parseJsonBody(request, teamsImportSchema);
    if ("error" in parsed) return parsed.error;

    const imported = await bulkImportTeams(user.uid, parsed.data.teams);
    return NextResponse.json({ imported });
  } catch (error) {
    console.error("POST /api/teams/import failed", error);
    return NextResponse.json(
      { error: "Failed to import teams" },
      { status: 500 }
    );
  }
}
