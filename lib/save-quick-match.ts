import type { MatchState } from "./cricket-types";

export async function saveQuickMatchToDatabase(
  matchState: MatchState,
  label?: string
): Promise<{ id: string; label: string }> {
  const res = await fetch("/api/matches/quick", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ matchState, label }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { error?: string }).error ?? "Failed to save quick match"
    );
  }
  return (await res.json()) as { id: string; label: string };
}
