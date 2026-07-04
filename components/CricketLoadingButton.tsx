"use client";

import { CricketAddButton } from "@/components/cricket-shell";
import CricketLoader from "@/components/CricketLoader";
import { cn } from "@/lib/utils";

type CricketLoadingButtonProps = React.ComponentProps<typeof CricketAddButton> & {
  loading?: boolean;
  loadingLabel?: string;
};

export default function CricketLoadingButton({
  loading = false,
  loadingLabel = "Saving…",
  disabled,
  children,
  className,
  ...props
}: CricketLoadingButtonProps) {
  return (
    <CricketAddButton
      disabled={disabled || loading}
      className={cn(loading && "opacity-90", className)}
      {...props}
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <CricketLoader size="sm" />
          {loadingLabel}
        </span>
      ) : (
        children
      )}
    </CricketAddButton>
  );
}
