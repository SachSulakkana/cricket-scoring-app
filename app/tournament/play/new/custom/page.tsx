"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import SelectCustomTournamentPage from "@/components/SelectCustomTournamentPage";
import { routes } from "@/lib/app-routes";
import { appToast } from "@/lib/app-toast";
import type { SavedTournament } from "@/lib/roster-storage";
import { getTournamentResumeRoute } from "@/lib/tournament-play-status";
import { startPlayFromTemplate } from "@/lib/tournament-template";

export default function SelectCustomTournamentRoutePage() {
  const router = useRouter();
  const [startingId, setStartingId] = useState<string | null>(null);

  const handleStart = async (template: SavedTournament) => {
    setStartingId(template.id);
    try {
      const instance = await startPlayFromTemplate(template);
      appToast.success(`Starting ${template.name}`);
      router.push(routes.playCustomTournament(instance.id));
    } catch (err) {
      appToast.error(
        err instanceof Error ? err.message : "Could not start tournament"
      );
    } finally {
      setStartingId(null);
    }
  };

  return (
    <SelectCustomTournamentPage
      onBack={() => router.push(routes.playTournamentNew)}
      onCreateTemplate={() => router.push(routes.createTournament)}
      onStartTemplate={(template) => void handleStart(template)}
      onResumeRun={(run) =>
        router.push(getTournamentResumeRoute(run))
      }
      startingTemplateId={startingId}
    />
  );
}
