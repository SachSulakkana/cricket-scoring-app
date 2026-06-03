import { NextResponse } from "next/server";
import type { DataClearAction } from "@/lib/data-clear-types";
import { sqliteRunDataClear } from "@/lib/sqlite-db";

export const runtime = "nodejs";

const ACTIONS = new Set<DataClearAction>([
  "match-history",
  "match-data",
  "teams",
  "players",
  "all",
]);

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { action?: string };
    const action = body.action as DataClearAction;
    if (!action || !ACTIONS.has(action)) {
      return NextResponse.json({ error: "Invalid clear action" }, { status: 400 });
    }
    sqliteRunDataClear(action);
    return NextResponse.json({ ok: true, action });
  } catch (error) {
    console.error("POST /api/settings/clear failed", error);
    return NextResponse.json(
      { error: "Failed to clear data" },
      { status: 500 }
    );
  }
}
