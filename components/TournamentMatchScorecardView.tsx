"use client";

import { Fragment, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { InningsData, Team } from "@/lib/cricket-types";
import type { TournamentMatchSnapshot } from "@/lib/roster-storage";
import {
  calculateBatting,
  calculateBowling,
  calculateExtras,
  calculateInningsTotal,
  calculateOvers,
  getBowlerBallByBall,
  resolveBattingBowlingTeams,
} from "@/lib/scorecard-stats";

interface TournamentMatchScorecardViewProps {
  snapshot: TournamentMatchSnapshot;
}

export default function TournamentMatchScorecardView({
  snapshot,
}: TournamentMatchScorecardViewProps) {
  const [expandedBowlerKeys, setExpandedBowlerKeys] = useState<Record<string, boolean>>(
    {}
  );
  const ballsPerOver = snapshot.config.ballsPerOver;

  const toggleBowlerDetails = (key: string) => {
    setExpandedBowlerKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const renderInningsScorecard = (innings: InningsData | null) => {
    if (!innings) return null;

    const { battingTeam, bowlingTeam } = resolveBattingBowlingTeams(
      innings,
      snapshot.team1,
      snapshot.team2
    );
    const totals = calculateInningsTotal(innings);
    const battingRows = calculateBatting(innings, battingTeam);
    const bowlingRows = calculateBowling(innings, bowlingTeam, ballsPerOver);
    const extras = calculateExtras(innings);
    const title = `${innings.teamName} innings`;

    return (
      <Card
        key={innings.teamId}
        className="cricket-broadcast-card border-0 shadow-none gap-0 py-0"
      >
        <CardHeader>
          <CardTitle className="text-white flex justify-between items-center gap-3">
            <span className="truncate">{title}</span>
            <span className="text-[var(--cricket-gold)] shrink-0">
              {totals.runs}/{totals.wickets} ({calculateOvers(innings.balls, ballsPerOver)})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-white font-semibold mb-3">Batting</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-slate-200">
                <thead className="text-slate-400 border-b border-slate-700">
                  <tr>
                    <th className="py-2">Batter</th>
                    <th className="py-2 text-right">R</th>
                    <th className="py-2 text-right">B</th>
                    <th className="py-2 text-right">4s</th>
                    <th className="py-2 text-right">6s</th>
                    <th className="py-2 text-right">SR</th>
                  </tr>
                </thead>
                <tbody>
                  {battingRows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-3 text-slate-400">
                        No batting data
                      </td>
                    </tr>
                  ) : (
                    battingRows.map((row) => (
                      <tr key={row.name} className="border-b border-slate-700/50">
                        <td className="py-2">
                          <div>{row.name}</div>
                          {row.dismissal !== "not out" && (
                            <div className="text-xs text-slate-400">{row.dismissal}</div>
                          )}
                        </td>
                        <td className="py-2 text-right font-semibold">{row.runs}</td>
                        <td className="py-2 text-right">{row.balls}</td>
                        <td className="py-2 text-right">{row.fours}</td>
                        <td className="py-2 text-right">{row.sixes}</td>
                        <td className="py-2 text-right">{row.strikeRate}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <p className="text-sm text-slate-400 mt-2">Extras: {extras.total}</p>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-3">Bowling</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-slate-200">
                <thead className="text-slate-400 border-b border-slate-700">
                  <tr>
                    <th className="py-2">Bowler</th>
                    <th className="py-2 text-right">O</th>
                    <th className="py-2 text-right">M</th>
                    <th className="py-2 text-right">R</th>
                    <th className="py-2 text-right">W</th>
                    <th className="py-2 text-right">Econ</th>
                  </tr>
                </thead>
                <tbody>
                  {bowlingRows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-3 text-slate-400">
                        No bowling data
                      </td>
                    </tr>
                  ) : (
                    bowlingRows.map((row) => {
                      const key = `${innings.teamId}-${row.name}`;
                      const expanded = expandedBowlerKeys[key];
                      const ballByBall = getBowlerBallByBall(innings, row.name);
                      const overs = calculateOvers(
                        innings.balls.filter((b) => b.bowlerName === row.name),
                        ballsPerOver
                      );
                      return (
                        <Fragment key={row.name}>
                          <tr className="border-b border-slate-700/50">
                            <td className="py-2">
                              <button
                                type="button"
                                className="flex items-center gap-1 text-left hover:text-white"
                                onClick={() => toggleBowlerDetails(key)}
                              >
                                {expanded ? (
                                  <ChevronUp className="h-3 w-3" />
                                ) : (
                                  <ChevronDown className="h-3 w-3" />
                                )}
                                {row.name}
                              </button>
                            </td>
                            <td className="py-2 text-right">{overs}</td>
                            <td className="py-2 text-right">{row.maidens}</td>
                            <td className="py-2 text-right">{row.runs}</td>
                            <td className="py-2 text-right font-semibold">
                              {row.wickets}
                            </td>
                            <td className="py-2 text-right">{row.economy}</td>
                          </tr>
                          {expanded && ballByBall.length > 0 && (
                            <tr className="border-b border-slate-700/30">
                              <td colSpan={6} className="py-2 text-xs text-slate-400">
                                {ballByBall.join(" · ")}
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      {renderInningsScorecard(snapshot.innings1)}
      {renderInningsScorecard(snapshot.innings2)}
    </div>
  );
}
