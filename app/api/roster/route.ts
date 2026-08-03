import { NextResponse } from "next/server";
import { isAuthError, requireUser } from "@/lib/api-auth";
import { loadAll } from "@/lib/firestore-db";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const user = await requireUser(request);
  if (isAuthError(user)) return user;

  try {
    const data = await loadAll(user.uid);
    return NextResponse.json(data);
  } catch (error) {
    console.error("GET /api/roster failed", error);
    return NextResponse.json(
      { error: "Failed to load roster data" },
      { status: 500 }
    );
  }
}
