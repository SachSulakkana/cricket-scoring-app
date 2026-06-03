import type { Player, Team } from "./cricket-types";
import {
  BATTING_STYLE_OPTIONS,
  BOWLING_STYLE_OPTIONS,
  GENDER_OPTIONS,
  ROLE_OPTIONS,
} from "./player-options";

export interface CsvRowError {
  row: number;
  message: string;
}

export interface PlayerCsvImportResult {
  players: Player[];
  errors: CsvRowError[];
  skippedDuplicates: number;
}

export interface TeamCsvImportResult {
  teams: Team[];
  errors: CsvRowError[];
  skippedDuplicates: number;
}

const PLAYER_ROLES = new Set(ROLE_OPTIONS.map((o) => o.value));
const PLAYER_GENDERS = new Set(GENDER_OPTIONS.map((o) => o.value));
const BATTING_STYLES = new Set(BATTING_STYLE_OPTIONS.map((o) => o.value));
const BOWLING_STYLES = new Set(BOWLING_STYLE_OPTIONS.map((o) => o.value));

/** Parse CSV text into rows (handles quoted fields and commas). */
export function parseCsv(text: string): string[][] {
  const normalized = text.replace(/^\uFEFF/, "").trim();
  if (!normalized) return [];

  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < normalized.length; i += 1) {
    const char = normalized[i];
    const next = normalized[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field.trim());
      field = "";
    } else if (char === "\n" || (char === "\r" && next === "\n")) {
      row.push(field.trim());
      if (row.some((cell) => cell.length > 0)) rows.push(row);
      row = [];
      field = "";
      if (char === "\r") i += 1;
    } else if (char !== "\r") {
      field += char;
    }
  }

  row.push(field.trim());
  if (row.some((cell) => cell.length > 0)) rows.push(row);

  return rows;
}

function normalizeHeader(cell: string): string {
  return cell.trim().toLowerCase().replace(/\s+/g, "_");
}

function rowToRecord(headers: string[], cells: string[]): Record<string, string> {
  const record: Record<string, string> = {};
  headers.forEach((header, i) => {
    record[header] = (cells[i] ?? "").trim();
  });
  return record;
}

function requireColumn(
  record: Record<string, string>,
  key: string,
  rowNum: number,
  label: string
): string | null {
  const value = record[key]?.trim();
  if (!value) {
    return `Row ${rowNum}: ${label} is required.`;
  }
  return null;
}

export function parsePlayersCsv(
  text: string,
  existingNames: Set<string>
): PlayerCsvImportResult {
  const rows = parseCsv(text);
  const errors: CsvRowError[] = [];
  const players: Player[] = [];
  let skippedDuplicates = 0;

  if (rows.length === 0) {
    return { players, errors: [{ row: 0, message: "CSV file is empty." }], skippedDuplicates };
  }

  const headers = rows[0].map(normalizeHeader);
  const requiredHeaders = ["name", "role", "gender", "batting_style", "bowling_style"];
  for (const h of requiredHeaders) {
    if (!headers.includes(h)) {
      return {
        players: [],
        errors: [
          {
            row: 1,
            message: `Missing column "${h}". Required: ${requiredHeaders.join(", ")}. Optional: age`,
          },
        ],
        skippedDuplicates: 0,
      };
    }
  }

  const baseId = Date.now();

  for (let i = 1; i < rows.length; i += 1) {
    const rowNum = i + 1;
    const record = rowToRecord(headers, rows[i]);
    const rowErrors: string[] = [];

    const nameErr = requireColumn(record, "name", rowNum, "name");
    if (nameErr) rowErrors.push(nameErr);

    const name = record.name?.trim() ?? "";
    const nameKey = name.toLowerCase();

    if (name && (existingNames.has(nameKey) || players.some((p) => p.name.toLowerCase() === nameKey))) {
      skippedDuplicates += 1;
      continue;
    }

    const role = record.role?.trim() as Player["role"];
    if (!role || !PLAYER_ROLES.has(role)) {
      rowErrors.push(
        `Row ${rowNum}: Invalid role. Use: ${[...PLAYER_ROLES].join(", ")}`
      );
    }

    const gender = record.gender?.trim() as Player["gender"];
    if (!gender || !PLAYER_GENDERS.has(gender)) {
      rowErrors.push(
        `Row ${rowNum}: Invalid gender. Use: ${[...PLAYER_GENDERS].join(", ")}`
      );
    }

    const battingStyle = record.batting_style?.trim() as Player["battingStyle"];
    if (!battingStyle || !BATTING_STYLES.has(battingStyle)) {
      rowErrors.push(
        `Row ${rowNum}: Invalid batting_style. Use: ${[...BATTING_STYLES].join(", ")}`
      );
    }

    const bowlingStyle = record.bowling_style?.trim() as Player["bowlingStyle"];
    if (!bowlingStyle || !BOWLING_STYLES.has(bowlingStyle)) {
      rowErrors.push(
        `Row ${rowNum}: Invalid bowling_style. Use: ${[...BOWLING_STYLES].join(", ")}`
      );
    }

    let age: number | undefined;
    const ageRaw = record.age?.trim();
    if (ageRaw) {
      const parsed = parseInt(ageRaw, 10);
      if (Number.isNaN(parsed) || parsed < 1 || parsed > 100) {
        rowErrors.push(`Row ${rowNum}: age must be 1–100 or empty.`);
      } else {
        age = parsed;
      }
    }

    if (rowErrors.length > 0) {
      rowErrors.forEach((message) => errors.push({ row: rowNum, message }));
      continue;
    }

    players.push({
      id: `player-${baseId}-${i}`,
      name,
      role: role!,
      gender: gender!,
      age,
      battingStyle: battingStyle!,
      bowlingStyle: bowlingStyle!,
    });
  }

  return { players, errors, skippedDuplicates };
}

export function parseTeamsCsv(
  text: string,
  existingNames: Set<string>
): TeamCsvImportResult {
  const rows = parseCsv(text);
  const errors: CsvRowError[] = [];
  const teams: Team[] = [];
  let skippedDuplicates = 0;

  if (rows.length === 0) {
    return { teams, errors: [{ row: 0, message: "CSV file is empty." }], skippedDuplicates };
  }

  const headers = rows[0].map(normalizeHeader);
  if (!headers.includes("name")) {
    return {
      teams: [],
      errors: [
        {
          row: 1,
          message: 'Missing column "name". Required: name. Optional: owner_name',
        },
      ],
      skippedDuplicates: 0,
    };
  }

  const baseId = Date.now();

  for (let i = 1; i < rows.length; i += 1) {
    const rowNum = i + 1;
    const record = rowToRecord(headers, rows[i]);
    const nameErr = requireColumn(record, "name", rowNum, "name");
    if (nameErr) {
      errors.push({ row: rowNum, message: nameErr });
      continue;
    }

    const name = record.name.trim();
    const nameKey = name.toLowerCase();

    if (existingNames.has(nameKey) || teams.some((t) => t.name.toLowerCase() === nameKey)) {
      skippedDuplicates += 1;
      continue;
    }

    const ownerName = record.owner_name?.trim() || undefined;

    teams.push({
      id: `team-${baseId}-${i}`,
      name,
      ownerName,
      players: [],
    });
  }

  return { teams, errors, skippedDuplicates };
}

export const PLAYER_CSV_TEMPLATE = `name,role,gender,age,batting_style,bowling_style
Virat Kohli,batsman,male,35,right-hand,right-arm-medium
Jasprit Bumrah,bowler,male,30,right-hand,right-arm-fast`;

export const TEAM_CSV_TEMPLATE = `name,owner_name
Mumbai Strikers,Rahul
Delhi Capitals,`;
