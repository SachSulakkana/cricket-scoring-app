"use client";

import { useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import TournamentMatchApp from "@/components/TournamentMatchApp";
import { Team } from "@/lib/cricket-types";
import { routes } from "@/lib/app-routes";
import { appToast } from "@/lib/app-toast";
import { clearLiveMatchDraftLocal, clearLiveMatchDraftRemote } from "@/lib/live-match-draft";
import { updateTournament } from "@/lib/roster-storage";
import {
  afterMatchUpdate,
  tryAdvanceStage,
} from "@/lib/tournament-stage-engine";
import {
  useRosterHydrated,
  useTeams,
  useTournament,
} from "@/lib/store/roster-hooks";
import { isTournamentTemplate } from "@/lib/tournament-template";

export default function PlayTournamentFixturePage() {
  const router = useRouter();
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const fixtureId = typeof params.fixtureId === "string" ? params.fixtureId : "";
  const hydrated = useRosterHydrated();
  const tournament = useTournament(id);
  const allTeams = useTeams();

  const teams = useMemo(() => {
    return new Map(allTeams.map((team) => [team.id, team]));
  }, [allTeams]);

  const fixture = useMemo(() => {
    if (!tournament) return undefined;
    return tournament.fixtures.find((fx) => fx.id === fixtureId);
  }, [fixtureId, tournament]);

  const teamA = fixture ? teams.get(fixture.teamAId) : undefined;
  const teamB = fixture ? teams.get(fixture.teamBId) : undefined;

  useEffect(() => {
    if (!hydrated) return;
    if (!id || !fixtureId) {
      router.replace(routes.playTournament);
      return;
    }
    if (tournament && isTournamentTemplate(tournament)) {
      router.replace(routes.playTournamentNewCustom);
      return;
    }
    if (!tournament || !fixture || !teamA || !teamB) {
      router.replace(routes.playCustomTournamentGame(id));
    }
  }, [fixture, fixtureId, hydrated, id, router, teamA, teamB, tournament]);

  if (!hydrated || !tournament || !fixture || !teamA || !teamB) {
    return null;
  }

  return (
    <TournamentMatchApp
      fixture={fixture}
      teamA={teamA as Team}
      teamB={teamB as Team}
      overs={tournament.totalOvers}
      ballsPerOver={tournament.ballsPerOver}
      tournamentId={tournament.id}
      onBack={() => router.push(routes.playCustomTournamentGame(tournament.id))}
      onComplete={(result) => {
        void (async () => {
          let updated = {
            ...tournament,
            fixtures: tournament.fixtures.map((fx) =>
              fx.id === fixture.id
                ? {
                    ...fx,
                    played: true,
                    result,
                  }
                : fx
            ),
          };
          updated = afterMatchUpdate(updated);
          const advance = tryAdvanceStage(updated);
          updated = advance.tournament;
          try {
            await updateTournament(updated);
            clearLiveMatchDraftLocal();
            void clearLiveMatchDraftRemote();
            if (advance.championTeamId) {
              appToast.success("Tournament complete — champion crowned!");
            } else if (advance.advanced && advance.message) {
              appToast.success(advance.message);
            } else {
              appToast.success("Match result saved");
            }
            router.push(routes.playCustomTournamentGame(tournament.id));
          } catch (err) {
            appToast.error(
              err instanceof Error
                ? err.message
                : "Could not save match result"
            );
          }
        })();
      }}
    />
  );
}
