"use client";

import { useEffect, useState } from "react";
import { Copy, Check, ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getSpectatorEmbedBattingUrl,
  getSpectatorEmbedBowlingUrl,
  getSpectatorEmbedNextMatchUrl,
  getSpectatorEmbedPointsUrl,
  getSpectatorEmbedPreviewUrl,
  getSpectatorEmbedUrl,
  getSpectatorLiveUrl,
  type SpectatorUrlContext,
} from "@/lib/app-routes";
import { appToast } from "@/lib/app-toast";
import type { LiveMatchMeta } from "@/lib/store/match-slice";

interface LiveMatchShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team1Name: string;
  team2Name: string;
  meta?: LiveMatchMeta | null;
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(textarea);
      return ok;
    } catch {
      return false;
    }
  }
}

function ShareUrlField({
  id,
  label,
  url,
  hint,
}: {
  id: string;
  label: string;
  url: string;
  hint?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!url) return;
    const ok = await copyText(url);
    if (ok) {
      setCopied(true);
      appToast.success("Link copied");
      window.setTimeout(() => setCopied(false), 2000);
    } else {
      appToast.error("Could not copy link");
    }
  };

  return (
    <div className="live-share-dialog__field">
      <label htmlFor={id} className="live-share-dialog__label">
        {label}
      </label>
      {hint ? <p className="live-share-dialog__field-hint">{hint}</p> : null}
      <div className="live-share-dialog__row">
        <input
          id={id}
          type="text"
          readOnly
          value={url}
          className="live-share-dialog__url"
          onFocus={(e) => e.currentTarget.select()}
        />
        <button
          type="button"
          className="live-share-dialog__copy-btn"
          onClick={() => void handleCopy()}
          aria-label={copied ? "Link copied" : "Copy link"}
          title={copied ? "Copied" : "Copy link"}
        >
          {copied ? (
            <Check size={18} strokeWidth={2.25} aria-hidden />
          ) : (
            <Copy size={18} strokeWidth={2.25} aria-hidden />
          )}
        </button>
      </div>
    </div>
  );
}

export default function LiveMatchShareDialog({
  open,
  onOpenChange,
  team1Name,
  team2Name,
  meta,
}: LiveMatchShareDialogProps) {
  const [watchUrl, setWatchUrl] = useState("");
  const [embedUrl, setEmbedUrl] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [battingUrl, setBattingUrl] = useState("");
  const [bowlingUrl, setBowlingUrl] = useState("");
  const [pointsUrl, setPointsUrl] = useState("");
  const [nextMatchUrl, setNextMatchUrl] = useState("");
  const isTournament = meta?.kind === "tournament";

  useEffect(() => {
    if (open) {
      const context: SpectatorUrlContext | undefined =
        meta?.kind === "tournament"
          ? {
              tournamentId: meta.tournamentId,
              fixtureId: meta.fixtureId,
            }
          : undefined;
      setWatchUrl(getSpectatorLiveUrl(undefined, context));
      setEmbedUrl(getSpectatorEmbedUrl(undefined, context));
      setPreviewUrl(getSpectatorEmbedPreviewUrl(undefined, context));
      setBattingUrl(getSpectatorEmbedBattingUrl(undefined, context));
      setBowlingUrl(getSpectatorEmbedBowlingUrl(undefined, context));
      setPointsUrl(getSpectatorEmbedPointsUrl(undefined, context));
      setNextMatchUrl(getSpectatorEmbedNextMatchUrl(undefined, context));
    }
  }, [open, meta]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="live-share-dialog border-[oklch(0.32_0.04_255)] bg-[oklch(0.12_0.025_255)] text-[var(--cricket-cream)] sm:max-w-lg max-h-[min(90vh,42rem)] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="cricket-display text-lg font-semibold text-[var(--cricket-cream)]">
            Share live match
          </DialogTitle>
          <DialogDescription className="text-[oklch(0.62_0.03_255)]">
            {team1Name} vs {team2Name}
          </DialogDescription>
        </DialogHeader>

        <ShareUrlField id="live-share-url" label="Watch link" url={watchUrl} />

        <div className="live-share-dialog__section">
          <p className="live-share-dialog__section-title">OBS overlays</p>
          <p className="live-share-dialog__section-text">
            Add each link as a separate Browser Source in OBS. Use a transparent
            background and the suggested size for each overlay.
          </p>

          <ShareUrlField
            id="live-embed-url"
            label="Score bar"
            url={embedUrl}
            hint="Suggested size: 1920 × 150"
          />

          <ShareUrlField
            id="live-embed-batting-url"
            label="Batting scorecard (current innings)"
            url={battingUrl}
            hint="Suggested size: 1920 × 1080 (full frame, centered)"
          />

          <ShareUrlField
            id="live-embed-bowling-url"
            label="Bowling scorecard (current innings)"
            url={bowlingUrl}
            hint="Suggested size: 1920 × 1080 (full frame, centered)"
          />

          <ShareUrlField
            id="live-embed-next-match-url"
            label="Live match faceoff"
            url={nextMatchUrl}
            hint="Suggested size: 1920 × 1080 (full frame, centered)"
          />

          {isTournament ? (
              <ShareUrlField
                id="live-embed-points-url"
                label="Points table"
                url={pointsUrl}
                hint="Suggested size: 1920 × 1080 (full frame, centered)"
              />
          ) : null}
        </div>

        <div className="live-share-dialog__preview">
          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="live-share-dialog__preview-btn"
          >
            <ExternalLink size={16} strokeWidth={2.25} aria-hidden />
            Preview score bar on black background
          </a>
        </div>

        <p className="live-share-dialog__hint">
          Score bar overlays pin to the bottom. Batting, bowling, points, and live
          match faceoff fill the frame, centered, with a dark transparent backdrop.
        </p>
      </DialogContent>
    </Dialog>
  );
}
