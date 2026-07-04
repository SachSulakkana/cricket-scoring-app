import { NextResponse } from "next/server";
import { loadAll } from "@/lib/firestore-db";

export const runtime = "nodejs";

export async function GET() {
  try {
    const data = await loadAll();
    return NextResponse.json(data);
  } catch (error) {
    console.error("GET /api/roster failed", error);
    return NextResponse.json(
      { error: "Failed to load roster data" },
      { status: 500 }
    );
  }
}
