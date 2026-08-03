import { NextResponse } from "next/server";
import { isAuthError, requireUser } from "@/lib/api-auth";
import { parseJsonBody } from "@/lib/api-route-utils";
import { dataClearSchema } from "@/lib/api-schemas";
import { runDataClear } from "@/lib/firestore-db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await requireUser(request);
  if (isAuthError(user)) return user;

  try {
    const parsed = await parseJsonBody(request, dataClearSchema);
    if ("error" in parsed) return parsed.error;

    await runDataClear(user.uid, parsed.data.action);
    return NextResponse.json({ ok: true, action: parsed.data.action });
  } catch (error) {
    console.error("POST /api/settings/clear failed", error);
    return NextResponse.json(
      { error: "Failed to clear data" },
      { status: 500 }
    );
  }
}
