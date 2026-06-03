"use client";

import { useRouter } from "next/navigation";
import AddPlayerPage from "@/components/AddPlayerPage";
import { routes } from "@/lib/app-routes";

export default function NewPlayerPage() {
  const router = useRouter();
  return (
    <AddPlayerPage
      onBack={() => router.push(routes.players)}
      onSaved={() => router.push(routes.players)}
    />
  );
}
