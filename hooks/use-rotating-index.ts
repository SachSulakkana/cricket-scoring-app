"use client";

import { useEffect, useState } from "react";

/**
 * Cycles through 0..count-1. When `intervalMs` is a number, every slide uses
 * that duration. When it is an array, slide i uses intervalMs[i] (falls back
 * to 3200ms if missing).
 */
export function useRotatingIndex(
  count: number,
  intervalMs: number | readonly number[] = 3200
): number {
  const [index, setIndex] = useState(0);
  const durationKey = Array.isArray(intervalMs)
    ? intervalMs.join(",")
    : String(intervalMs);

  useEffect(() => {
    setIndex(0);
  }, [count, durationKey]);

  useEffect(() => {
    if (count <= 1) return;

    const delays = durationKey.split(",").map((value) => Number(value));
    const delay = delays[index % delays.length] || 3200;

    const timer = setTimeout(() => {
      setIndex((prev) => (prev + 1) % count);
    }, delay);

    return () => clearTimeout(timer);
  }, [count, durationKey, index]);

  return count > 0 ? index % count : 0;
}
