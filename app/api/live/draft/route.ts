import { NextResponse } from "next/server";
import { getLiveMatchDraft } from "@/lib/firestore-db";
import {
  LIVE_SHARE_QUERY_PARAM,
  resolveUidFromLiveShareKey,
} from "@/lib/live-share";

export const runtime = "nodejs";

/** Public live draft for OBS / spectator overlays (share key required). */
export async function GET(request: Request) {
  try {
    const key = new URL(request.url).searchParams.get(LIVE_SHARE_QUERY_PARAM);
    if (!key?.trim()) {
      return NextResponse.json({ error: "Missing share key" }, { status: 400 });
    }

    const uid = await resolveUidFromLiveShareKey(key);
    if (!uid) {
      return NextResponse.json({ error: "Invalid share key" }, { status: 404 });
    }

    const draft = await getLiveMatchDraft(uid);
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
    console.error("GET /api/live/draft failed", error);
    return NextResponse.json(
      { error: "Failed to load live match draft" },
      { status: 500 }
    );
  }
}
