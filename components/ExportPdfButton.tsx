"use client";

import { FileDown } from "lucide-react";
import CricketLoader from "@/components/CricketLoader";
import { cn } from "@/lib/utils";

interface ExportPdfButtonProps {
  onClick: () => void | Promise<void>;
  loading?: boolean;
  label?: string;
  className?: string;
  variant?: "setup" | "tournament" | "outline";
}

export default function ExportPdfButton({
  onClick,
  loading = false,
  label = "Export PDF",
  className,
  variant = "setup",
}: ExportPdfButtonProps) {
  return (
    <button
      type="button"
      onClick={() => void onClick()}
      disabled={loading}
      className={cn(
        variant === "tournament"
          ? "cricket-btn-add cricket-btn-add--tournament"
          : variant === "outline"
            ? "cricket-btn-setup !w-auto !min-h-9 px-3 text-xs font-semibold"
            : "cricket-btn-setup",
        variant !== "outline" && "w-full !min-h-11",
        "inline-flex items-center justify-center gap-1.5 text-sm font-bold",
        className
      )}
    >
      {loading ? (
        <span className="inline-flex items-center gap-1.5">
          <CricketLoader size="sm" />
          Exporting…
        </span>
      ) : (
        <>
          <FileDown className="h-4 w-4" />
          {label}
        </>
      )}
    </button>
  );
}
