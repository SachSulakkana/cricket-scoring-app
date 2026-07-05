"use client";

import { useRouter } from "next/navigation";
import MatchHistoryPage from "@/components/MatchHistoryPage";
import { routes } from "@/lib/app-routes";

export default function QuickMatchHistoryRoute() {
  const router = useRouter();
  return <MatchHistoryPage onBack={() => router.push(routes.home)} />;
}
