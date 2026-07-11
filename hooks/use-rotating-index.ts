"use client";

import { useEffect, useState } from "react";

/**
 * Cycles through 0..count-1 on a fixed interval. Resets to 0 whenever the
 * count changes so the rotation stays in-bounds as content updates.
 */
export function useRotatingIndex(count: number, intervalMs = 3200): number {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [count]);

  useEffect(() => {
    if (count <= 1) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % count);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [count, intervalMs]);

  return count > 0 ? index % count : 0;
}
