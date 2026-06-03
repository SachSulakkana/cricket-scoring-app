"use client";

import { useMemo, useState } from "react";
import CricketLoadingButton from "@/components/CricketLoadingButton";
import TournamentFlowSteps from "@/components/TournamentFlowSteps";
import TournamentTeamPicker from "@/components/TournamentTeamPicker";
import { usePendingAction } from "@/hooks/use-pending-action";
import {
  CricketAddButton,
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
  buildStageConfigs,
  canUseGroupStage,
  formatStageSummary,
  getDefaultGroupCount,
  getMaxGroupCount,
  getSmallestGroupSize,
  MAX_TOURNAMENT_STAGES,
  MIN_TEAMS_PER_GROUP,
  normalizeGroupCount,
  TOURNAMENT_STAGE_STYLE_OPTIONS,
  TournamentStageConfig,
  TournamentStageStyle,
} from "@/lib/tournament-stage-options";
import {
  buildTeamSelectionSlots,
  SavedTournament,
  updateTournament,
} from "@/lib/roster-storage";
import { useTeams } from "@/lib/store/roster-hooks";
import { cn } from "@/lib/utils";
import { CricketBatIcon } from "@/components/icons/CricketBatIcon";
import { Trash2, Trophy } from "lucide-react";

interface CustomTournamentPlayPageProps {
  tournament: SavedTournament;
  onBack: () => void;
  onStartTournament: (tournament: SavedTournament) => void;
}

const selectTriggerClass =
  "w-full cricket-form-input h-10 data-[placeholder]:text-[oklch(0.5_0.03_255)]";

const STAGE_COUNT_OPTIONS = ["1", "2", "3", "4"] as const;

function initStageCount(tournament: SavedTournament): number {
  if (tournament.stageCount > 0) {
    return Math.min(MAX_TOURNAMENT_STAGES, tournament.stageCount);
  }
  return 1;
}

function SetupDivider() {
  return <hr className="tournament-setup-divider" aria-hidden />;
}

export default function CustomTournamentPlayPage({
  tournament,
  onBack,
  onStartTournament,
}: CustomTournamentPlayPageProps) {
  const [stageCount, setStageCount] = useState(() => initStageCount(tournament));
  const [stages, setStages] = useState<TournamentStageConfig[]>(() =>
    buildStageConfigs(
      initStageCount(tournament),
      tournament.stages,
      tournament.teamCount
    )
  );
  const [teamSlots, setTeamSlots] = useState<string[]>(() =>
    buildTeamSelectionSlots(tournament.teamCount, tournament.selectedTeamIds)
  );
  const savedTeams = useTeams();
  const [saved, setSaved] = useState(false);
  const [teamPickerAttention, setTeamPickerAttention] = useState(0);
  const [saveShake, setSaveShake] = useState(false);

  const stageCountKey = String(stageCount);
  const teamCount = tournament.teamCount;
  const maxGroups = getMaxGroupCount(teamCount);
  const groupStageAllowed = canUseGroupStage(teamCount);

  const handleStageCountChange = (value: string) => {
    const count = parseInt(value, 10);
    if (Number.isNaN(count) || count < 1 || count > MAX_TOURNAMENT_STAGES) return;
    setStageCount(count);
    setStages((prev) => buildStageConfigs(count, prev, teamCount));
    setSaved(false);
  };

  const handleStageStyleChange = (index: number, style: TournamentStageStyle) => {
    setStages((prev) =>
      prev.map((stage, i) => {
        if (i !== index) return stage;
        if (style === "group-stage" && groupStageAllowed) {
          return {
            style,
            groupCount: getDefaultGroupCount(teamCount),
          };
        }
        return { style };
      })
    );
    setSaved(false);
  };

  const handleRemoveStage = (index: number) => {
    if (stages.length <= 1) return;
    const next = stages.filter((_, i) => i !== index);
    setStages(next);
    setStageCount(next.length);
    setSaved(false);
  };

  const handleGroupCountChange = (index: number, value: string) => {
    const groupCount = parseInt(value, 10);
    if (Number.isNaN(groupCount)) return;
    setStages((prev) =>
      prev.map((stage, i) =>
        i === index && stage.style === "group-stage"
          ? {
              style: "group-stage",
              groupCount: normalizeGroupCount(teamCount, groupCount),
            }
          : stage
      )
    );
    setSaved(false);
  };

  const handleTeamSlotsChange = (slots: string[]) => {
    setTeamSlots(slots);
    setSaved(false);
  };

  const allTeamsSelected =
    teamSlots.length > 0 && teamSlots.every((id) => id.length > 0);
  const { pending: starting, run: runStart } = usePendingAction();

  const handlePlay = () => {
    if (!allTeamsSelected && savedTeams.length >= tournament.teamCount) {
      setTeamPickerAttention((n) => n + 1);
      setSaveShake(true);
      setTimeout(() => setSaveShake(false), 520);
      document
        .getElementById("tournament-team-picker")
        ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      return;
    }

    const updated: SavedTournament = {
      ...tournament,
      stageCount,
      stages: buildStageConfigs(stageCount, stages, teamCount),
      selectedTeamIds: buildTeamSelectionSlots(tournament.teamCount, teamSlots),
    };

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

  const stageRows = useMemo(
    () => stages.map((stage, index) => ({ stage, index })),
    [stages]
  );

  return (
    <CricketPage extraWide>
      <CricketPageHeader onBack={onBack} title={tournament.name} homeHref="/" />
      <TournamentFlowSteps current="Setup" className="mb-5" />

      <CricketBroadcastCard
        accent
        className="tournament-setup-unified w-full p-5 sm:p-8"
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
          <CricketEyebrow className="mb-1">Tournament structure</CricketEyebrow>
          <p className="text-[oklch(0.65_0.03_255)] text-sm leading-relaxed mb-4">
            Choose how many stages to run (up to {MAX_TOURNAMENT_STAGES}), pick a
            style for each, or remove a stage with the delete button.
          </p>

          <div className="max-w-xs">
            <CricketFormLabel htmlFor="stage-count">How many stages</CricketFormLabel>
            <Select value={stageCountKey} onValueChange={handleStageCountChange}>
              <SelectTrigger id="stage-count" className={selectTriggerClass}>
                <SelectValue placeholder="Stages" />
              </SelectTrigger>
              <SelectContent className="cricket-select-content">
                {STAGE_COUNT_OPTIONS.map((n) => (
                  <SelectItem
                    key={n}
                    value={n}
                    className="focus:bg-[oklch(0.22_0.08_75)]"
                  >
                    {n} stage{n === "1" ? "" : "s"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="tournament-setup-stages mt-4">
            {stageRows.map(({ stage, index }) => {
              const isGroupStage = stage.style === "group-stage";
              const stageGroupCount =
                stage.groupCount ?? getDefaultGroupCount(teamCount);
              const groupOptions = Array.from(
                { length: maxGroups },
                (_, i) => i + 1
              );

              return (
                <div
                  key={index}
                  className="tournament-stage-card rounded-md border border-[oklch(0.32_0.04_255)] bg-[oklch(0.12_0.025_255/0.6)] p-3 space-y-2"
                >
                  {stages.length > 1 && (
                    <button
                      type="button"
                      className="tournament-stage-card__remove"
                      onClick={() => handleRemoveStage(index)}
                      aria-label={`Remove stage ${index + 1}`}
                      title="Remove stage"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  )}
                  <p className="cricket-display text-sm font-semibold text-[var(--cricket-cream)] tournament-stage-card__title">
                    Stage {index + 1}
                  </p>
                  <div>
                    <CricketFormLabel htmlFor={`stage-style-${index}`}>
                      Style
                    </CricketFormLabel>
                    <Select
                      value={stage.style}
                      onValueChange={(v) =>
                        handleStageStyleChange(index, v as TournamentStageStyle)
                      }
                    >
                      <SelectTrigger
                        id={`stage-style-${index}`}
                        className={selectTriggerClass}
                      >
                        <SelectValue placeholder="Select style" />
                      </SelectTrigger>
                      <SelectContent className="cricket-select-content">
                        {TOURNAMENT_STAGE_STYLE_OPTIONS.map((opt) => (
                          <SelectItem
                            key={opt.value}
                            value={opt.value}
                            disabled={
                              opt.value === "group-stage" && !groupStageAllowed
                            }
                            className="focus:bg-[oklch(0.22_0.08_75)] data-[disabled]:opacity-50"
                          >
                            {opt.label}
                            {opt.value === "group-stage" && !groupStageAllowed
                              ? ` (need ${MIN_TEAMS_PER_GROUP}+ teams)`
                              : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {isGroupStage && (
                    <div className="space-y-2 pt-1 border-t border-[oklch(0.28_0.04_255/0.8)]">
                      {groupStageAllowed ? (
                        <>
                          <div>
                            <CricketFormLabel htmlFor={`stage-groups-${index}`}>
                              How many groups
                            </CricketFormLabel>
                            <Select
                              value={String(stageGroupCount)}
                              onValueChange={(v) =>
                                handleGroupCountChange(index, v)
                              }
                            >
                              <SelectTrigger
                                id={`stage-groups-${index}`}
                                className={selectTriggerClass}
                              >
                                <SelectValue placeholder="Groups" />
                              </SelectTrigger>
                              <SelectContent className="cricket-select-content">
                                {groupOptions.map((n) => (
                                  <SelectItem
                                    key={n}
                                    value={String(n)}
                                    className="focus:bg-[oklch(0.22_0.08_75)]"
                                  >
                                    {n} group{n === 1 ? "" : "s"} (
                                    {getSmallestGroupSize(teamCount, n)}–
                                    {Math.ceil(teamCount / n)} teams each)
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <p className="text-[oklch(0.55_0.03_255)] text-xs leading-relaxed">
                            At least {MIN_TEAMS_PER_GROUP} teams per group. With{" "}
                            {teamCount} teams you can use up to {maxGroups} group
                            {maxGroups === 1 ? "" : "s"}.
                          </p>
                        </>
                      ) : (
                        <p className="text-[oklch(0.72_0.1_75)] text-xs leading-relaxed">
                          Group stage needs at least {MIN_TEAMS_PER_GROUP} teams in
                          this tournament (you have {teamCount}).
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
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

        {stageCount > 0 && stages.length > 0 && (
          <>
            <SetupDivider />
            <section className="tournament-setup-section">
              <CricketEyebrow className="mb-2">Format summary</CricketEyebrow>
              <ul className="tournament-setup-format-chips">
                {stages.map((stage, index) => (
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
            </section>
          </>
        )}

        <SetupDivider />

        <footer
          className={cn(
            "tournament-setup-footer",
            saveShake && "tournament-save-bar--shake"
          )}
        >
          <div className="tournament-setup-footer__status">
            {saved && (
              <span className="text-[oklch(0.65_0.12_145)] text-sm font-medium flex items-center gap-1.5">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[oklch(0.35_0.1_145)] text-[oklch(0.85_0.12_145)]">
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
