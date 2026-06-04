"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import StartNewTournamentPage from "@/components/StartNewTournamentPage";
import { routes } from "@/lib/app-routes";
import { appToast } from "@/lib/app-toast";
import type { TournamentPreset } from "@/lib/cricket-types";
import type { SavedTournament } from "@/lib/roster-storage";
import { createTournamentFromPreset } from "@/lib/tournament-presets";
import { getTournamentResumeRoute } from "@/lib/tournament-play-status";
import { startPlayFromTemplate } from "@/lib/tournament-template";

export default function StartNewTournamentRoutePage() {
  const router = useRouter();
  const [loadingPreset, setLoadingPreset] = useState<TournamentPreset | null>(
    null
  );
  const [startingTemplateId, setStartingTemplateId] = useState<string | null>(
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

  const handleStartCustom = async (template: SavedTournament) => {
    setStartingTemplateId(template.id);
    try {
      const instance = await startPlayFromTemplate(template);
      appToast.success(`Starting ${template.name}`);
      router.push(routes.playCustomTournament(instance.id));
    } catch (err) {
      appToast.error(
        err instanceof Error ? err.message : "Could not start tournament"
      );
    } finally {
      setStartingTemplateId(null);
    }
  };

  return (
    <StartNewTournamentPage
      onBack={() => router.push(routes.playTournament)}
      onSelectPreset={(preset) => void handlePreset(preset)}
      onStartCustomTemplate={(template) => void handleStartCustom(template)}
      onResumeCustomRun={(run) =>
        router.push(getTournamentResumeRoute(run))
      }
      onCreateTemplate={() => router.push(routes.createTournament)}
      loadingPreset={loadingPreset}
      startingTemplateId={startingTemplateId}
    />
  );
}
