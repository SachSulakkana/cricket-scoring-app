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
          ? "btn-12 btn-12--md btn-12--full"
          : variant === "outline"
            ? "btn-12 btn-12--outline btn-12--md !w-auto !min-h-9 px-3 text-xs font-semibold"
            : "btn-12 btn-12--outline btn-12--md",
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
