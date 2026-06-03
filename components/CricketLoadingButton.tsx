"use client";

import { CricketAddButton } from "@/components/cricket-shell";
import { Spinner } from "@/components/ui/spinner";
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
        <>
          <Spinner className="h-4 w-4" />
          {loadingLabel}
        </>
      ) : (
        children
      )}
    </CricketAddButton>
  );
}
