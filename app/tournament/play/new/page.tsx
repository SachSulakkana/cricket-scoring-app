"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import StartNewTournamentPage from "@/components/StartNewTournamentPage";
import { routes } from "@/lib/app-routes";
import { appToast } from "@/lib/app-toast";
import type { TournamentPreset } from "@/lib/cricket-types";
import { createTournamentFromPreset } from "@/lib/tournament-presets";

export default function StartNewTournamentRoutePage() {
  const router = useRouter();
  const [loadingPreset, setLoadingPreset] = useState<TournamentPreset | null>(
    null
  );

  const handlePreset = async (preset: TournamentPreset) => {
    setLoadingPreset(preset);
    try {
      const tournament = await createTournamentFromPreset(preset);
      router.push(routes.playCustomTournament(tournament.id));
    } catch (err) {
      appToast.error(
        err instanceof Error ? err.message : "Could not start tournament"
      );
    } finally {
      setLoadingPreset(null);
    }
  };

  return (
    <StartNewTournamentPage
      onBack={() => router.push(routes.playTournament)}
      onSelectPreset={(preset) => void handlePreset(preset)}
      onSelectCustom={() => router.push(routes.playTournamentNewCustom)}
      loadingPreset={loadingPreset}
    />
  );
}
