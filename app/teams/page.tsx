"use client";

import { useRouter } from "next/navigation";
import TeamsListPage from "@/components/TeamsListPage";
import { routes } from "@/lib/app-routes";

export default function TeamsPage() {
  const router = useRouter();
  return (
    <TeamsListPage
      onBack={() => router.push(routes.home)}
      onCreateTeam={() => router.push(routes.createTeam)}
    />
  );
}
