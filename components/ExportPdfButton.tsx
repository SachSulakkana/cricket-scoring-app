"use client";

import { FileDown } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

interface ExportPdfButtonProps {
  onClick: () => void | Promise<void>;
  loading?: boolean;
  label?: string;
  className?: string;
  variant?: "setup" | "tournament";
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
          : "cricket-btn-setup",
        "w-full !min-h-11 inline-flex items-center justify-center gap-2 text-sm font-bold",
        className
      )}
    >
      {loading ? (
        <>
          <Spinner className="h-4 w-4" />
          Exporting…
        </>
      ) : (
        <>
          <FileDown className="h-4 w-4" />
          {label}
        </>
      )}
    </button>
  );
}
