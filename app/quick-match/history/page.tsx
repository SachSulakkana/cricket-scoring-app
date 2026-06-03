"use client";

import { useRouter } from "next/navigation";
import QuickMatchHistoryPage from "@/components/QuickMatchHistoryPage";
import { routes } from "@/lib/app-routes";

export default function QuickMatchHistoryRoute() {
  const router = useRouter();
  return (
    <QuickMatchHistoryPage onBack={() => router.push(routes.quickMatch)} />
  );
}
