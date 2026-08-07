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
  getSpectatorEmbedBatting1stUrl,
  getSpectatorEmbedBattingStatsUrl,
  getSpectatorEmbedBowlingUrl,
  getSpectatorEmbedBowling1stUrl,
  getSpectatorEmbedBowlingStatsUrl,
  getLocalEmbedScoreUrl,
  getSpectatorEmbedNextMatchUrl,
  getSpectatorEmbedPointsUrl,
  getSpectatorEmbedPreviewUrl,
  getSpectatorEmbedUpcomingUrl,
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
          className="live-share-dialog__copy-btn btn-12-exempt"
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
  const [batting1stUrl, setBatting1stUrl] = useState("");
  const [bowling1stUrl, setBowling1stUrl] = useState("");
  const [pointsUrl, setPointsUrl] = useState("");
  const [nextMatchUrl, setNextMatchUrl] = useState("");
  const [upcomingUrl, setUpcomingUrl] = useState("");
  const [battingStatsUrl, setBattingStatsUrl] = useState("");
  const [bowlingStatsUrl, setBowlingStatsUrl] = useState("");
  const [scoreUrl, setScoreUrl] = useState("");
  const [shareKeyError, setShareKeyError] = useState<string | null>(null);
  const isTournament = meta?.kind === "tournament";

  useEffect(() => {
    if (!open) return;
    setScoreUrl(getLocalEmbedScoreUrl());
  }, [open]);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    const buildUrls = (shareKey: string) => {
      const context: SpectatorUrlContext =
        meta?.kind === "tournament"
          ? {
              tournamentId: meta.tournamentId,
              fixtureId: meta.fixtureId,
              shareKey,
            }
          : { shareKey };
      setWatchUrl(getSpectatorLiveUrl(undefined, context));
      setEmbedUrl(getSpectatorEmbedUrl(undefined, context));
      setPreviewUrl(getSpectatorEmbedPreviewUrl(undefined, context));
      setBattingUrl(getSpectatorEmbedBattingUrl(undefined, context));
      setBowlingUrl(getSpectatorEmbedBowlingUrl(undefined, context));
      setBatting1stUrl(getSpectatorEmbedBatting1stUrl(undefined, context));
      setBowling1stUrl(getSpectatorEmbedBowling1stUrl(undefined, context));
      setPointsUrl(getSpectatorEmbedPointsUrl(undefined, context));
      setNextMatchUrl(getSpectatorEmbedNextMatchUrl(undefined, context));
      setUpcomingUrl(getSpectatorEmbedUpcomingUrl(undefined, context));
      setBattingStatsUrl(getSpectatorEmbedBattingStatsUrl(undefined, context));
      setBowlingStatsUrl(getSpectatorEmbedBowlingStatsUrl(undefined, context));
    };

    void (async () => {
      try {
        const { authenticatedFetch } = await import("@/lib/api-client");
        const res = await authenticatedFetch("/api/live/share");
        if (!res.ok) {
          throw new Error("Could not create share link");
        }
        const body = (await res.json()) as { key?: string };
        if (!body.key) {
          throw new Error("Could not create share link");
        }
        if (cancelled) return;
        setShareKeyError(null);
        buildUrls(body.key);
      } catch {
        if (cancelled) return;
        setShareKeyError("Could not create share links. Try again.");
        setWatchUrl("");
        setEmbedUrl("");
        setPreviewUrl("");
        setBattingUrl("");
        setBowlingUrl("");
        setBatting1stUrl("");
        setBowling1stUrl("");
        setPointsUrl("");
        setNextMatchUrl("");
        setUpcomingUrl("");
        setBattingStatsUrl("");
        setBowlingStatsUrl("");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, meta]);

  const openBigScoreWindow = () => {
    const url = scoreUrl || getLocalEmbedScoreUrl();
    if (!url) return;

    // Do not put noopener/noreferrer in windowFeatures — browsers return null
    // and may treat the open as blocked. Size alone requests a popup window.
    const win = window.open(url, "cricket-big-score", "width=1280,height=720");
    if (!win) {
      // Popup blocked: fall back to a normal tab (same as preview link).
      const tab = window.open(url, "_blank");
      if (!tab) {
        appToast.error("Pop-up blocked — allow pop-ups for this site");
        return;
      }
      tab.opener = null;
      return;
    }
    win.opener = null;
    win.focus();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="live-share-dialog border-[oklch(0.32_0.04_255)] bg-[oklch(0.12_0.025_255)] text-[var(--cricket-cream)] w-[min(96vw,56rem)] sm:max-w-5xl max-h-[min(92vh,52rem)] overflow-y-auto p-6 sm:p-7">
        <DialogHeader>
          <DialogTitle className="cricket-display text-lg font-semibold text-[var(--cricket-cream)]">
            Share live match
          </DialogTitle>
          <DialogDescription className="text-[oklch(0.62_0.03_255)]">
            {team1Name} vs {team2Name}
          </DialogDescription>
        </DialogHeader>

        {shareKeyError ? (
          <p className="text-sm text-[oklch(0.72_0.1_75)]">{shareKeyError}</p>
        ) : null}

        <ShareUrlField id="live-share-url" label="Watch link" url={watchUrl} />

        <div className="live-share-dialog__section">
          <p className="live-share-dialog__section-title">OBS overlays</p>
          <p className="live-share-dialog__section-text">
            Add each link as a separate Browser Source in OBS. Use a transparent
            background and the suggested size for each overlay.
          </p>

          <div className="live-share-dialog__grid">
            <ShareUrlField
              id="live-embed-url"
              label="Score bar"
              url={embedUrl}
              hint="Suggested size: 1920 × 1080, transparent. Score bar stays at the bottom; 4 / 6 / wicket GIFs play full-screen on this same source."
            />

            <ShareUrlField
              id="live-embed-batting-1st-url"
              label="1st innings batting scorecard"
              url={batting1stUrl}
              hint="Shows 1st innings batting live, then the completed card once the 2nd innings starts. Suggested size: 1920 × 1080."
            />

            <ShareUrlField
              id="live-embed-bowling-1st-url"
              label="1st innings bowling scorecard"
              url={bowling1stUrl}
              hint="Shows 1st innings bowling live, then the completed card once the 2nd innings starts. Suggested size: 1920 × 1080."
            />

            <ShareUrlField
              id="live-embed-batting-url"
              label="Batting scorecard (current innings)"
              url={battingUrl}
              hint="Follows the innings being scored now. Suggested size: 1920 × 1080 (full frame, centered)."
            />

            <ShareUrlField
              id="live-embed-bowling-url"
              label="Bowling scorecard (current innings)"
              url={bowlingUrl}
              hint="Follows the innings being scored now. Suggested size: 1920 × 1080 (full frame, centered)."
            />

            <ShareUrlField
              id="live-embed-next-match-url"
              label="Live match faceoff"
              url={nextMatchUrl}
              hint="Suggested size: 1920 × 1080 (full frame, centered)"
            />

            {isTournament ? (
              <ShareUrlField
                id="live-embed-upcoming-url"
                label="Coming up next"
                url={upcomingUrl}
                hint="Suggested size: 1920 × 1080 (full frame, centered)"
              />
            ) : null}

            {isTournament ? (
              <ShareUrlField
                id="live-embed-points-url"
                label="Points table"
                url={pointsUrl}
                hint="Suggested size: 1920 × 1080 (full frame, centered)"
              />
            ) : null}

            {isTournament ? (
              <ShareUrlField
                id="live-embed-batting-stats-url"
                label="Most runs (top 10)"
                url={battingStatsUrl}
                hint="Suggested size: 1920 × 1080 (full frame, centered)"
              />
            ) : null}

            {isTournament ? (
              <ShareUrlField
                id="live-embed-bowling-stats-url"
                label="Most wickets (top 10)"
                url={bowlingStatsUrl}
                hint="Suggested size: 1920 × 1080 (full frame, centered)"
              />
            ) : null}
          </div>
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
          <button
            type="button"
            className="live-share-dialog__preview-btn btn-12-exempt"
            onClick={openBigScoreWindow}
          >
            <ExternalLink size={16} strokeWidth={2.25} aria-hidden />
            Open big score window
          </button>
        </div>

        <p className="live-share-dialog__hint">
          Links include a private share key so OBS and spectators work without
          logging in. Score bar overlays pin to the bottom. Full-frame overlays
          (batting, bowling, points, stats, faceoff, coming up next) are centered
          with a dark transparent backdrop.
        </p>
      </DialogContent>
    </Dialog>
  );
}
