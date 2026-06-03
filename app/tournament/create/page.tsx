"use client";

import { useRouter } from "next/navigation";
import CreateTournamentPage from "@/components/CreateTournamentPage";
import { routes } from "@/lib/app-routes";

export default function CreateTournamentRoutePage() {
  const router = useRouter();

  return (
    <CreateTournamentPage onBack={() => router.push(routes.home)} />
  );
}
