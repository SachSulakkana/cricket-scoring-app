import { NextResponse } from "next/server";
import { sqliteLoadAll } from "@/lib/sqlite-db";

export const runtime = "nodejs";

export async function GET() {
  try {
    const data = sqliteLoadAll();
    return NextResponse.json(data);
  } catch (error) {
    console.error("GET /api/roster failed", error);
    return NextResponse.json(
      { error: "Failed to load roster data" },
      { status: 500 }
    );
  }
}
