"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import LandingPage from "@/components/LandingPage";
import SplashScreen from "@/components/SplashScreen";
import { appToast } from "@/lib/app-toast";
import { initRosterStorage } from "@/lib/roster-storage";
import {
  useRosterError,
  useRosterHydrated,
  useRosterLoading,
} from "@/lib/store/roster-hooks";

const MIN_SPLASH_MS = 900;

/** Once per browser session — survives client navigations back to `/`. */
let initialSplashCompleted = false;

export default function HomePage() {
  const hydrated = useRosterHydrated();
  const loading = useRosterLoading();
  const error = useRosterError();
  const [showHome, setShowHome] = useState(initialSplashCompleted);
  const mountRef = useRef(Date.now());

  const startLoad = useCallback(() => {
    void initRosterStorage().catch((err: unknown) => {
      console.error("Failed to load roster data", err);
      const message =
        err instanceof Error
          ? err.message
          : "Could not load saved data. Try again.";
      appToast.error(message);
    });
  }, []);

  useEffect(() => {
    if (initialSplashCompleted) {
      if (hydrated && !error) setShowHome(true);
      return;
    }

    if (!hydrated || error) {
      setShowHome(false);
      return;
    }

    const elapsed = Date.now() - mountRef.current;
    const delay = Math.max(0, MIN_SPLASH_MS - elapsed);
    const timer = window.setTimeout(() => {
      initialSplashCompleted = true;
      setShowHome(true);
    }, delay);
    return () => window.clearTimeout(timer);
  }, [hydrated, error]);

  if (initialSplashCompleted) {
    if (error) {
      return (
        <SplashScreen
          loading={false}
          error={error}
          onRetry={startLoad}
        />
      );
    }
    if (hydrated) {
      return <LandingPage />;
    }
  }

  if (showHome) {
    return <LandingPage />;
  }

  return (
    <SplashScreen
      loading={!hydrated || loading}
      error={error}
      onRetry={error ? startLoad : undefined}
    />
  );
}
