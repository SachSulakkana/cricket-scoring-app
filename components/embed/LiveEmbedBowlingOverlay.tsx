"use client";

import { useMemo } from "react";
import LiveEmbedPanelShell from "@/components/embed/LiveEmbedPanelShell";
import { LiveEmbedScorecardFrame } from "@/components/embed/LiveEmbedScorecardFrame";
import { useLiveMatchSnapshot } from "@/hooks/use-live-match-snapshot";
import { resolveCurrentInningsContext } from "@/lib/spectator-scorecard-innings";

export default function LiveEmbedBowlingOverlay() {
  const { draft, loading, error } = useLiveMatchSnapshot();

  const ctx = useMemo(() => {
    if (!draft?.matchState) return null;
    return resolveCurrentInningsContext(draft.matchState);
  }, [draft]);

  if (loading) {
    return <LiveEmbedPanelShell centered loading />;
  }

  if (!ctx || !draft?.matchState) {
    return (
      <LiveEmbedPanelShell
        centered
        emptyMessage={error ?? "No live match scorecard"}
      />
    );
  }

  return (
    <LiveEmbedPanelShell centered>
      <LiveEmbedScorecardFrame
        title="Bowling scorecard"
        mode="bowling"
        ctx={ctx}
        matchState={draft.matchState}
      />
    </LiveEmbedPanelShell>
  );
}
