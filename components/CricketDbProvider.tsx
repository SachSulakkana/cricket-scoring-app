"use client";

import { useEffect, useState } from "react";
import CricketPageLoader from "@/components/CricketPageLoader";
import { appToast } from "@/lib/app-toast";
import { initRosterStorage } from "@/lib/roster-storage";

export default function CricketDbProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    initRosterStorage()
      .then(() => {
        if (!cancelled) setReady(true);
      })
      .catch((err: unknown) => {
        console.error("Failed to open local database", err);
        if (!cancelled) {
          const message =
            err instanceof Error
              ? err.message
              : "Could not load saved data. Try refreshing the page.";
          setError(message);
          appToast.error(message);
          setReady(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) {
    return <CricketPageLoader label="Opening local database…" />;
  }

  if (error) {
    return (
      <div className="cricket-page flex min-h-[50vh] flex-col items-center justify-center gap-3 px-4 text-center">
        <p className="text-sm text-[oklch(0.72_0.1_75)]">{error}</p>
        {children}
      </div>
    );
  }

  return <>{children}</>;
}
