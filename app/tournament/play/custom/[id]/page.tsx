"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import CustomTournamentPlayPage from "@/components/CustomTournamentPlayPage";
import { routes } from "@/lib/app-routes";
import { useRosterHydrated, useTournament } from "@/lib/store/roster-hooks";
import { isTournamentTemplate } from "@/lib/tournament-template";

export default function PlayCustomTournamentPage() {
  const router = useRouter();
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const hydrated = useRosterHydrated();
  const tournament = useTournament(id);

  useEffect(() => {
    if (!hydrated || !id) return;
    if (!tournament) {
      router.replace(routes.playTournament);
      return;
    }
    if (isTournamentTemplate(tournament)) {
      router.replace(routes.playTournamentNewCustom);
    }
  }, [hydrated, id, tournament, router]);

  if (!hydrated || !tournament || isTournamentTemplate(tournament)) {
    return null;
  }

  return (
    <CustomTournamentPlayPage
      tournament={tournament}
      onBack={() => router.push(routes.playTournament)}
      onStartTournament={(nextTournament) =>
        router.push(routes.playCustomTournamentGame(nextTournament.id))
      }
    />
  );
}
