import { NextResponse } from "next/server";
import { isAuthError, requireUser } from "@/lib/api-auth";
import { parseJsonBody } from "@/lib/api-route-utils";
import { liveDraftPutSchema } from "@/lib/api-schemas";
import {
  clearLiveMatchDraft,
  getLiveMatchDraft,
  saveLiveMatchDraft,
} from "@/lib/firestore-db";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const user = await requireUser(request);
  if (isAuthError(user)) return user;

  try {
    const draft = await getLiveMatchDraft(user.uid);
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
  const user = await requireUser(request);
  if (isAuthError(user)) return user;

  try {
    const parsed = await parseJsonBody(request, liveDraftPutSchema);
    if ("error" in parsed) return parsed.error;

    await saveLiveMatchDraft(
      user.uid,
      parsed.data.matchState,
      parsed.data.meta ?? null,
      parsed.data.updatedAt
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

export async function DELETE(request: Request) {
  const user = await requireUser(request);
  if (isAuthError(user)) return user;

  try {
    await clearLiveMatchDraft(user.uid);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/matches/draft failed", error);
    return NextResponse.json(
      { error: "Failed to clear live match draft" },
      { status: 500 }
    );
  }
}
