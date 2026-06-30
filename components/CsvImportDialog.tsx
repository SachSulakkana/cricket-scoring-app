"use client";

import { useRef, useState } from "react";
import { FileUp, Download } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CricketAddButton } from "@/components/cricket-shell";
import type { Player, Team } from "@/lib/cricket-types";
import {
  parsePlayersCsv,
  parseTeamsCsv,
  PLAYER_CSV_TEMPLATE,
  TEAM_CSV_TEMPLATE,
  type CsvRowError,
} from "@/lib/csv-import";
import { appToast } from "@/lib/app-toast";
import { importPlayersBulk, importTeamsBulk } from "@/lib/roster-storage";
import { Spinner } from "@/components/ui/spinner";

type CsvImportKind = "players" | "teams";

interface CsvImportDialogProps {
  kind: CsvImportKind;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingNames: string[];
  onImported: () => void;
}

function downloadTemplate(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function CsvImportDialog({
  kind,
  open,
  onOpenChange,
  existingNames,
  onImported,
}: CsvImportDialogProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [errors, setErrors] = useState<CsvRowError[]>([]);
  const [readyPlayers, setReadyPlayers] = useState<Player[]>([]);
  const [readyTeams, setReadyTeams] = useState<Team[]>([]);
  const [skippedDuplicates, setSkippedDuplicates] = useState(0);
  const [importing, setImporting] = useState(false);

  const resetPreview = () => {
    setFileName(null);
    setErrors([]);
    setReadyPlayers([]);
    setReadyTeams([]);
    setSkippedDuplicates(0);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) resetPreview();
    onOpenChange(next);
  };

  const existingSet = new Set(existingNames.map((n) => n.toLowerCase()));

  const handleFile = async (file: File) => {
    const text = await file.text();
    setFileName(file.name);

    if (kind === "players") {
      const result = parsePlayersCsv(text, existingSet);
      setReadyPlayers(result.players);
      setReadyTeams([]);
      setErrors(result.errors);
      setSkippedDuplicates(result.skippedDuplicates);
    } else {
      const result = parseTeamsCsv(text, existingSet);
      setReadyTeams(result.teams);
      setReadyPlayers([]);
      setErrors(result.errors);
      setSkippedDuplicates(result.skippedDuplicates);
    }
  };

  const readyCount = kind === "players" ? readyPlayers.length : readyTeams.length;

  const handleImport = async () => {
    if (readyCount === 0) return;
    setImporting(true);
    try {
      if (kind === "players") {
        await importPlayersBulk(readyPlayers);
      } else {
        await importTeamsBulk(readyTeams);
      }
      const dupNote =
        skippedDuplicates > 0
          ? ` ${skippedDuplicates} duplicate name(s) skipped.`
          : "";
      appToast.success(`Imported ${readyCount} ${kind}.${dupNote}`);
      onImported();
      handleOpenChange(false);
    } catch (err) {
      console.error(err);
      appToast.error(
        err instanceof Error ? err.message : "Import failed. Please try again."
      );
    } finally {
      setImporting(false);
    }
  };

  const title = kind === "players" ? "Import players from CSV" : "Import teams from CSV";
  const template = kind === "players" ? PLAYER_CSV_TEMPLATE : TEAM_CSV_TEMPLATE;
  const templateFile =
    kind === "players" ? "players-template.csv" : "teams-template.csv";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton
        className="csv-import-dialog border-[oklch(0.32_0.04_255)] bg-[oklch(0.12_0.025_255)] text-[var(--cricket-cream)] sm:max-w-lg max-h-[min(90vh,640px)] flex flex-col gap-0 p-0 overflow-hidden"
      >
        <DialogHeader className="p-6 pb-3 text-left">
          <DialogTitle className="cricket-display text-lg text-[var(--cricket-cream)]">
            {title}
          </DialogTitle>
          <DialogDescription className="text-[oklch(0.6_0.03_255)] text-sm">
            {kind === "players" ? (
              <>
                Required columns: name, gender.
                Optional: role, age, batting_style, bowling_style.
              </>
            ) : (
              <>Required: name. Optional: owner_name. Squads stay empty until you edit a team.</>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-4 space-y-3 flex-1 min-h-0 overflow-y-auto">
          <button
            type="button"
            className="csv-import-template-btn"
            onClick={() => downloadTemplate(templateFile, template)}
          >
            <Download className="h-4 w-4 shrink-0" />
            Download template CSV
          </button>

          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFile(file);
            }}
          />
          <button
            type="button"
            className="csv-import-file-btn"
            onClick={() => fileRef.current?.click()}
          >
            <FileUp className="h-5 w-5 shrink-0 text-[var(--cricket-gold)]" />
            <span className="min-w-0 truncate">
              {fileName ?? "Choose CSV file"}
            </span>
          </button>

          {fileName && (
            <div className="csv-import-summary" role="status">
              <p className="text-sm text-[var(--cricket-cream)]">
                <span className="tabular-nums font-semibold">{readyCount}</span>{" "}
                ready to import
                {skippedDuplicates > 0 && (
                  <span className="text-[oklch(0.65_0.03_255)]">
                    {" "}
                    · {skippedDuplicates} duplicate(s) skipped
                  </span>
                )}
              </p>
              {errors.length > 0 && (
                <ul className="mt-2 max-h-32 overflow-y-auto text-xs text-[oklch(0.72_0.1_75)] space-y-1">
                  {errors.slice(0, 20).map((err, i) => (
                    <li key={`${err.row}-${i}`}>{err.message}</li>
                  ))}
                  {errors.length > 20 && (
                    <li>…and {errors.length - 20} more errors</li>
                  )}
                </ul>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="p-4 border-t border-[oklch(0.28_0.04_255)] gap-2 sm:justify-end">
          <button
            type="button"
            className="cricket-btn-back rounded-md px-3 py-2 text-sm"
            onClick={() => handleOpenChange(false)}
            disabled={importing}
          >
            Cancel
          </button>
          <CricketAddButton
            type="button"
            variant={kind === "players" ? "player" : "team"}
            size="inline"
            disabled={readyCount === 0 || importing}
            className="inline-flex items-center gap-2"
            onClick={() => void handleImport()}
          >
            {importing ? (
              <>
                <Spinner className="h-4 w-4" />
                Importing…
              </>
            ) : readyCount > 0 ? (
              `Import ${readyCount}`
            ) : (
              "Import"
            )}
          </CricketAddButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
