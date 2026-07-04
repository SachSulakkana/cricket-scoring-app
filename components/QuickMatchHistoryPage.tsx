"use client";

import { useEffect, useState } from "react";
import { History } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import CricketLoader from "@/components/CricketLoader";
import {
  CricketBroadcastCard,
  CricketEyebrow,
  CricketPage,
  CricketPageHeader,
} from "@/components/cricket-shell";

export interface QuickMatchListItem {
  id: string;
  label: string;
  createdAt: string;
}

interface QuickMatchHistoryPageProps {
  onBack: () => void;
}

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export default function QuickMatchHistoryPage({
  onBack,
}: QuickMatchHistoryPageProps) {
  const [items, setItems] = useState<QuickMatchListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/matches/quick")
      .then(async (res) => {
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(body.error ?? "Could not load history");
        }
        return res.json() as Promise<{ matches: QuickMatchListItem[] }>;
      })
      .then((data) => setItems(data.matches ?? []))
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Could not load history")
      );
  }, []);

  return (
    <CricketPage>
      <CricketPageHeader onBack={onBack} title="Quick match history" homeHref="/" />

      {error ? (
        <p className="text-center text-sm text-[oklch(0.72_0.12_25)]">{error}</p>
      ) : items == null ? (
        <CricketLoader block size="lg" label="Loading match history…" />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<History className="h-12 w-12" />}
          title="No saved quick matches"
          description="Finish a quick match and tap Save match to database on the summary screen."
        />
      ) : (
        <ul className="space-y-3">
          {items.map((match) => (
            <li key={match.id}>
              <CricketBroadcastCard className="p-4">
                <CricketEyebrow className="mb-1">Saved match</CricketEyebrow>
                <p className="cricket-display text-base font-semibold text-[var(--cricket-cream)]">
                  {match.label}
                </p>
                <p className="text-[oklch(0.55_0.03_255)] text-xs mt-1">
                  {formatWhen(match.createdAt)}
                </p>
              </CricketBroadcastCard>
            </li>
          ))}
        </ul>
      )}
    </CricketPage>
  );
}
