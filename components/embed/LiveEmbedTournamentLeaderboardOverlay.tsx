"use client";

import LiveEmbedPanelShell from "@/components/embed/LiveEmbedPanelShell";
import SpectatorPlayerLeaderboard from "@/components/SpectatorPlayerLeaderboard";
import { useEffectiveSpectatorMeta } from "@/hooks/use-spectator-meta";
import { useSpectatorTournament } from "@/hooks/use-spectator-tournament";

interface LiveEmbedTournamentLeaderboardOverlayProps {
  mode: "batting" | "bowling";
}

export default function LiveEmbedTournamentLeaderboardOverlay({
  mode,
}: LiveEmbedTournamentLeaderboardOverlayProps) {
  const meta = useEffectiveSpectatorMeta(null);
  const tournamentId =
    meta?.kind === "tournament" ? meta.tournamentId : undefined;
  const { data, loading, error } = useSpectatorTournament(tournamentId);

  const emptyMessage =
    mode === "batting"
      ? "Tournament link required for batting stats."
      : "Tournament link required for bowling stats.";

  const title = mode === "batting" ? "Most Runs" : "Most Wickets";

  if (!tournamentId) {
    return (
      <LiveEmbedPanelShell centered emptyMessage={emptyMessage} />
    );
  }

  if (loading && !data) {
    return <LiveEmbedPanelShell centered loading />;
  }

  if (error && !data) {
    return <LiveEmbedPanelShell centered emptyMessage={error} />;
  }

  if (!data) {
    return (
      <LiveEmbedPanelShell
        centered
        emptyMessage="Tournament data not available."
      />
    );
  }

  return (
    <LiveEmbedPanelShell centered>
      <SpectatorPlayerLeaderboard data={data} mode={mode} title={title} />
    </LiveEmbedPanelShell>
  );
}
