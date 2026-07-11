"use client";

import { useEffect, useRef, useState } from "react";
import {
  getLiveScoreEventFromBall,
  type LiveScoreEvent,
} from "@/lib/live-score-event";
import type { LiveScoreView } from "@/lib/live-score-view";

export type LiveScoreEventPhase = "idle" | "enter" | "show" | "exit";

const DEFAULT_DURATION_MS = 1500;
const ENTER_MS = 250;
const EXIT_MS = 300;

export function useLiveScoreEventHighlight(
  view: LiveScoreView,
  durationMs = DEFAULT_DURATION_MS
) {
  const [event, setEvent] = useState<LiveScoreEvent | null>(null);
  const [phase, setPhase] = useState<LiveScoreEventPhase>("idle");
  const lastBallIdRef = useRef<string | null>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = () => {
    for (const timer of timersRef.current) {
      clearTimeout(timer);
    }
    timersRef.current = [];
  };

  const schedule = (fn: () => void, delay: number) => {
    const timer = setTimeout(fn, delay);
    timersRef.current.push(timer);
  };

  useEffect(() => clearTimers, []);

  useEffect(() => {
    if (view.kind !== "live") {
      return;
    }

    const balls = view.currentInnings.balls;
    const lastBall = balls.at(-1);
    if (!lastBall) {
      return;
    }

    if (lastBallIdRef.current === null) {
      lastBallIdRef.current = lastBall.id;
      return;
    }

    if (lastBall.id === lastBallIdRef.current) {
      return;
    }

    lastBallIdRef.current = lastBall.id;
    const nextEvent = getLiveScoreEventFromBall(lastBall);
    if (!nextEvent) {
      return;
    }

    clearTimers();
    setEvent(nextEvent);
    setPhase("enter");

    schedule(() => setPhase("show"), ENTER_MS);

    const holdMs = Math.max(durationMs - ENTER_MS - EXIT_MS, 300);
    schedule(() => setPhase("exit"), ENTER_MS + holdMs);
    schedule(() => {
      setPhase("idle");
      setEvent(null);
    }, durationMs);
  }, [view, durationMs]);

  return {
    event,
    phase,
    isActive: phase !== "idle" && event !== null,
  };
}
