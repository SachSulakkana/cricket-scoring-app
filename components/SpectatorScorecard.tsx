"use client";

import { useEffect, useState } from "react";
import type { InningsData, MatchState, Team } from "@/lib/cricket-types";
import {
  SpectatorInningsBattingTable,
  SpectatorInningsBowlingTable,
} from "@/components/spectator-innings-tables";
import { cn } from "@/lib/utils";
import { calculateInningsTotal } from "@/lib/scorecard-stats";
import { calculateOvers } from "@/lib/spectator-scorecard-innings";

interface SpectatorScorecardProps {
  matchState: MatchState;
}

function abbreviateTeamName(name: string): string {
  const letters = name.replace(/[^a-zA-Z]/g, "");
  if (letters.length >= 3) return letters.slice(0, 3).toUpperCase();
  return name.slice(0, 3).toUpperCase();
}

function InningsScorecard({
  inningsNumber,
  innings,
  battingTeam,
  bowlingTeam,
  ballsPerOver,
  expandedBowlerKeys,
  onToggleBowler,
}: {
  inningsNumber: 1 | 2;
  innings: InningsData;
  battingTeam: Team;
  bowlingTeam: Team;
  ballsPerOver: number;
  expandedBowlerKeys: Record<string, boolean>;
  onToggleBowler: (key: string) => void;
}) {
  const totals = calculateInningsTotal(innings);
  const overs = calculateOvers(innings.balls, ballsPerOver);
  const inningsLabel = `${battingTeam.name} ${inningsNumber === 1 ? "1st" : "2nd"} Innings`;
  const ctx = {
    inningsNumber,
    innings,
    battingTeam,
    bowlingTeam,
    ballsPerOver,
  };

  return (
    <div className="cricket-scorecard-sheet">
      <div className="cricket-scorecard-innings-header">
        <span className="truncate">{inningsLabel}</span>
        <span className="cricket-scorecard-innings-header__score">
          {totals.runs}-{totals.wickets} ({overs} Ov)
        </span>
      </div>

      <SpectatorInningsBattingTable ctx={ctx} />

      <SpectatorInningsBowlingTable
        ctx={ctx}
        expandedBowlerKeys={expandedBowlerKeys}
        onToggleBowler={onToggleBowler}
      />
    </div>
  );
}

export default function SpectatorScorecard({ matchState }: SpectatorScorecardProps) {
  const ballsPerOver = matchState.config?.ballsPerOver ?? 6;
  const innings2Available = Boolean(matchState.innings2);
  const [activeInningsTab, setActiveInningsTab] = useState<1 | 2>(() =>
    matchState.currentInnings === 2 && matchState.innings2 ? 2 : 1
  );
  const [expandedBowlerKeys, setExpandedBowlerKeys] = useState<
    Record<string, boolean>
  >({});

  useEffect(() => {
    if (matchState.currentInnings === 2 && matchState.innings2) {
      setActiveInningsTab(2);
    }
  }, [matchState.currentInnings, matchState.innings2]);

  const toggleBowlerDetails = (key: string) => {
    setExpandedBowlerKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const renderInnings = (
    inningsNumber: 1 | 2,
    innings: InningsData | null,
    battingTeam: Team,
    bowlingTeam: Team
  ) => {
    if (!innings) return null;
    return (
      <InningsScorecard
        inningsNumber={inningsNumber}
        innings={innings}
        battingTeam={battingTeam}
        bowlingTeam={bowlingTeam}
        ballsPerOver={ballsPerOver}
        expandedBowlerKeys={expandedBowlerKeys}
        onToggleBowler={toggleBowlerDetails}
      />
    );
  };

  return (
    <div className="space-y-3">
      <div className="cricket-scorecard-tabs">
        <button
          type="button"
          onClick={() => setActiveInningsTab(1)}
          className={cn(
            "cricket-scorecard-inn-tab",
            activeInningsTab === 1 && "cricket-scorecard-inn-tab--active"
          )}
        >
          {abbreviateTeamName(matchState.team1.name)} (1st Inn)
        </button>
        <button
          type="button"
          onClick={() => innings2Available && setActiveInningsTab(2)}
          disabled={!innings2Available}
          className={cn(
            "cricket-scorecard-inn-tab",
            activeInningsTab === 2 && "cricket-scorecard-inn-tab--active",
            !innings2Available && "cricket-scorecard-inn-tab--disabled"
          )}
        >
          {abbreviateTeamName(matchState.team2.name)} (2nd Inn)
        </button>
      </div>

      {activeInningsTab === 1 &&
        renderInnings(
          1,
          matchState.innings1,
          matchState.team1,
          matchState.team2
        )}

      {activeInningsTab === 2 &&
        innings2Available &&
        renderInnings(
          2,
          matchState.innings2,
          matchState.team2,
          matchState.team1
        )}
    </div>
  );
}
