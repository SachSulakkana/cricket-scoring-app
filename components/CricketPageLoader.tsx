"use client";

import CricketLoader from "@/components/CricketLoader";

interface CricketPageLoaderProps {
  label?: string;
}

export default function CricketPageLoader({
  label = "Loading…",
}: CricketPageLoaderProps) {
  return <CricketLoader label={label} size="lg" block />;
}
