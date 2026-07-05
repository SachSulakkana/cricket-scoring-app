"use client";

import { useState } from "react";
import type { Team } from "@/lib/cricket-types";
import {
  CricketAddButton,
  CricketBroadcastCard,
  CricketEyebrow,
} from "@/components/cricket-shell";

export type TossDecision = "bat" | "bowl";

interface MatchTossSetupProps {
  teamA: Team;
  teamB: Team;
  onContinue: (params: {
    battingTeam: Team;
    bowlingTeam: Team;
    tossWinnerId: string;
    tossDecision: TossDecision;
  }) => void;
  variant?: "quick" | "tournament";
  eyebrow?: string;
  title?: string;
}

const teamButtonClass = (selected: boolean) =>
  `rounded-md border p-3 min-h-11 text-left transition touch-manipulation ${
    selected
      ? "border-[oklch(0.6_0.1_85)] bg-[oklch(0.32_0.08_85/0.35)] text-[var(--cricket-cream)]"
      : "border-[oklch(0.32_0.04_255)] bg-[oklch(0.12_0.02_255/0.6)] text-[oklch(0.65_0.03_255)] hover:border-[oklch(0.45_0.08_295/0.5)]"
  }`;

export default function MatchTossSetup({
  teamA,
  teamB,
  onContinue,
  variant = "quick",
  eyebrow = "Match setup",
  title = "Toss and opening setup",
}: MatchTossSetupProps) {
  const [tossWinnerId, setTossWinnerId] = useState<string | null>(null);
  const [tossDecision, setTossDecision] = useState<TossDecision | null>(null);

  const handleContinue = () => {
    if (!tossWinnerId || !tossDecision) return;
    const winner = tossWinnerId === teamA.id ? teamA : teamB;
    const loser = tossWinnerId === teamA.id ? teamB : teamA;
    const batting = tossDecision === "bat" ? winner : loser;
    const bowling = tossDecision === "bat" ? loser : winner;
    onContinue({
      battingTeam: batting,
      bowlingTeam: bowling,
      tossWinnerId,
      tossDecision,
    });
  };

  return (
    <CricketBroadcastCard accent className="p-5 space-y-4">
      <div>
        <CricketEyebrow className="mb-1">{eyebrow}</CricketEyebrow>
        <h2 className="cricket-display text-xl font-semibold text-[var(--cricket-cream)]">
          {title}
        </h2>
      </div>

      <div className="space-y-3">
        <p className="text-sm text-[oklch(0.65_0.03_255)]">Toss won by</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {[teamA, teamB].map((team) => (
            <button
              key={team.id}
              type="button"
              className={teamButtonClass(tossWinnerId === team.id)}
              onClick={() => setTossWinnerId(team.id)}
            >
              {team.name}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-sm text-[oklch(0.65_0.03_255)]">Decision</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            className={teamButtonClass(tossDecision === "bat")}
            onClick={() => setTossDecision("bat")}
          >
            Bat first
          </button>
          <button
            type="button"
            className={teamButtonClass(tossDecision === "bowl")}
            onClick={() => setTossDecision("bowl")}
          >
            Bowl first
          </button>
        </div>
      </div>

      <CricketAddButton
        type="button"
        variant={variant === "tournament" ? "tournament" : "team"}
        size="inline"
        onClick={handleContinue}
        disabled={!tossWinnerId || !tossDecision}
      >
        Continue
      </CricketAddButton>
    </CricketBroadcastCard>
  );
}
