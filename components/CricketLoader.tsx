"use client";

import { cn } from "@/lib/utils";

export interface CricketLoaderProps {
  /** Optional status text below the ball. */
  label?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  /** Center in a min-height block (page-level loading). */
  block?: boolean;
}

const sizeClass = {
  sm: "cricket-loader__ball--sm",
  md: "cricket-loader__ball--md",
  lg: "cricket-loader__ball--lg",
} as const;

export default function CricketLoader({
  label,
  size = "md",
  className,
  block = false,
}: CricketLoaderProps) {
  const ball = (
    <div className={cn("cricket-loader__ball-wrap", sizeClass[size])}>
      <div className="cricket-loader__ball" aria-hidden>
        <span className="cricket-loader__seam cricket-loader__seam--a" />
        <span className="cricket-loader__seam cricket-loader__seam--b" />
        <span className="cricket-loader__shine" />
      </div>
    </div>
  );

  const content = (
    <div
      className={cn("cricket-loader", className)}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={label ?? "Loading"}
    >
      {ball}
      {label ? <p className="cricket-loader__label">{label}</p> : null}
    </div>
  );

  if (block) {
    return (
      <div className="cricket-loader-block">
        {content}
      </div>
    );
  }

  return content;
}
