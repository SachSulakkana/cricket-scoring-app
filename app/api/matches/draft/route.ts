import { NextResponse } from "next/server";
import {
  clearLiveMatchDraft,
  getLiveMatchDraft,
  saveLiveMatchDraft,
} from "@/lib/firestore-db";

export const runtime = "nodejs";

export async function GET() {
  try {
    const draft = await getLiveMatchDraft();
    if (!draft) {
      return NextResponse.json({ draft: null });
    }
    return NextResponse.json({
      draft: {
        matchState: draft.matchState,
        meta: draft.meta,
        updatedAt: draft.updatedAt,
      },
    });
  } catch (error) {
    console.error("GET /api/matches/draft failed", error);
    return NextResponse.json(
      { error: "Failed to load live match draft" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as {
      matchState?: unknown;
      meta?: unknown;
      updatedAt?: string;
    };
    if (!body.matchState) {
      return NextResponse.json({ error: "matchState required" }, { status: 400 });
    }
    await saveLiveMatchDraft(
      body.matchState,
      body.meta ?? null,
      body.updatedAt ?? new Date().toISOString()
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("PUT /api/matches/draft failed", error);
    return NextResponse.json(
      { error: "Failed to save live match draft" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    await clearLiveMatchDraft();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/matches/draft failed", error);
    return NextResponse.json(
      { error: "Failed to clear live match draft" },
      { status: 500 }
    );
  }
}
