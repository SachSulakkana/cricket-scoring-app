"use client";

import { useRouter } from "next/navigation";
import SettingsPage from "@/components/SettingsPage";
import { routes } from "@/lib/app-routes";

export default function SettingsRoute() {
  const router = useRouter();
  return <SettingsPage onBack={() => router.push(routes.home)} />;
}
