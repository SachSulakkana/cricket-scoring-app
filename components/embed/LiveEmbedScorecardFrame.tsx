"use client";

import type { CSSProperties } from "react";
import { SpectatorInningsScorecardSheet } from "@/components/spectator-innings-tables";
import type { MatchState } from "@/lib/cricket-types";
import { getBattingDisplay, getBowlingRows } from "@/lib/spectator-scorecard-innings";
import type { InningsViewContext } from "@/lib/spectator-scorecard-innings";
import { cn } from "@/lib/utils";

interface LiveEmbedScorecardFrameProps {
  title: string;
  mode: "batting" | "bowling";
  ctx: InningsViewContext;
  matchState: MatchState;
}

export function LiveEmbedScorecardFrame({
  title,
  mode,
  ctx,
  matchState,
}: LiveEmbedScorecardFrameProps) {
  const { displayed, yetToBat } =
    mode === "batting"
      ? getBattingDisplay(ctx.innings, ctx.battingTeam)
      : { displayed: [], yetToBat: [] as string[] };

  const tableRows =
    mode === "batting"
      ? displayed.length + (yetToBat.length > 0 ? 1 + yetToBat.length : 0) + 3
      : getBowlingRows(ctx).length + 1;

  return (
    <div
      className={cn(
        "live-embed-scorecard live-embed-scorecard--full",
        mode === "batting" && "live-embed-scorecard--fit-batting"
      )}
      style={
        {
          "--embed-table-rows": tableRows,
        } as CSSProperties
      }
    >
      <div className="live-embed-scorecard__matchup">
        <span className="live-embed-scorecard__team">{matchState.team1.name}</span>
        <span className="live-embed-scorecard__vs" aria-hidden>
          Vs
        </span>
        <span className="live-embed-scorecard__team">{matchState.team2.name}</span>
      </div>
      <h2 className="live-embed-scorecard__title live-embed-scorecard__title--kind">
        {title}
      </h2>
      <div className="live-embed-scorecard__body">
        <SpectatorInningsScorecardSheet ctx={ctx} mode={mode} embedMode />
      </div>
    </div>
  );
}
