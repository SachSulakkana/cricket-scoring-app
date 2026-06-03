"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import PlayTournamentHubPage from "@/components/PlayTournamentHubPage";
import { routes } from "@/lib/app-routes";
import { getTournamentResumeRoute } from "@/lib/tournament-play-status";
import type { SavedTournament } from "@/lib/roster-storage";

export default function PlayTournamentPage() {
  const router = useRouter();

  const handleResume = useCallback(
    (tournament: SavedTournament) => {
      router.push(getTournamentResumeRoute(tournament));
    },
    [router]
  );

  return (
    <PlayTournamentHubPage
      onBack={() => router.push(routes.home)}
      onStartNewTournament={() => router.push(routes.playTournamentNew)}
      onResumeTournament={handleResume}
    />
  );
}
