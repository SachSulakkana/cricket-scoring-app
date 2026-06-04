"use client";

import { cn } from "@/lib/utils";

export function CricketPage({
  children,
  className,
  wide,
  extraWide,
  roster,
}: {
  children: React.ReactNode;
  className?: string;
  wide?: boolean;
  /** Wider forms (e.g. tournament setup with team grid). */
  extraWide?: boolean;
  /** Wide layout for roster grids (e.g. 6 player cards per row). */
  roster?: boolean;
}) {
  return (
    <div className={cn("cricket-page", className)}>
      <div
        className={cn(
          "relative z-10 mx-auto w-full min-w-0 max-w-full px-3 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(2.5rem,env(safe-area-inset-bottom))] sm:px-4 sm:pt-5 sm:pb-10",
          roster
            ? "max-w-7xl"
            : extraWide
              ? "max-w-6xl"
              : wide
                ? "max-w-4xl"
                : "max-w-2xl"
        )}
      >
        {children}
      </div>
    </div>
  );
}

/** Icon-only back control; `ariaLabel` is for screen readers (not shown on screen). */
export function CricketBackButton({
  onClick,
  ariaLabel = "Go back",
  className,
}: {
  onClick: () => void;
  ariaLabel?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      title={ariaLabel}
      className={cn(
        "cricket-btn-back inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-xl leading-none touch-manipulation",
        className
      )}
    >
      <span aria-hidden>←</span>
    </button>
  );
}

export function CricketPageHeader({
  onBack,
  title,
  action,
  backLabel = "Go back",
  homeHref,
}: {
  onBack: () => void;
  title: string;
  action?: React.ReactNode;
  /** Accessible label for the back button (icon only). */
  backLabel?: string;
  /** Optional link to home (shown beside back). */
  homeHref?: string;
}) {
  return (
    <header className="cricket-page-header flex items-center gap-2 sm:gap-3 mb-5 sm:mb-7 min-w-0">
      <div className="flex shrink-0 items-center gap-1 min-w-0">
        <CricketBackButton
          onClick={onBack}
          ariaLabel={backLabel}
          className="-ml-1 sm:-ml-2"
        />
        {homeHref ? (
          <a
            href={homeHref}
            className="cricket-btn-home-link hidden sm:inline min-h-11 items-center"
          >
            Home
          </a>
        ) : null}
      </div>
      <h1 className="cricket-display flex-1 min-w-0 text-center text-sm sm:text-lg font-semibold text-[var(--cricket-cream)] tracking-wide truncate px-0.5 sm:px-1">
        {title}
      </h1>
      {action ? (
        <div className="flex shrink-0 items-center justify-end min-w-0 max-w-[42%] sm:max-w-none overflow-x-auto">
          {action}
        </div>
      ) : (
        <div className="w-11 shrink-0" aria-hidden />
      )}
    </header>
  );
}

export function CricketFormFieldError({ children }: { children: React.ReactNode }) {
  return <p className="cricket-field-error">{children}</p>;
}

export function CricketAddButton({
  children,
  className,
  variant = "player",
  size = "header",
  type = "button",
  ...props
}: React.ComponentProps<"button"> & {
  variant?: "player" | "team" | "tournament";
  size?: "header" | "inline" | "full";
}) {
  return (
    <button
      type={type}
      className={cn(
        "cricket-btn-add",
        size === "header" && "cricket-btn-add--header",
        size === "inline" && "cricket-btn-add--inline",
        size === "full" && "cricket-btn-add--full",
        variant === "player" && "cricket-btn-add--player",
        variant === "team" && "cricket-btn-add--team",
        variant === "tournament" && "cricket-btn-add--tournament",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function CricketEyebrow({
  children,
  live,
  className,
}: {
  children: React.ReactNode;
  live?: boolean;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "cricket-eyebrow mb-2",
        live && "cricket-eyebrow--live",
        className
      )}
    >
      {children}
    </p>
  );
}

export function CricketDetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="cricket-detail-row">
      <span className="cricket-detail-row__label">{label}</span>
      <span className="cricket-detail-row__value">{value}</span>
    </div>
  );
}

export function CricketBroadcastCard({
  children,
  className,
  accent,
}: {
  children: React.ReactNode;
  className?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "cricket-broadcast-card overflow-hidden",
        accent && "cricket-broadcast-card--accent",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CricketProfileHero({
  imageUrl,
  alt,
  variant = "player",
  placeholder,
}: {
  imageUrl?: string;
  alt: string;
  variant?: "player" | "team";
  placeholder?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "cricket-profile-hero",
        variant === "team" && "cricket-profile-hero--team"
      )}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={alt}
          className={cn(
            "h-full w-full object-cover",
            variant === "player" ? "object-top" : "object-center"
          )}
        />
      ) : (
        placeholder
      )}
    </div>
  );
}

export function CricketLivePill() {
  return <span className="cricket-live-pill">Live</span>;
}

export function CricketMatchHeader({
  overs,
  innings,
  teamName,
  children,
}: {
  overs: number | string;
  innings: number;
  teamName: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="cricket-match-header space-y-3">
      <div className="flex items-center justify-center gap-3">
        <CricketLivePill />
        <span className="cricket-eyebrow mb-0">
          {overs} Over · Innings {innings}
        </span>
      </div>
      <h1 className="cricket-display text-2xl sm:text-3xl font-bold text-[var(--cricket-cream)]">
        {teamName}
      </h1>
      {children}
    </div>
  );
}

export function CricketScoreDisplay({
  children,
  className,
  size = "lg",
}: {
  children: React.ReactNode;
  className?: string;
  size?: "md" | "lg" | "xl";
}) {
  return (
    <span
      className={cn(
        "cricket-score text-[var(--cricket-score)]",
        size === "md" && "text-2xl",
        size === "lg" && "text-3xl",
        size === "xl" && "text-4xl sm:text-5xl",
        className
      )}
    >
      {children}
    </span>
  );
}

export function CricketFormLabel({
  children,
  htmlFor,
}: {
  children: React.ReactNode;
  htmlFor?: string;
}) {
  return (
    <label htmlFor={htmlFor} className="cricket-form-label">
      {children}
    </label>
  );
}
