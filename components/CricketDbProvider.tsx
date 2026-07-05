"use client";

import { useEffect } from "react";
import { initRosterStorage } from "@/lib/roster-storage";

/** Kicks off roster hydration app-wide; home route shows splash while loading. */
export default function CricketDbProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    void initRosterStorage().catch((err: unknown) => {
      console.error("Failed to load roster from Firestore", err);
    });
  }, []);

  return <>{children}</>;
}
