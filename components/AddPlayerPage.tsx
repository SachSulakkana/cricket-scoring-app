"use client";

import { useState } from "react";
import ImageDropUpload from "@/components/ImageDropUpload";
import { Spinner } from "@/components/ui/spinner";
import { usePendingAction } from "@/hooks/use-pending-action";
import { appToast } from "@/lib/app-toast";
import {
  CricketBroadcastCard,
  CricketEyebrow,
  CricketFormFieldError,
  CricketFormLabel,
  CricketPage,
} from "@/components/cricket-shell";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { savePlayer, updatePlayer } from "@/lib/roster-storage";
import {
  BattingStyle,
  BowlingStyle,
  Player,
  PlayerGender,
  PlayerRole,
} from "@/lib/cricket-types";
import {
  BATTING_STYLE_OPTIONS,
  BOWLING_STYLE_OPTIONS,
  GENDER_OPTIONS,
  ROLE_OPTIONS,
} from "@/lib/player-options";
import { UserPlus } from "lucide-react";

interface AddPlayerPageProps {
  onBack: () => void;
  onSaved: () => void;
  player?: Player;
}

const selectTriggerClass =
  "w-full cricket-form-input h-10 data-[placeholder]:text-[oklch(0.5_0.03_255)]";

function FieldBlock({
  label,
  children,
  error,
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <div className="min-w-0">
      <CricketFormLabel>{label}</CricketFormLabel>
      {children}
      {error ? <CricketFormFieldError>{error}</CricketFormFieldError> : null}
    </div>
  );
}

export default function AddPlayerPage({
  onBack,
  onSaved,
  player,
}: AddPlayerPageProps) {
  const isEdit = Boolean(player);
  const [name, setName] = useState(player?.name ?? "");
  const [gender, setGender] = useState<PlayerGender | "">(player?.gender ?? "");
  const [age, setAge] = useState(
    player?.age != null ? String(player.age) : ""
  );
  const [role, setRole] = useState<PlayerRole | "">(player?.role ?? "");
  const [battingStyle, setBattingStyle] = useState<BattingStyle | "">(
    player?.battingStyle ?? ""
  );
  const [bowlingStyle, setBowlingStyle] = useState<BowlingStyle | "">(
    player?.bowlingStyle ?? ""
  );
  const [imageUrl, setImageUrl] = useState<string | undefined>(player?.imageUrl);
  const [imagePreview, setImagePreview] = useState<string | undefined>(
    player?.imageUrl
  );
  const { pending, run } = usePendingAction();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleSave = () => {
    const errors: Record<string, string> = {};
    if (!name.trim()) errors.name = "Enter player name.";
    if (!gender) errors.gender = "Select gender.";
    if (!role) errors.role = "Select role.";
    if (!battingStyle) errors.battingStyle = "Select batting style.";
    if (!bowlingStyle) errors.bowlingStyle = "Select bowling style.";

    const parsedAge = age.trim() ? parseInt(age, 10) : undefined;
    if (age.trim() && (Number.isNaN(parsedAge) || parsedAge! < 1 || parsedAge! > 100)) {
      errors.age = "Enter a valid age (1–100).";
    }

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;
    if (!gender || !role || !battingStyle || !bowlingStyle) return;

    const saved: Player = {
      id: player?.id ?? `player-${Date.now()}`,
      name: name.trim(),
      gender,
      age: parsedAge,
      role,
      battingStyle,
      bowlingStyle,
      imageUrl,
    };

    void run(
      async () => {
        if (isEdit) {
          await updatePlayer(saved);
        } else {
          await savePlayer(saved);
        }
        onSaved();
      },
      {
        successMessage: isEdit ? "Player updated" : "Player saved",
        errorMessage: "Could not save player",
      }
    );
  };

  return (
    <CricketPage>
      <div className="max-w-md mx-auto">
      <button
        type="button"
        onClick={onBack}
        className="cricket-btn-back mb-5 rounded-md px-2 py-1.5 -ml-2"
      >
        ← Back
      </button>

      <CricketBroadcastCard accent className="p-5 space-y-5">
        <div className="flex items-center gap-2.5 pb-1">
          <UserPlus className="h-5 w-5 text-[var(--cricket-gold)]" />
          <div>
            <CricketEyebrow className="mb-0.5">Squad registry</CricketEyebrow>
            <h2 className="cricket-display text-xl font-semibold text-[var(--cricket-cream)]">
              {isEdit ? "Edit Player" : "Create Player"}
            </h2>
          </div>
        </div>

        <div>
          <CricketFormLabel>Name</CricketFormLabel>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Player name"
            className={`cricket-form-input${fieldErrors.name ? " cricket-form-input--error" : ""}`}
          />
          {fieldErrors.name ? (
            <CricketFormFieldError>{fieldErrors.name}</CricketFormFieldError>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FieldBlock label="Gender" error={fieldErrors.gender}>
            <Select value={gender} onValueChange={(v) => setGender(v as PlayerGender)}>
              <SelectTrigger
                className={`${selectTriggerClass}${fieldErrors.gender ? " cricket-form-input--error" : ""}`}
              >
                <SelectValue placeholder="Gender" />
              </SelectTrigger>
              <SelectContent className="cricket-select-content">
                {GENDER_OPTIONS.map((opt) => (
                  <SelectItem
                    key={opt.value}
                    value={opt.value}
                    className="focus:bg-[oklch(0.22_0.04_145)]"
                  >
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldBlock>

          <FieldBlock label="Age" error={fieldErrors.age}>
            <input
              type="number"
              min={1}
              max={100}
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="Age"
              className={`cricket-form-input${fieldErrors.age ? " cricket-form-input--error" : ""}`}
            />
          </FieldBlock>
        </div>

        <div>
          <CricketFormLabel>Role</CricketFormLabel>
          <Select value={role} onValueChange={(v) => setRole(v as PlayerRole)}>
            <SelectTrigger
              className={`${selectTriggerClass}${fieldErrors.role ? " cricket-form-input--error" : ""}`}
            >
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent className="cricket-select-content">
              {ROLE_OPTIONS.map((opt) => (
                <SelectItem
                  key={opt.value}
                  value={opt.value}
                  className="focus:bg-[oklch(0.22_0.04_145)]"
                >
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {fieldErrors.role ? (
            <CricketFormFieldError>{fieldErrors.role}</CricketFormFieldError>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FieldBlock label="Batting style" error={fieldErrors.battingStyle}>
            <Select
              value={battingStyle}
              onValueChange={(v) => setBattingStyle(v as BattingStyle)}
            >
              <SelectTrigger
                className={`${selectTriggerClass}${fieldErrors.battingStyle ? " cricket-form-input--error" : ""}`}
              >
                <SelectValue placeholder="Batting" />
              </SelectTrigger>
              <SelectContent className="cricket-select-content">
                {BATTING_STYLE_OPTIONS.map((opt) => (
                  <SelectItem
                    key={opt.value}
                    value={opt.value}
                    className="focus:bg-[oklch(0.22_0.04_145)]"
                  >
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldBlock>

          <FieldBlock label="Bowling style" error={fieldErrors.bowlingStyle}>
            <Select
              value={bowlingStyle}
              onValueChange={(v) => setBowlingStyle(v as BowlingStyle)}
            >
              <SelectTrigger
                className={`${selectTriggerClass}${fieldErrors.bowlingStyle ? " cricket-form-input--error" : ""}`}
              >
                <SelectValue placeholder="Bowling" />
              </SelectTrigger>
              <SelectContent className="cricket-select-content">
                {BOWLING_STYLE_OPTIONS.map((opt) => (
                  <SelectItem
                    key={opt.value}
                    value={opt.value}
                    className="focus:bg-[oklch(0.22_0.04_145)]"
                  >
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldBlock>
        </div>

        <div>
          <CricketFormLabel>Image</CricketFormLabel>
          <ImageDropUpload
            previewUrl={imagePreview}
            onImageChange={(dataUrl) => {
              setImageUrl(dataUrl);
              setImagePreview(dataUrl);
            }}
            emptyHint="Drag & drop photo here, or tap to browse"
            previewAlt="Player photo preview"
            inputLabel="Upload player image"
            imageClassName="h-full w-full object-cover object-top"
          />
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={pending}
          className="cricket-btn-play cricket-btn-play--quick w-full inline-flex items-center justify-center gap-2 disabled:opacity-70"
        >
          {pending ? (
            <>
              <Spinner className="h-4 w-4" />
              {isEdit ? "Updating…" : "Saving…"}
            </>
          ) : isEdit ? (
            "Update Player"
          ) : (
            "Save Player"
          )}
        </button>
      </CricketBroadcastCard>
      </div>
    </CricketPage>
  );
}
