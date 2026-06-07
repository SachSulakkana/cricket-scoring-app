import type { InningsData, MatchConfig, MatchState, Team } from "./cricket-types";
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
import { countsAsWicket } from "./cricket-types";

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

  if (i1.runs > i2.runs) {
    return [`${matchState.team1.name} won by ${i1.runs - i2.runs} runs`];
  }
  if (i2.runs > i1.runs) {
    const maxWkts = Math.max(matchState.team2.players.length - 1, 0);
    const wktsInHand = Math.max(maxWkts - i2.wickets, 0);
    return [`${matchState.team2.name} won by ${wktsInHand} wickets`];
  }
  return ["Match tied"];
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
  if (result.winnerTeamId) {
    lines.push(
      `Winner: ${result.winnerTeamId === teamA.id ? teamA.name : teamB.name}`
    );
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
  label: string
): number {
  y = ensureSpace(doc, y, 24);
  const totals = calculateInningsTotal(innings);
  const overs = calculateOvers(innings.balls, config.ballsPerOver);
  const extras = calculateExtras(innings);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(`${label} — ${totals.runs}/${totals.wickets} (${overs} ov)`, 14, y);
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
    inningsLabel: string
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
      input.config,
      inningsLabel
    );
  };

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
  });
}

function buildTournamentStats(fixtures: TournamentFixture[], teams: Team[]) {
  const teamMap = new Map(teams.map((t) => [t.id, t.name]));
  const batting: { player: string; team: string; runs: number }[] = [];
  const bowling: { player: string; team: string; wickets: number }[] = [];

  fixtures.forEach((fx) => {
    if (!fx.played || !fx.result || fx.result.abandoned) return;
    if (fx.result.bestBatting) {
      batting.push({
        player: fx.result.bestBatting.playerName,
        team: teamMap.get(fx.result.bestBatting.teamId) ?? "Team",
        runs: fx.result.bestBatting.runs,
      });
    }
    if (fx.result.bestBowling) {
      bowling.push({
        player: fx.result.bestBowling.playerName,
        team: teamMap.get(fx.result.bestBowling.teamId) ?? "Team",
        wickets: fx.result.bestBowling.wickets,
      });
    }
  });

  batting.sort((a, b) => b.runs - a.runs);
  bowling.sort((a, b) => b.wickets - a.wickets);
  return { batting: batting.slice(0, 10), bowling: bowling.slice(0, 10) };
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

  const stats = buildTournamentStats(tournament.fixtures, teams);
  if (stats.batting.length > 0) {
    y = ensureSpace(doc, y, 20);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Top batting (match highs)", 14, y);
    y += 4;
    autoTable(doc, {
      startY: y,
      head: [["Player", "Team", "Runs"]],
      body: stats.batting.map((r, i) => [`${i + 1}. ${r.player}`, r.team, r.runs]),
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [55, 48, 107], textColor: 255 },
      margin: { left: 14, right: 14 },
    });
    y = (doc.lastAutoTable?.finalY ?? y) + 10;
  }

  if (stats.bowling.length > 0) {
    y = ensureSpace(doc, y, 20);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Top bowling (match highs)", 14, y);
    y += 4;
    autoTable(doc, {
      startY: y,
      head: [["Player", "Team", "Wkts"]],
      body: stats.bowling.map((r, i) => [
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
