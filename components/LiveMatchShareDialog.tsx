"use client";

import { useEffect, useState } from "react";
import { Copy, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getSpectatorLiveUrl } from "@/lib/app-routes";
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

export default function LiveMatchShareDialog({
  open,
  onOpenChange,
  team1Name,
  team2Name,
  meta,
}: LiveMatchShareDialogProps) {
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) {
      const context =
        meta?.kind === "tournament"
          ? {
              tournamentId: meta.tournamentId,
              fixtureId: meta.fixtureId,
            }
          : undefined;
      setUrl(getSpectatorLiveUrl(undefined, context));
      setCopied(false);
    }
  }, [open, meta]);

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="live-share-dialog border-[oklch(0.32_0.04_255)] bg-[oklch(0.12_0.025_255)] text-[var(--cricket-cream)] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="cricket-display text-lg font-semibold text-[var(--cricket-cream)]">
            Share live match
          </DialogTitle>
          <DialogDescription className="text-[oklch(0.62_0.03_255)]">
            {team1Name} vs {team2Name}
          </DialogDescription>
        </DialogHeader>

        <div className="live-share-dialog__field">
          <label htmlFor="live-share-url" className="live-share-dialog__label">
            Match link
          </label>
          <div className="live-share-dialog__row">
            <input
              id="live-share-url"
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
      </DialogContent>
    </Dialog>
  );
}
