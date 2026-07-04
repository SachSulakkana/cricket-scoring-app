"use client";

import { useRouter } from "next/navigation";
import LiveMatchCard from "@/components/LiveMatchCard";
import CricketLoader from "@/components/CricketLoader";
import {
  CricketBackButton,
  CricketPage,
} from "@/components/cricket-shell";
import { useLiveMatchSnapshot } from "@/hooks/use-live-match-snapshot";
import { routes } from "@/lib/app-routes";

export default function LiveMatchHub() {
  const router = useRouter();
  const { draft, loading, error } = useLiveMatchSnapshot();

  const liveMatches =
    draft?.matchState?.matchStarted ? [draft] : [];

  return (
    <CricketPage className="live-hub-page">
      <header className="live-hub-topbar">
        <CricketBackButton
          onClick={() => router.push(routes.home)}
          ariaLabel="Back to home"
        />
        <h1 className="live-hub-topbar__title">Watch Live</h1>
        <div className="w-11" aria-hidden />
      </header>

      {loading ? (
        <CricketLoader
          block
          size="lg"
          label="Loading live matches…"
        />
      ) : liveMatches.length === 0 ? (
        <div className="live-hub-empty">
          <span className="live-hub-empty__icon" aria-hidden>
            📡
          </span>
          <h2 className="cricket-display text-xl font-semibold text-[var(--cricket-cream)]">
            No live matches
          </h2>
          <p className="live-hub-empty__text">
            When a scorer starts a match, it will appear here so you can watch
            or share the link.
          </p>
        </div>
      ) : (
        <div className="live-hub-list">
          {liveMatches.map((item) => (
            <LiveMatchCard
              key={item.updatedAt}
              matchState={item.matchState}
              meta={item.meta}
              onWatch={() => router.push(routes.liveWatch)}
            />
          ))}
        </div>
      )}

      {error ? <p className="live-hub-error">{error}</p> : null}
    </CricketPage>
  );
}
