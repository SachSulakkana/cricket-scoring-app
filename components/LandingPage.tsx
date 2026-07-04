"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import AppLogo from "@/components/AppLogo";
import { APP_NAME } from "@/lib/app-brand";
import type { LandingTileImageKey } from "@/lib/landing-tile-images";
import { openSpectatorView, routes } from "@/lib/app-routes";

function TileLabel({
  lines,
  subtitle,
}: {
  lines: [string, string];
  subtitle?: string;
}) {
  return (
    <span className="landing-tile__label">
      {lines[0]}
      {lines[1] ? (
        <>
          <br />
          {lines[1]}
        </>
      ) : null}
      {subtitle ? (
        <>
          <span className="landing-tile__subtitle">{subtitle}</span>
        </>
      ) : null}
    </span>
  );
}

function LandingTile({
  lines,
  subtitle,
  onClick,
  tall,
  accent,
  image,
  disabled,
}: {
  lines: [string, string];
  subtitle?: string;
  onClick?: () => void;
  tall?: boolean;
  accent?: "hero" | "quick";
  image?: LandingTileImageKey;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={`${lines[0]}${lines[1] ? ` ${lines[1]}` : ""}${subtitle ? `. ${subtitle}` : ""}`}
      className={[
        "landing-tile",
        tall ? "landing-tile--tall" : "landing-tile--short",
        accent === "hero" && "landing-tile--hero",
        accent === "quick" && "landing-tile--quick",
        disabled && "landing-tile--disabled",
        image && "landing-tile--has-image",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {image && (
        <span
          className={`landing-tile__media landing-tile__media--${image}`}
          aria-hidden
        />
      )}
      <span className="landing-tile__overlay" aria-hidden />
      <span className="landing-tile__ring" aria-hidden />
      <span className="landing-tile__glow" aria-hidden />
      <span className="landing-tile__shine" aria-hidden />
      <span className="landing-tile__content">
        <TileLabel lines={lines} subtitle={subtitle} />
      </span>
    </button>
  );
}

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="landing-wireframe">
      <div className="landing-frame">
        <div className="landing-brand">
          <AppLogo size={40} priority className="landing-brand__logo" />
          <span className="landing-brand__name">{APP_NAME}</span>
        </div>
        <Link href={routes.home} className="landing-home-tab">
          Home
        </Link>

        <div className="landing-board">
          <div className="landing-row landing-row--top">
            <LandingTile
              tall
              accent="hero"
              image="tournament"
              lines={["Play", "Tournament"]}
              subtitle="Ongoing & completed runs"
              onClick={() => router.push(routes.playTournament)}
            />
            <LandingTile
              tall
              image="player"
              lines={["Create", "Player"]}
              subtitle="Squad registry"
              onClick={() => router.push(routes.players)}
            />
            <LandingTile
              tall
              image="team"
              lines={["Create", "Team"]}
              subtitle="Squads & logos"
              onClick={() => router.push(routes.teams)}
            />
            <LandingTile
              tall
              image="calendar"
              lines={["Create", "Tournament"]}
              subtitle="Templates for play"
              onClick={() => router.push(routes.createTournament)}
            />
          </div>

          <div className="landing-row landing-row--bottom">
            <LandingTile
              accent="quick"
              image="quickMatch"
              lines={["Quick", "Match"]}
              subtitle="Score without a fixture"
              onClick={() => router.push(routes.quickMatch)}
            />
            <LandingTile
              image="live"
              lines={["Watch", "Live"]}
              subtitle="Follow the match"
              onClick={openSpectatorView}
            />
            <LandingTile
              image="comingSoon"
              lines={["Match", "History"]}
              subtitle="Saved quick matches"
              onClick={() => router.push(routes.quickMatchHistory)}
            />
            <LandingTile
              image="settings"
              lines={["Setting", ""]}
              subtitle="Data & preferences"
              onClick={() => router.push(routes.settings)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
