"use client";

import { useMemo } from "react";
import LiveEmbedPanelShell from "@/components/embed/LiveEmbedPanelShell";
import { LiveEmbedScorecardFrame } from "@/components/embed/LiveEmbedScorecardFrame";
import { useLiveMatchSnapshot } from "@/hooks/use-live-match-snapshot";
import {
  resolveCurrentInningsContext,
  resolveFirstInningsContext,
} from "@/lib/spectator-scorecard-innings";

type InningsMode = "current" | "first";

export default function LiveEmbedBattingOverlay({
  innings = "current",
}: {
  innings?: InningsMode;
}) {
  const { draft, loading, error } = useLiveMatchSnapshot();

  const ctx = useMemo(() => {
    if (!draft?.matchState) return null;
    return innings === "first"
      ? resolveFirstInningsContext(draft.matchState)
      : resolveCurrentInningsContext(draft.matchState);
  }, [draft, innings]);

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
        title={
          innings === "first" ? "1st innings batting" : "Batting scorecard"
        }
        mode="batting"
        ctx={ctx}
        matchState={draft.matchState}
      />
    </LiveEmbedPanelShell>
  );
}
