import { NextResponse } from "next/server";
import { requireMutationAuth } from "@/lib/api-auth";
import { deleteQuickMatch, getQuickMatchById } from "@/lib/firestore-db";

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

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const authError = requireMutationAuth(request);
  if (authError) return authError;

  try {
    const { id } = await context.params;
    const deleted = await deleteQuickMatch(id);
    if (!deleted) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/matches/quick/[id] failed", error);
    return NextResponse.json(
      { error: "Failed to delete quick match" },
      { status: 500 }
    );
  }
}
