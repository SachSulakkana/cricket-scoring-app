"use client";

import { useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import CustomTournamentPlayPage from "@/components/CustomTournamentPlayPage";
import {
  getSafeReturnTo,
  resolveBackRoute,
  RETURN_TO_PARAM,
  routes,
  withReturnTo,
} from "@/lib/app-routes";
import { useRosterHydrated, useTournament } from "@/lib/store/roster-hooks";
import { isTournamentTemplate } from "@/lib/tournament-template";
import { isTournamentStarted } from "@/lib/tournament-play-status";

export default function PlayCustomTournamentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = getSafeReturnTo(searchParams.get(RETURN_TO_PARAM));
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
      return;
    }
    if (isTournamentStarted(tournament)) {
      router.replace(
        returnTo
          ? withReturnTo(
              routes.playCustomTournamentGame(tournament.id),
              returnTo
            )
          : routes.playCustomTournamentGame(tournament.id)
      );
    }
  }, [hydrated, id, returnTo, tournament, router]);

  if (
    !hydrated ||
    !tournament ||
    isTournamentTemplate(tournament) ||
    isTournamentStarted(tournament)
  ) {
    return null;
  }

  return (
    <CustomTournamentPlayPage
      tournament={tournament}
      onBack={() =>
        router.push(resolveBackRoute(routes.playTournament, returnTo))
      }
      onStartTournament={(nextTournament) =>
        router.push(
          returnTo
            ? withReturnTo(
                routes.playCustomTournamentGame(nextTournament.id),
                returnTo
              )
            : routes.playCustomTournamentGame(nextTournament.id)
        )
      }
    />
  );
}
