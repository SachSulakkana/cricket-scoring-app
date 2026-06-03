"use client";

import { useRouter } from "next/navigation";
import PlayersListPage from "@/components/PlayersListPage";
import { routes } from "@/lib/app-routes";

export default function PlayersPage() {
  const router = useRouter();
  return (
    <PlayersListPage
      onBack={() => router.push(routes.home)}
      onCreatePlayer={() => router.push(routes.createPlayer)}
    />
  );
}
