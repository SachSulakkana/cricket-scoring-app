"use client";

import { cn } from "@/lib/utils";

export type SpectatorMatchTab = "live" | "scorecard" | "matches" | "stats";

interface SpectatorNavTabsProps {
  active: SpectatorMatchTab;
  onChange: (tab: SpectatorMatchTab) => void;
  isTournament: boolean;
  className?: string;
}

const QUICK_TABS: { id: SpectatorMatchTab; label: string }[] = [
  { id: "live", label: "Live match" },
  { id: "scorecard", label: "Scorecard" },
];

const TOURNAMENT_TABS: { id: SpectatorMatchTab; label: string }[] = [
  { id: "live", label: "Live match" },
  { id: "scorecard", label: "Scorecard" },
  { id: "matches", label: "More matches" },
  { id: "stats", label: "Stats" },
];

export default function SpectatorNavTabs({
  active,
  onChange,
  isTournament,
  className,
}: SpectatorNavTabsProps) {
  const tabs = isTournament ? TOURNAMENT_TABS : QUICK_TABS;

  return (
    <div
      className={cn("spectator-nav-tabs", className)}
      role="tablist"
      aria-label="Spectator views"
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={active === tab.id}
          className={cn(
            "spectator-nav-tab btn-12-exempt",
            active === tab.id && "spectator-nav-tab--active"
          )}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
