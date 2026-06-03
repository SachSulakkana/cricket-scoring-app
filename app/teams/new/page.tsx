"use client";

import { useRouter } from "next/navigation";
import AddTeamPage from "@/components/AddTeamPage";
import { routes } from "@/lib/app-routes";

export default function NewTeamPage() {
  const router = useRouter();
  return (
    <AddTeamPage
      onBack={() => router.push(routes.teams)}
      onSaved={() => router.push(routes.teams)}
    />
  );
}
