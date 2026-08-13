import type { Team } from "@/lib/cricket-types";
import { cn } from "@/lib/utils";
import { Users } from "lucide-react";

function formatScore(runs: number, wickets: number): string {
  return `${runs}/${wickets}`;
}

function teamInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

function ResultTeamLogo({ team }: { team: Team }) {
  return (
    <div className="tournament-match-faceoff__disc h-14 w-14 shrink-0 sm:h-16 sm:w-16">
      {team.logoUrl ? (
        <img
          src={team.logoUrl}
          alt=""
          className="tournament-match-faceoff__disc-img rounded-full"
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center rounded-full bg-[oklch(0.88_0.02_295)] text-sm font-bold text-[oklch(0.35_0.08_295)] sm:text-base">
          {teamInitials(team.name) || (
            <Users className="h-6 w-6 sm:h-7 sm:w-7" aria-hidden />
          )}
        </span>
      )}
    </div>
  );
}

function ResultTeamColumn({
  team,
  name,
  score,
}: {
  team: Team;
  name: string;
  score?: string;
}) {
  return (
    <div className="flex min-w-0 flex-col items-center justify-center gap-2 text-center">
      <ResultTeamLogo team={team} />
      <p className="max-w-full truncate text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-[oklch(0.58_0.03_255)] sm:text-xs">
        {name}
      </p>
      {score != null ? (
        <p className="text-base font-bold tabular-nums text-[oklch(0.88_0.03_255)] sm:text-lg">
          {score}
        </p>
      ) : null}
    </div>
  );
}

interface TournamentFixtureResultProps {
  teamA: Team;
  teamB: Team;
  teamBLabel?: string;
  abandoned?: boolean;
  abandonedMessage?: string;
  drawn?: boolean;
  drawnMessage?: string;
  winnerId?: string;
  runsA?: number;
  wicketsA?: number;
  runsB?: number;
  wicketsB?: number;
}

export function TournamentFixtureResult({
  teamA,
  teamB,
  teamBLabel,
  abandoned,
  abandonedMessage = "Abandoned due to rain — no points",
  drawn,
  drawnMessage = "1 point each",
  winnerId,
  runsA = 0,
  wicketsA = 0,
  runsB = 0,
  wicketsB = 0,
}: TournamentFixtureResultProps) {
  const teamAName = teamA.name.toUpperCase();
  const teamBName = (teamBLabel ?? teamB.name).toUpperCase();
  const winnerName =
    winnerId === teamA.id
      ? teamAName
      : winnerId === teamB.id
        ? teamBName
        : null;

  const headline = abandoned
    ? "MATCH ABANDONED"
    : winnerName
      ? `${winnerName} WON`
      : drawn
        ? "MATCH DRAWN"
        : "MATCH TIED";
  const showScores = !abandoned && !drawn;

  return (
    <div className="border-b border-[oklch(0.28_0.04_288/0.45)] bg-gradient-to-b from-[oklch(0.16_0.05_295/0.35)] to-[oklch(0.12_0.02_255/0.15)] px-4 py-5 text-center">
      <p
        className={cn(
          "text-xl font-bold leading-tight tracking-tight text-balance uppercase sm:text-2xl",
          abandoned
            ? "text-[oklch(0.75_0.04_255)]"
            : winnerName
              ? "text-[oklch(0.92_0.12_85)]"
              : "text-[oklch(0.82_0.04_255)]"
        )}
      >
        {headline}
      </p>

      {showScores ? (
        <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-x-3">
          <ResultTeamColumn
            team={teamA}
            name={teamAName}
            score={formatScore(runsA, wicketsA)}
          />
          <p className="self-center px-1 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[oklch(0.5_0.03_255)]">
            Final
          </p>
          <ResultTeamColumn
            team={teamB}
            name={teamBName}
            score={formatScore(runsB, wicketsB)}
          />
        </div>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-x-3">
            <ResultTeamColumn team={teamA} name={teamAName} />
            <span
              className="cricket-display self-center px-1 text-xs font-semibold text-[var(--cricket-gold)] sm:text-sm"
              aria-hidden
            >
              Vs
            </span>
            <ResultTeamColumn team={teamB} name={teamBName} />
          </div>
          <p className="mt-3 text-sm text-[oklch(0.58_0.03_255)]">
            {abandoned ? abandonedMessage : drawnMessage}
          </p>
        </>
      )}
    </div>
  );
}
