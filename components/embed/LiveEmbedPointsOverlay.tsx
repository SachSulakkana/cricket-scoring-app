"use client";

import LiveEmbedPanelShell from "@/components/embed/LiveEmbedPanelShell";
import SpectatorPointsTable from "@/components/SpectatorPointsTable";
import { useEffectiveSpectatorMeta } from "@/hooks/use-spectator-meta";
import { useSpectatorTournament } from "@/hooks/use-spectator-tournament";

export default function LiveEmbedPointsOverlay() {
  const meta = useEffectiveSpectatorMeta(null);
  const tournamentId =
    meta?.kind === "tournament" ? meta.tournamentId : undefined;
  const { data, loading, error } = useSpectatorTournament(tournamentId);

  if (!tournamentId) {
    return (
      <LiveEmbedPanelShell
        centered
        emptyMessage="Tournament link required for points table."
      />
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
      <SpectatorPointsTable data={data} />
    </LiveEmbedPanelShell>
  );
}
