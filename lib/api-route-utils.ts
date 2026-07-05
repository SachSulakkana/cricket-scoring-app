import "server-only";

import { NextResponse } from "next/server";
import type { ZodSchema } from "zod";

export async function parseJsonBody<T>(
  request: Request,
  schema: ZodSchema<T>
): Promise<{ data: T } | { error: NextResponse }> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return {
      error: NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }),
    };
  }

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return {
      error: NextResponse.json(
        {
          error: "Validation failed",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      ),
    };
  }

  return { data: parsed.data };
}

export function apiError(message: string, status = 500) {
  return NextResponse.json({ error: message }, { status });
}
