"use client";

import { cn } from "@/lib/utils";

export type MatchDetailTab = "summary" | "scorecard";

interface MatchDetailTabsProps {
  active: MatchDetailTab;
  onChange: (tab: MatchDetailTab) => void;
  scorecardDisabled?: boolean;
  className?: string;
}

export default function MatchDetailTabs({
  active,
  onChange,
  scorecardDisabled = false,
  className,
}: MatchDetailTabsProps) {
  return (
    <div className={cn("flex justify-center", className)}>
      <div className="cricket-tab-bar w-full sm:w-auto">
        <button
          type="button"
          onClick={() => onChange("summary")}
          className={cn(
            "cricket-tab btn-12-exempt flex-1 sm:flex-none min-h-10",
            active === "summary" && "cricket-tab--active"
          )}
        >
          Summary
        </button>
        <button
          type="button"
          onClick={() => !scorecardDisabled && onChange("scorecard")}
          disabled={scorecardDisabled}
          className={cn(
            "cricket-tab btn-12-exempt flex-1 sm:flex-none min-h-10",
            active === "scorecard" && "cricket-tab--active",
            scorecardDisabled && "cricket-tab--disabled"
          )}
        >
          Scorecard
        </button>
      </div>
    </div>
  );
}
