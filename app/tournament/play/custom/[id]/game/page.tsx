"use client";

import { useEffect, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import CustomTournamentGamePage from "@/components/CustomTournamentGamePage";
import { routes } from "@/lib/app-routes";
import { Team } from "@/lib/cricket-types";
import {
  TournamentFixture,
  updateTournament,
} from "@/lib/roster-storage";
import { useRosterHydrated, useTeams, useTournament } from "@/lib/store/roster-hooks";
import { appToast } from "@/lib/app-toast";
import { isTournamentTemplate } from "@/lib/tournament-template";

function buildDefaultFixtures(teamIds: string[]): TournamentFixture[] {
  const fixtures: TournamentFixture[] = [];
  for (let i = 0; i < teamIds.length; i += 1) {
    for (let j = i + 1; j < teamIds.length; j += 1) {
      fixtures.push({
        id: `${teamIds[i]}-${teamIds[j]}`,
        teamAId: teamIds[i],
        teamBId: teamIds[j],
        played: false,
      });
    }
  }
  return fixtures;
}

export default function PlayCustomTournamentGamePage() {
  const router = useRouter();
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const hydrated = useRosterHydrated();
  const tournament = useTournament(id);
  const allTeams = useTeams();
  const syncingFixtures = useRef(false);

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

  const selectedTeams = useMemo(() => {
    if (!tournament) return [];
    const teamMap = new Map(allTeams.map((team) => [team.id, team]));
    return tournament.selectedTeamIds
      .map((teamId) => teamMap.get(teamId))
      .filter((team): team is Team => Boolean(team));
  }, [allTeams, tournament]);

  useEffect(() => {
    if (!tournament) return;
    if (selectedTeams.length < 2) {
      router.replace(routes.playCustomTournament(tournament.id));
    }
  }, [router, selectedTeams.length, tournament]);

  useEffect(() => {
    if (!tournament || syncingFixtures.current) return;
    const validTeamIds = selectedTeams.map((team) => team.id);
    const generated = buildDefaultFixtures(validTeamIds);
    if (generated.length === 0) return;

    const existingById = new Map(tournament.fixtures.map((fx) => [fx.id, fx]));
    const merged = generated.map((fx) => existingById.get(fx.id) ?? fx);

    const changed =
      tournament.fixtures.length !== merged.length ||
      merged.some((fx, i) => tournament.fixtures[i]?.id !== fx.id);

    if (!changed) return;

    syncingFixtures.current = true;
    const updated = { ...tournament, fixtures: merged };
    void updateTournament(updated)
      .catch((err) => {
        appToast.error(
          err instanceof Error
            ? err.message
            : "Could not update tournament fixtures"
        );
      })
      .finally(() => {
        syncingFixtures.current = false;
      });
  }, [selectedTeams, tournament]);

  if (!hydrated || !tournament || selectedTeams.length < 2) {
    return null;
  }

  return (
    <CustomTournamentGamePage
      tournament={tournament}
      teams={selectedTeams}
      fixtures={tournament.fixtures}
      onBack={() => router.push(routes.playCustomTournament(tournament.id))}
      onPlayNow={(fixtureId) =>
        router.push(routes.playCustomTournamentMatch(tournament.id, fixtureId))
      }
    />
  );
}
