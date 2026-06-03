"use client";

import type { ReactNode } from "react";

export default function RosterHeaderActions({
  children,
}: {
  children: ReactNode;
}) {
  return <div className="roster-header-actions">{children}</div>;
}
