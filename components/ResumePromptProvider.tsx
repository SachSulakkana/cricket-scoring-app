"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import ConfirmActionDialog from "@/components/ConfirmActionDialog";
import type { MatchState } from "@/lib/cricket-types";
import type { LiveMatchMeta } from "@/lib/store/match-slice";

export type ResumeRequest = {
  meta: LiveMatchMeta;
  matchState: MatchState;
  ballCount: number;
  onAccept: () => void;
  onDecline: () => void;
};

type ResumePromptContextValue = {
  offerResume: (request: ResumeRequest) => void;
};

const ResumePromptContext = createContext<ResumePromptContextValue | null>(
  null
);

export function ResumePromptProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<ResumeRequest | null>(null);
  const shownKeys = useRef(new Set<string>());

  const offerResume = useCallback((request: ResumeRequest) => {
    const key =
      request.meta.kind === "quick"
        ? "quick"
        : `${request.meta.tournamentId}:${request.meta.fixtureId}`;
    if (shownKeys.current.has(key)) {
      request.onDecline();
      return;
    }
    shownKeys.current.add(key);
    setPending(request);
  }, []);

  const label =
    pending?.meta.kind === "quick" ? "quick match" : "tournament match";

  return (
    <ResumePromptContext.Provider value={{ offerResume }}>
      {children}
      <ConfirmActionDialog
        open={pending != null}
        onOpenChange={(open) => {
          if (!open && pending) {
            pending.onDecline();
            setPending(null);
          }
        }}
        title="Resume scoring?"
        description={
          pending
            ? `You have an in-progress ${label} with ${pending.ballCount} ball(s) recorded. Resume where you left off?`
            : ""
        }
        confirmLabel="Resume"
        cancelLabel="Start fresh"
        onConfirm={() => {
          if (!pending) return;
          pending.onAccept();
          setPending(null);
        }}
      />
    </ResumePromptContext.Provider>
  );
}

export function useResumePrompt() {
  const ctx = useContext(ResumePromptContext);
  if (!ctx) {
    throw new Error("useResumePrompt must be used within ResumePromptProvider");
  }
  return ctx;
}
