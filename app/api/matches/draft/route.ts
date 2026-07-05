import { NextResponse } from "next/server";
import { requireMutationAuth } from "@/lib/api-auth";
import { parseJsonBody } from "@/lib/api-route-utils";
import { liveDraftPutSchema } from "@/lib/api-schemas";
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
  const authError = requireMutationAuth(request);
  if (authError) return authError;

  try {
    const parsed = await parseJsonBody(request, liveDraftPutSchema);
    if ("error" in parsed) return parsed.error;

    await saveLiveMatchDraft(
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
  const authError = requireMutationAuth(request);
  if (authError) return authError;

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
