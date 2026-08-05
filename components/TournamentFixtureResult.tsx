import type { Team } from "@/lib/cricket-types";
import { cn } from "@/lib/utils";

function formatScore(runs: number, wickets: number): string {
  return `${runs}/${wickets}`;
}

interface TournamentFixtureResultProps {
  teamA: Team;
  teamB: Team;
  teamBLabel?: string;
  abandoned?: boolean;
  abandonedMessage?: string;
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
      : "MATCH TIED";

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

      {abandoned ? (
        <p className="mt-2 text-sm text-[oklch(0.58_0.03_255)]">{abandonedMessage}</p>
      ) : (
        <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-x-3 gap-y-1">
          <div className="min-w-0 text-left">
            <p className="truncate text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-[oklch(0.58_0.03_255)]">
              {teamAName}
            </p>
            <p className="text-base font-bold tabular-nums text-[oklch(0.88_0.03_255)] sm:text-lg">
              {formatScore(runsA, wicketsA)}
            </p>
          </div>

          <p className="px-1 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[oklch(0.5_0.03_255)]">
            Final
          </p>

          <div className="min-w-0 text-right">
            <p className="truncate text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-[oklch(0.58_0.03_255)]">
              {teamBName}
            </p>
            <p className="text-base font-bold tabular-nums text-[oklch(0.88_0.03_255)] sm:text-lg">
              {formatScore(runsB, wicketsB)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
