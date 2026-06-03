"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import TournamentPlaceholder from "@/components/TournamentPlaceholder";
import type { TournamentPreset } from "@/lib/cricket-types";
import { routes } from "@/lib/app-routes";

const PRESETS: TournamentPreset[] = ["T20", "ODI", "T10"];

function isTournamentPreset(value: string): value is TournamentPreset {
  return PRESETS.includes(value as TournamentPreset);
}

export default function PlayTournamentPresetPage() {
  const router = useRouter();
  const params = useParams();
  const raw = typeof params.preset === "string" ? params.preset : "";
  const preset = isTournamentPreset(raw) ? raw : undefined;

  useEffect(() => {
    if (!preset) {
      router.replace(routes.playTournament);
    }
  }, [preset, router]);

  if (!preset) {
    return null;
  }

  return (
    <TournamentPlaceholder
      preset={preset}
      onBack={() => router.push(routes.playTournament)}
    />
  );
}
