import type { InningsData, MatchConfig, MatchState, SuperOverState, Team } from "./cricket-types";
import type {
  SavedTournament,
  TournamentFixture,
  TournamentFixtureResult,
} from "./roster-types";
import {
  calculateBatting,
  calculateBowling,
  calculateExtras,
  calculateInningsTotal,
  calculateOvers,
  resolveBattingBowlingTeams,
} from "./scorecard-stats";
import { computeStandings } from "./tournament-stage-engine/standings";
import { formatTournamentNrr } from "./tournament-nrr";
import { buildTournamentPlayerStats } from "./tournament-stats";
import { countsAsWicket } from "./cricket-types";
import { getMatchResult } from "./match-result";
import { hasPersistedSuperOver } from "./match-snapshot";
import {
  getSuperOverTeamTotals,
  isRegularInningsTied,
} from "./super-over";

type JsPdfDoc = import("jspdf").jsPDF & {
  lastAutoTable?: { finalY: number };
};

export interface MatchPdfInput {
  title: string;
  subtitle?: string;
  teamA: Team;
  teamB: Team;
  config: MatchConfig;
  innings1: InningsData | null;
  innings2: InningsData | null;
  resultLines?: string[];
  superOver?: SuperOverState | null;
  mainMatchTied?: boolean;
}

async function loadPdf() {
  const [{ jsPDF }, { autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);
  return { jsPDF, autoTable };
}

function sanitizeFilename(name: string) {
  return name.replace(/[^a-z0-9-_]+/gi, "-").replace(/-+/g, "-").slice(0, 80);
}

function formatDate() {
  return new Date().toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function truncate(text: string, max: number) {
  return text.length <= max ? text : `${text.slice(0, max - 1)}…`;
}

function getRunsWickets(innings: InningsData | null) {
  if (!innings) return { runs: 0, wickets: 0 };
  const runs = innings.balls.reduce(
    (t, b) => t + b.runs + (b.extra !== "none" ? b.extraRuns : 0),
    0
  );
  const wickets = innings.balls.filter((b) => countsAsWicket(b.dismissal)).length;
  return { runs, wickets };
}

export function buildQuickMatchResultLines(matchState: MatchState): string[] {
  const i1 = getRunsWickets(matchState.innings1);
  const i2 = getRunsWickets(matchState.innings2);
  const lines = [
    `${matchState.team1.name}: ${i1.runs}/${i1.wickets}`,
    `${matchState.team2.name}: ${i2.runs}/${i2.wickets}`,
  ];

  if (isRegularInningsTied(matchState)) {
    lines.push("Main match: tied");
  }

  if (hasPersistedSuperOver(matchState.superOver)) {
    const so1 = getSuperOverTeamTotals(matchState, matchState.team1.id);
    const so2 = getSuperOverTeamTotals(matchState, matchState.team2.id);
    lines.push(
      `Super over — ${matchState.team1.name}: ${so1.runs}/${so1.wickets}, ${matchState.team2.name}: ${so2.runs}/${so2.wickets}`
    );
  }

  lines.push(getMatchResult(matchState).text);
  return lines;
}

export function buildTournamentMatchResultLines(
  teamA: Team,
  teamB: Team,
  result: TournamentFixtureResult
): string[] {
  if (result.abandoned) {
    return ["Match abandoned (rain) — no points awarded"];
  }
  const lines = [
    `${teamA.name}: ${result.runsA}/${result.wicketsA}`,
    `${teamB.name}: ${result.runsB}/${result.wicketsB}`,
  ];
  if (result.scorecard?.mainMatchTied) {
    lines.push("Main match: tied");
  }
  const superOver = result.scorecard?.superOver;
  if (superOver?.innings1 && result.scorecard) {
    const { team1, team2 } = result.scorecard;
    const soTeam1Innings =
      superOver.innings1.teamId === team1.id
        ? superOver.innings1
        : superOver.innings2?.teamId === team1.id
          ? superOver.innings2
          : null;
    const soTeam2Innings =
      superOver.innings1.teamId === team2.id
        ? superOver.innings1
        : superOver.innings2?.teamId === team2.id
          ? superOver.innings2
          : null;
    if (soTeam1Innings && soTeam2Innings) {
      const t1 = getRunsWickets(soTeam1Innings);
      const t2 = getRunsWickets(soTeam2Innings);
      lines.push(
        `Super over — ${teamA.name}: ${t1.runs}/${t1.wickets}, ${teamB.name}: ${t2.runs}/${t2.wickets}`
      );
    }
  }
  if (result.winnerTeamId) {
    const viaSuperOver =
      result.scorecard?.mainMatchTied && superOver?.completed;
    lines.push(
      viaSuperOver
        ? `Winner (super over): ${result.winnerTeamId === teamA.id ? teamA.name : teamB.name}`
        : `Winner: ${result.winnerTeamId === teamA.id ? teamA.name : teamB.name}`
    );
  } else if (superOver?.settledAsDraw) {
    lines.push("Super over tied — match drawn");
  } else {
    lines.push("Result: Match tied");
  }
  if (result.bestBatting) {
    lines.push(
      `Top batter: ${result.bestBatting.playerName} (${result.bestBatting.runs})`
    );
  }
  if (result.bestBowling) {
    lines.push(
      `Top bowler: ${result.bestBowling.playerName} (${result.bestBowling.wickets} wkts)`
    );
  }
  return lines;
}

function ensureSpace(doc: JsPdfDoc, y: number, needed: number) {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (y + needed > pageHeight - 14) {
    doc.addPage();
    return 18;
  }
  return y;
}

function appendInningsSection(
  doc: JsPdfDoc,
  autoTable: typeof import("jspdf-autotable").autoTable,
  y: number,
  innings: InningsData,
  battingTeam: Team,
  bowlingTeam: Team,
  config: MatchConfig,
  label: string,
  options?: { useBallCount?: boolean }
): number {
  y = ensureSpace(doc, y, 24);
  const totals = calculateInningsTotal(innings);
  const legalBalls = innings.balls.filter(
    (ball) => ball.extra !== "wide" && ball.extra !== "no-ball"
  ).length;
  const overs = options?.useBallCount
    ? `${legalBalls}/${config.ballsPerOver} balls`
    : calculateOvers(innings.balls, config.ballsPerOver);
  const extras = calculateExtras(innings);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(`${label} — ${totals.runs}/${totals.wickets} (${overs})`, 14, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(
    `Extras: ${extras.total} (b ${extras.bye}, lb ${extras.legBye}, w ${extras.wide}, nb ${extras.noBall})`,
    14,
    y
  );
  y += 5;

  const battingRows = calculateBatting(innings, battingTeam);
  autoTable(doc, {
    startY: y,
    head: [["Batter", "R", "B", "4s", "6s", "SR", "Dismissal"]],
    body: battingRows.map((row) => [
      row.name,
      row.runs,
      row.balls,
      row.fours,
      row.sixes,
      row.strikeRate,
      truncate(row.dismissal, 42),
    ]),
    styles: { fontSize: 8, cellPadding: 1.5 },
    headStyles: { fillColor: [55, 48, 107], textColor: 255 },
    margin: { left: 14, right: 14 },
  });
  y = (doc.lastAutoTable?.finalY ?? y) + 6;

  const bowlingRows = calculateBowling(innings, bowlingTeam, config.ballsPerOver);
  y = ensureSpace(doc, y, 20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("Bowling", 14, y);
  y += 3;

  autoTable(doc, {
    startY: y,
    head: [["Bowler", "O", "M", "R", "W", "NB", "WD", "Eco"]],
    body: bowlingRows.map((row) => [
      row.name,
      `${Math.floor(row.balls / config.ballsPerOver)}.${row.balls % config.ballsPerOver}`,
      row.maidens,
      row.runs,
      row.wickets,
      row.noBalls,
      row.wides,
      row.economy,
    ]),
    styles: { fontSize: 8, cellPadding: 1.5 },
    headStyles: { fillColor: [55, 48, 107], textColor: 255 },
    margin: { left: 14, right: 14 },
  });

  return (doc.lastAutoTable?.finalY ?? y) + 10;
}

export async function exportMatchPdf(input: MatchPdfInput) {
  const { jsPDF, autoTable } = await loadPdf();
  const doc = new jsPDF({ unit: "mm", format: "a4" }) as JsPdfDoc;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(input.title, 14, 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  let y = 26;
  if (input.subtitle) {
    doc.text(input.subtitle, 14, y);
    y += 6;
  }
  doc.text(`${input.teamA.name} vs ${input.teamB.name}`, 14, y);
  y += 5;
  doc.text(
    `${input.config.totalOvers} overs · ${input.config.ballsPerOver} balls per over`,
    14,
    y
  );
  y += 5;
  doc.text(`Generated ${formatDate()}`, 14, y);
  y += 8;

  if (input.resultLines?.length) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Result", 14, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    input.resultLines.forEach((line) => {
      doc.text(line, 14, y);
      y += 5;
    });
    y += 4;
  }

  const renderInnings = (
    innings: InningsData | null,
    team1: Team,
    team2: Team,
    inningsLabel: string,
    config: MatchConfig = input.config,
    options?: { useBallCount?: boolean }
  ) => {
    if (!innings || innings.balls.length === 0) return;
    const { battingTeam, bowlingTeam } = resolveBattingBowlingTeams(
      innings,
      team1,
      team2
    );
    y = appendInningsSection(
      doc,
      autoTable,
      y,
      innings,
      battingTeam,
      bowlingTeam,
      config,
      inningsLabel,
      options
    );
  };

  y = ensureSpace(doc, y, 10);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Original match", 14, y);
  y += 5;
  if (input.mainMatchTied) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("Scores tied on runs", 14, y);
    y += 6;
  } else {
    y += 2;
  }

  renderInnings(
    input.innings1,
    input.teamA,
    input.teamB,
    `${input.teamA.name} 1st innings`
  );
  renderInnings(
    input.innings2,
    input.teamA,
    input.teamB,
    `${input.teamB.name} 2nd innings`
  );

  const superOver = input.superOver;
  if (hasPersistedSuperOver(superOver ?? null)) {
    y = ensureSpace(doc, y, 12);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Super over", 14, y);
    y += 8;
    const soConfig = { totalOvers: 1, ballsPerOver: superOver!.ballsPerOver };
    const firstInnings = superOver!.innings1;
    const secondInnings = superOver!.innings2;
    if (firstInnings) {
      renderInnings(
        firstInnings,
        input.teamA,
        input.teamB,
        `Super over — ${firstInnings.teamName}`,
        soConfig,
        { useBallCount: true }
      );
    }
    if (secondInnings) {
      renderInnings(
        secondInnings,
        input.teamA,
        input.teamB,
        `Super over — ${secondInnings.teamName}`,
        soConfig,
        { useBallCount: true }
      );
    }
  }

  const filename = sanitizeFilename(
    `${input.teamA.name}-vs-${input.teamB.name}-scorecard`
  );
  doc.save(`${filename}.pdf`);
}

export async function exportQuickMatchPdf(matchState: MatchState) {
  if (!matchState.config) {
    throw new Error("Match config is missing");
  }
  await exportMatchPdf({
    title: "Quick Match Scorecard",
    teamA: matchState.team1,
    teamB: matchState.team2,
    config: matchState.config,
    innings1: matchState.innings1,
    innings2: matchState.innings2,
    resultLines: buildQuickMatchResultLines(matchState),
    mainMatchTied: isRegularInningsTied(matchState),
    superOver: matchState.superOver,
  });
}

export async function exportTournamentMatchPdf(options: {
  tournamentName: string;
  teamA: Team;
  teamB: Team;
  result: TournamentFixtureResult;
  config: MatchConfig;
}) {
  const snapshot = options.result.scorecard;
  await exportMatchPdf({
    title: options.tournamentName,
    subtitle: "Tournament match scorecard",
    teamA: options.teamA,
    teamB: options.teamB,
    config: options.config,
    innings1: snapshot?.innings1 ?? null,
    innings2: snapshot?.innings2 ?? null,
    resultLines: buildTournamentMatchResultLines(
      options.teamA,
      options.teamB,
      options.result
    ),
    mainMatchTied: snapshot?.mainMatchTied,
    superOver: snapshot?.superOver,
  });
}

function formatFixtureOutcome(
  fx: TournamentFixture,
  teamAName: string,
  teamBName: string
) {
  if (!fx.result) return "Not played";
  if (fx.result.abandoned) return "Abandoned (rain)";
  const scoreA = `${fx.result.runsA}/${fx.result.wicketsA}`;
  const scoreB = `${fx.result.runsB}/${fx.result.wicketsB}`;
  if (fx.result.winnerTeamId === fx.teamAId) {
    return `${teamAName} ${scoreA} beat ${teamBName} ${scoreB}`;
  }
  if (fx.result.winnerTeamId === fx.teamBId) {
    return `${teamBName} ${scoreB} beat ${teamAName} ${scoreA}`;
  }
  return `${teamAName} ${scoreA} tied ${teamBName} ${scoreB}`;
}

export async function exportTournamentFullResultsPdf(options: {
  tournament: SavedTournament;
  teams: Team[];
}) {
  const { jsPDF, autoTable } = await loadPdf();
  const doc = new jsPDF({ unit: "mm", format: "a4" }) as JsPdfDoc;
  const { tournament, teams } = options;
  const teamMap = new Map(teams.map((t) => [t.id, t.name]));
  const config = {
    totalOvers: tournament.totalOvers,
    ballsPerOver: tournament.ballsPerOver,
  };
  const teamIds = tournament.selectedTeamIds.filter(Boolean);
  const championName = tournament.championTeamId
    ? teamMap.get(tournament.championTeamId)
    : undefined;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(tournament.name, 14, 18);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  let y = 26;
  doc.text("Tournament — full results", 14, y);
  y += 5;
  doc.text(
    `${tournament.totalOvers} overs per match · ${teams.length} teams`,
    14,
    y
  );
  y += 5;
  if (championName) {
    doc.setFont("helvetica", "bold");
    doc.text(`Champion: ${championName}`, 14, y);
    doc.setFont("helvetica", "normal");
    y += 5;
  }
  doc.text(`Generated ${formatDate()}`, 14, y);
  y += 10;

  const standings = computeStandings(teamIds, tournament.fixtures, config);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Points table", 14, y);
  y += 4;

  autoTable(doc, {
    startY: y,
    head: [["Team", "P", "W", "L", "T", "Pts", "NRR"]],
    body: standings
      .filter((row) => row.played > 0)
      .map((row) => [
        teamMap.get(row.teamId) ?? row.teamId,
        row.played,
        row.won,
        row.lost,
        row.tied,
        row.points,
        formatTournamentNrr(row.nrr),
      ]),
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [55, 48, 107], textColor: 255 },
    margin: { left: 14, right: 14 },
  });
  y = (doc.lastAutoTable?.finalY ?? y) + 10;

  const playedFixtures = tournament.fixtures.filter((fx) => fx.played);
  y = ensureSpace(doc, y, 20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Match results", 14, y);
  y += 4;

  autoTable(doc, {
    startY: y,
    head: [["Stage", "Match", "Result"]],
    body: playedFixtures.map((fx, idx) => [
      `Stage ${fx.stageIndex + 1}`,
      `${teamMap.get(fx.teamAId) ?? "?"} vs ${teamMap.get(fx.teamBId) ?? "?"}`,
      formatFixtureOutcome(
        fx,
        teamMap.get(fx.teamAId) ?? "Team A",
        teamMap.get(fx.teamBId) ?? "Team B"
      ),
    ]),
    styles: { fontSize: 8, cellPadding: 2, overflow: "linebreak" },
    headStyles: { fillColor: [55, 48, 107], textColor: 255 },
    columnStyles: { 2: { cellWidth: 80 } },
    margin: { left: 14, right: 14 },
  });
  y = (doc.lastAutoTable?.finalY ?? y) + 10;

  const stats = buildTournamentPlayerStats(tournament.fixtures, teams);
  if (stats.battingTop.length > 0 || stats.bowlingTop.length > 0) {
    y = ensureSpace(doc, y, 20);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Stats", 14, y);
    y += 4;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("All stages · top 10", 14, y);
    y += 6;
  }

  if (stats.battingTop.length > 0) {
    y = ensureSpace(doc, y, 20);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Most Runs (tournament)", 14, y);
    y += 4;
    autoTable(doc, {
      startY: y,
      head: [["Player", "Team", "Runs"]],
      body: stats.battingTop.map((r, i) => [
        `${i + 1}. ${r.player}`,
        r.team,
        r.runs,
      ]),
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [55, 48, 107], textColor: 255 },
      margin: { left: 14, right: 14 },
    });
    y = (doc.lastAutoTable?.finalY ?? y) + 10;
  }

  if (stats.bowlingTop.length > 0) {
    y = ensureSpace(doc, y, 20);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Most wickets (tournament)", 14, y);
    y += 4;
    autoTable(doc, {
      startY: y,
      head: [["Player", "Team", "Wkts"]],
      body: stats.bowlingTop.map((r, i) => [
        `${i + 1}. ${r.player}`,
        r.team,
        r.wickets,
      ]),
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [55, 48, 107], textColor: 255 },
      margin: { left: 14, right: 14 },
    });
  }

  doc.save(`${sanitizeFilename(tournament.name)}-full-results.pdf`);
}
