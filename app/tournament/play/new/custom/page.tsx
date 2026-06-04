"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { routes } from "@/lib/app-routes";

/** Custom templates now live on the main new-tournament screen. */
export default function SelectCustomTournamentRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(routes.playTournamentNew);
  }, [router]);

  return null;
}
