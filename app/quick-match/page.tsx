"use client";

import { useRouter } from "next/navigation";
import QuickMatchApp from "@/components/QuickMatchApp";
import { routes } from "@/lib/app-routes";

export default function QuickMatchPage() {
  const router = useRouter();
  return <QuickMatchApp onBackToHome={() => router.push(routes.home)} />;
}
