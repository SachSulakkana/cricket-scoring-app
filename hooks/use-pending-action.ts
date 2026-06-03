"use client";

import { useCallback, useState } from "react";
import { appToast } from "@/lib/app-toast";

type RunOptions = {
  successMessage?: string;
  errorMessage?: string;
  /** When false, errors are not toasted (caller handles validation). Default true. */
  toastErrors?: boolean;
};

export function usePendingAction() {
  const [pending, setPending] = useState(false);

  const run = useCallback(
    async <T,>(
      action: () => Promise<T>,
      options?: RunOptions
    ): Promise<T | undefined> => {
      setPending(true);
      try {
        const result = await action();
        if (options?.successMessage) {
          appToast.success(options.successMessage);
        }
        return result;
      } catch (err) {
        if (options?.toastErrors !== false) {
          const message =
            err instanceof Error
              ? err.message
              : options?.errorMessage ?? "Something went wrong";
          appToast.error(options?.errorMessage ?? message);
        }
        return undefined;
      } finally {
        setPending(false);
      }
    },
    []
  );

  return { pending, run };
}
