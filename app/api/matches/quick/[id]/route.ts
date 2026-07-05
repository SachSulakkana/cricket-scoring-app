import { NextResponse } from "next/server";
import { getQuickMatchById } from "@/lib/firestore-db";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const match = await getQuickMatchById(id);
    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }
    return NextResponse.json({ match });
  } catch (error) {
    console.error("GET /api/matches/quick/[id] failed", error);
    return NextResponse.json(
      { error: "Failed to load quick match" },
      { status: 500 }
    );
  }
}
