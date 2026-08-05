"use client";

import LiveEmbedPanelShell from "@/components/embed/LiveEmbedPanelShell";
import { EmbedMatchFaceoffLayout } from "@/components/embed/LiveEmbedMatchFaceoff";
import { useEffectiveSpectatorMeta } from "@/hooks/use-spectator-meta";
import { useSpectatorTournament } from "@/hooks/use-spectator-tournament";
import { getNextTournamentFixture } from "@/lib/spectator-tournament-next";

export default function LiveEmbedUpcomingMatchOverlay() {
  const meta = useEffectiveSpectatorMeta(null);
  const tournamentId =
    meta?.kind === "tournament" ? meta.tournamentId : undefined;
  const activeFixtureId =
    meta?.kind === "tournament" ? meta.fixtureId : undefined;
  const { data, loading, error } = useSpectatorTournament(tournamentId);

  if (!tournamentId) {
    return (
      <LiveEmbedPanelShell
        centered
        emptyMessage="Tournament link required for upcoming match preview."
      />
    );
  }

  if (loading && !data) {
    return <LiveEmbedPanelShell centered loading />;
  }

  if (error && !data) {
    return <LiveEmbedPanelShell centered emptyMessage={error} />;
  }

  const upcoming = data
    ? getNextTournamentFixture(data, {
        afterFixtureId: activeFixtureId,
        excludeFixtureId: activeFixtureId,
      })
    : null;

  if (!upcoming) {
    return (
      <LiveEmbedPanelShell
        centered
        emptyMessage="No upcoming match scheduled."
      />
    );
  }

  return (
    <LiveEmbedPanelShell centered>
      <EmbedMatchFaceoffLayout
        eyebrow="Coming up next"
        stageLabel={upcoming.stageLabel}
        teamA={upcoming.teamA}
        teamB={upcoming.teamB}
      />
    </LiveEmbedPanelShell>
  );
}
