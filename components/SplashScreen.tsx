"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { CricketBatIcon } from "@/components/icons/CricketBatIcon";

const LOAD_STEPS = [
  { id: "db", label: "Opening local database" },
  { id: "roster", label: "Loading players & teams" },
  { id: "tournaments", label: "Syncing tournaments & fixtures" },
  { id: "ready", label: "Preparing your scoreboard" },
] as const;

interface SplashScreenProps {
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export default function SplashScreen({
  loading = true,
  error = null,
  onRetry,
}: SplashScreenProps) {
  const [progress, setProgress] = useState(0);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    if (!loading) {
      setProgress(100);
      setActiveStep(LOAD_STEPS.length - 1);
      return;
    }

    setProgress(0);
    setActiveStep(0);

    const progressTimer = window.setInterval(() => {
      setProgress((prev) => {
        if (prev >= 92) return prev;
        const bump = 4 + Math.random() * 10;
        return Math.min(prev + bump, 92);
      });
    }, 380);

    const stepTimer = window.setInterval(() => {
      setActiveStep((prev) =>
        prev < LOAD_STEPS.length - 2 ? prev + 1 : prev
      );
    }, 900);

    return () => {
      window.clearInterval(progressTimer);
      window.clearInterval(stepTimer);
    };
  }, [loading]);

  const currentLabel = error
    ? "Something went wrong"
    : loading
      ? LOAD_STEPS[activeStep]?.label ?? LOAD_STEPS[0].label
      : "All set";

  return (
    <div
      className="splash-screen"
      role="status"
      aria-live="polite"
      {...(loading ? { "aria-busy": true as const } : {})}
    >
      <div className="splash-screen__backdrop" aria-hidden>
        <div className="splash-screen__mesh" />
        <div className="splash-screen__grid" />
        <div className="splash-screen__orb splash-screen__orb--a" />
        <div className="splash-screen__orb splash-screen__orb--b" />
        <div className="splash-screen__orb splash-screen__orb--c" />
        <div className="splash-screen__pitch">
          <span className="splash-screen__pitch-line" />
          <span className="splash-screen__pitch-circle" />
        </div>
      </div>

      <div className="splash-screen__shell">
        <div className="splash-screen__badge">
          <span className="splash-screen__live-dot" aria-hidden />
          <span>Professional scoring suite</span>
        </div>

        <div className="splash-screen__hero splash-screen__reveal splash-screen__reveal--1">
          <div className="splash-screen__emblem" aria-hidden>
            <span className="splash-screen__ring splash-screen__ring--outer" />
            <span className="splash-screen__ring splash-screen__ring--inner" />
            <span className="splash-screen__emblem-core">
              <CricketBatIcon className="h-12 w-12" />
            </span>
          </div>

          <h1 className="splash-screen__title">
            <span className="splash-screen__title-line">Cricket</span>
            <span className="splash-screen__title-accent">Scorer</span>
          </h1>

          <p className="splash-screen__tagline">
            Ball-by-ball precision for tournaments, squads & quick matches
          </p>

          <ul className="splash-screen__chips" aria-hidden>
            <li>Tournaments</li>
            <li>Live scoring</li>
            <li>Squads</li>
          </ul>
        </div>

        {error ? (
          <div
            className="splash-screen__panel splash-screen__panel--error splash-screen__reveal splash-screen__reveal--2"
          >
            <div className="splash-screen__error-icon" aria-hidden>
              <AlertCircle className="h-5 w-5" />
            </div>
            <p className="splash-screen__error-title">Could not load your data</p>
            <p className="splash-screen__error-msg">{error}</p>
            {onRetry ? (
              <button
                type="button"
                className="splash-screen__retry"
                onClick={onRetry}
              >
                <RefreshCw className="h-3.5 w-3.5" aria-hidden />
                Try again
              </button>
            ) : null}
          </div>
        ) : (
          <div className="splash-screen__panel splash-screen__reveal splash-screen__reveal--2">
            <div className="splash-screen__progress-meta">
              <span className="splash-screen__progress-label">{currentLabel}</span>
              <span className="splash-screen__progress-pct">
                {Math.round(progress)}%
              </span>
            </div>

            <div
              className="splash-screen__track"
              role="progressbar"
              aria-label={currentLabel}
              aria-valuetext={`${Math.round(progress)} percent complete`}
            >
              <div
                className="splash-screen__fill"
                style={
                  {
                    "--splash-progress": `${progress}%`,
                  } as CSSProperties
                }
              >
                <span className="splash-screen__fill-glow" aria-hidden />
              </div>
            </div>

            <ol className="splash-screen__steps">
              {LOAD_STEPS.map((step, index) => {
                const state =
                  index < activeStep
                    ? "done"
                    : index === activeStep
                      ? loading
                        ? "active"
                        : "done"
                      : "pending";
                return (
                  <li
                    key={step.id}
                    className={`splash-screen__step splash-screen__step--${state}`}
                  >
                    <span className="splash-screen__step-dot" aria-hidden />
                    <span>{step.label}</span>
                  </li>
                );
              })}
            </ol>
          </div>
        )}

        <footer className="splash-screen__footer splash-screen__reveal splash-screen__reveal--3">
          <span className="splash-screen__footer-line" aria-hidden />
          <p>Secure local storage · No account required</p>
        </footer>
      </div>
    </div>
  );
}
