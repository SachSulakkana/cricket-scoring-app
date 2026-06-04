"use client";

import { useMemo, useState } from "react";
import CricketLoadingButton from "@/components/CricketLoadingButton";
import TournamentFlowSteps from "@/components/TournamentFlowSteps";
import TournamentTeamPicker from "@/components/TournamentTeamPicker";
import { usePendingAction } from "@/hooks/use-pending-action";
import { appToast } from "@/lib/app-toast";
import {
  CricketBroadcastCard,
  CricketDetailRow,
  CricketEyebrow,
  CricketFormLabel,
  CricketPage,
  CricketPageHeader,
} from "@/components/cricket-shell";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  buildTeamSelectionSlots,
  SavedTournament,
  updateTournament,
} from "@/lib/roster-storage";
import { useTeams } from "@/lib/store/roster-hooks";
import { formatStageSummary } from "@/lib/tournament-stage-options";
import {
  applyPresetToTournament,
  DEFAULT_FORMAT_PRESET_ID,
  presetsByRoundCount,
  TOURNAMENT_FORMAT_PRESETS,
  validatePresetForTeams,
} from "@/lib/tournament-format-presets";
import { initializeTournamentPlay } from "@/lib/tournament-stage-engine";
import { cn } from "@/lib/utils";
import { CricketBatIcon } from "@/components/icons/CricketBatIcon";
import { Trophy } from "lucide-react";

interface CustomTournamentPlayPageProps {
  tournament: SavedTournament;
  onBack: () => void;
  onStartTournament: (tournament: SavedTournament) => void;
}

const selectTriggerClass =
  "w-full cricket-form-input h-10 data-[placeholder]:text-[oklch(0.5_0.03_255)]";

function SetupDivider() {
  return <hr className="tournament-setup-divider" aria-hidden />;
}

export default function CustomTournamentPlayPage({
  tournament,
  onBack,
  onStartTournament,
}: CustomTournamentPlayPageProps) {
  const [presetId, setPresetId] = useState(
    () => tournament.formatPresetId ?? DEFAULT_FORMAT_PRESET_ID
  );
  const [teamSlots, setTeamSlots] = useState<string[]>(() =>
    buildTeamSelectionSlots(tournament.teamCount, tournament.selectedTeamIds)
  );
  const savedTeams = useTeams();
  const [saved, setSaved] = useState(false);
  const [teamPickerAttention, setTeamPickerAttention] = useState(0);
  const [saveShake, setSaveShake] = useState(false);

  const teamCount = tournament.teamCount;
  const preset = useMemo(
    () => TOURNAMENT_FORMAT_PRESETS.find((p) => p.id === presetId),
    [presetId]
  );
  const presetError = useMemo(
    () => validatePresetForTeams(presetId, teamCount),
    [presetId, teamCount]
  );
  const presetsByRounds = useMemo(() => presetsByRoundCount(), []);

  const handleTeamSlotsChange = (slots: string[]) => {
    setTeamSlots(slots);
    setSaved(false);
  };

  const allTeamsSelected =
    teamSlots.length > 0 && teamSlots.every((id) => id.length > 0);
  const { pending: starting, run: runStart } = usePendingAction();

  const handlePlay = () => {
    if (presetError) {
      appToast.validation(presetError);
      return;
    }
    if (!allTeamsSelected && savedTeams.length >= tournament.teamCount) {
      setTeamPickerAttention((n) => n + 1);
      setSaveShake(true);
      setTimeout(() => setSaveShake(false), 520);
      document
        .getElementById("tournament-team-picker")
        ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      return;
    }

    const applied = applyPresetToTournament(presetId, teamCount);
    let updated: SavedTournament = {
      ...tournament,
      formatPresetId: presetId,
      stageCount: applied.stageCount,
      stages: applied.stages,
      selectedTeamIds: buildTeamSelectionSlots(tournament.teamCount, teamSlots),
      fixtures: [],
      currentStageIndex: 0,
      championTeamId: undefined,
      stageComplete: undefined,
      groupAssignments: undefined,
    };

    updated = initializeTournamentPlay(updated);

    void runStart(
      async () => {
        await updateTournament(updated);
        setSaved(true);
        onStartTournament(updated);
      },
      {
        successMessage: "Tournament ready — good luck!",
        errorMessage: "Could not save tournament setup",
      }
    );
  };

  return (
    <CricketPage extraWide>
      <CricketPageHeader onBack={onBack} title={tournament.name} homeHref="/" />
      <TournamentFlowSteps current="Setup" className="mb-5" />

      <CricketBroadcastCard
        accent
        className="tournament-setup-unified w-full p-4 sm:p-8 min-w-0"
      >
        <section className="tournament-setup-section">
          <div className="flex items-start gap-2.5">
            <Trophy className="h-5 w-5 shrink-0 text-[var(--cricket-gold)] mt-0.5" />
            <div className="min-w-0 flex-1">
              <CricketEyebrow className="mb-0.5">Custom tournament</CricketEyebrow>
              <h2 className="cricket-display text-lg font-semibold text-[var(--cricket-cream)]">
                {tournament.name}
              </h2>
            </div>
          </div>
          <div className="tournament-setup-stats mt-4">
            <CricketDetailRow label="Overs" value={String(tournament.totalOvers)} />
            <CricketDetailRow
              label="Balls / over"
              value={String(tournament.ballsPerOver)}
            />
            <CricketDetailRow label="Teams" value={String(tournament.teamCount)} />
          </div>
        </section>

        <SetupDivider />

        <section className="tournament-setup-section">
          <CricketEyebrow className="mb-1">Tournament format</CricketEyebrow>
          <p className="text-[oklch(0.65_0.03_255)] text-sm leading-relaxed mb-4">
            Choose a competition structure. Stages run in order; standings and NRR
            decide who advances to playoffs or knockout rounds.
          </p>

          <div>
            <CricketFormLabel htmlFor="format-preset">Format preset</CricketFormLabel>
            <Select
              value={presetId}
              onValueChange={(v) => {
                setPresetId(v);
                setSaved(false);
              }}
            >
              <SelectTrigger id="format-preset" className={selectTriggerClass}>
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent className="cricket-select-content max-h-[min(20rem,70vh)]">
                {[1, 2, 3, 4].map((rounds) => {
                  const list = presetsByRounds.get(rounds) ?? [];
                  if (list.length === 0) return null;
                  return (
                    <div key={rounds}>
                      <p className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[oklch(0.5_0.04_288)]">
                        {rounds} round{rounds === 1 ? "" : "s"}
                      </p>
                      {list.map((p) => (
                        <SelectItem
                          key={p.id}
                          value={p.id}
                          className="focus:bg-[oklch(0.22_0.08_75)]"
                        >
                          {p.label}
                        </SelectItem>
                      ))}
                    </div>
                  );
                })}
              </SelectContent>
            </Select>
            {presetError ? (
              <p className="mt-2 text-xs text-[oklch(0.72_0.12_25)]">{presetError}</p>
            ) : null}
          </div>

          {preset && (
            <ul className="tournament-setup-format-chips mt-4">
              {preset.stages.map((stage, index) => (
                <li key={index} className="tournament-setup-format-chip">
                  <span className="tournament-setup-format-chip__stage">
                    Stage {index + 1}
                  </span>
                  <span className="tournament-setup-format-chip__style">
                    {formatStageSummary(stage, teamCount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <SetupDivider />

        <section className="tournament-setup-section">
          <TournamentTeamPicker
            embedded
            id="tournament-team-picker"
            teamCount={tournament.teamCount}
            teamSlots={teamSlots}
            savedTeams={savedTeams}
            onTeamSlotsChange={handleTeamSlotsChange}
            attentionSignal={teamPickerAttention}
          />
        </section>

        <SetupDivider />

        <footer
          className={cn(
            "tournament-setup-footer",
            saveShake && "tournament-save-bar--shake"
          )}
        >
          <div className="tournament-setup-footer__status">
            {saved && (
              <span className="text-[oklch(0.65_0.12_295)] text-sm font-medium flex items-center gap-1.5">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[oklch(0.35_0.1_295)] text-[oklch(0.85_0.12_295)]">
                  ✓
                </span>
                Ready to play
              </span>
            )}
            {!allTeamsSelected && savedTeams.length >= tournament.teamCount && (
              <span className="text-[oklch(0.72_0.1_75)] text-sm">
                Pick all {tournament.teamCount} teams to play
              </span>
            )}
          </div>
          <CricketLoadingButton
            type="button"
            variant="tournament"
            size="inline"
            loading={starting}
            loadingLabel="Starting…"
            onClick={handlePlay}
            disabled={Boolean(presetError)}
            className="tournament-setup-footer__play"
          >
            <CricketBatIcon className="h-4 w-4" />
            Start Tournament
          </CricketLoadingButton>
        </footer>
      </CricketBroadcastCard>
    </CricketPage>
  );
}
