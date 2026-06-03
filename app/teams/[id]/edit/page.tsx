"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import AddTeamPage from "@/components/AddTeamPage";
import { routes } from "@/lib/app-routes";
import { useRosterHydrated, useTeam } from "@/lib/store/roster-hooks";

export default function EditTeamPage() {
  const router = useRouter();
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const hydrated = useRosterHydrated();
  const team = useTeam(id);

  useEffect(() => {
    if (hydrated && id && !team) {
      router.replace(routes.teams);
    }
  }, [hydrated, id, team, router]);

  if (!hydrated || !team) {
    return null;
  }

  return (
    <AddTeamPage
      team={team}
      onBack={() => router.push(routes.teams)}
      onSaved={() => router.push(routes.teams)}
    />
  );
}
