"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import AddPlayerPage from "@/components/AddPlayerPage";
import { routes } from "@/lib/app-routes";
import { usePlayer, useRosterHydrated } from "@/lib/store/roster-hooks";

export default function EditPlayerPage() {
  const router = useRouter();
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const hydrated = useRosterHydrated();
  const player = usePlayer(id);

  useEffect(() => {
    if (hydrated && id && !player) {
      router.replace(routes.players);
    }
  }, [hydrated, id, player, router]);

  if (!hydrated || !player) {
    return null;
  }

  return (
    <AddPlayerPage
      player={player}
      onBack={() => router.push(routes.players)}
      onSaved={() => router.push(routes.players)}
    />
  );
}
