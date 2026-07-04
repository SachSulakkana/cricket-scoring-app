"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, Database, History, Settings } from "lucide-react";
import ConfirmDeleteDialog from "@/components/ConfirmDeleteDialog";
import RefreshRosterButton from "@/components/RefreshRosterButton";
import {
  clearAppData,
  DATA_CLEAR_OPTIONS,
  type DataClearAction,
} from "@/lib/clear-app-data";
import { appToast } from "@/lib/app-toast";
import {
  CricketBroadcastCard,
  CricketDetailRow,
  CricketEyebrow,
  CricketPage,
  CricketPageHeader,
} from "@/components/cricket-shell";
import { routes } from "@/lib/app-routes";

interface SettingsPageProps {
  onBack: () => void;
}

function SettingsLinkRow({
  href,
  label,
  description,
}: {
  href: string;
  label: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="settings-link-row block rounded-md border border-[oklch(0.32_0.04_255)] px-4 py-3 transition-colors hover:border-[oklch(0.5_0.08_295/0.45)] hover:bg-[oklch(0.16_0.03_255/0.6)]"
    >
      <p className="text-sm font-semibold text-[var(--cricket-cream)]">{label}</p>
      <p className="text-xs text-[oklch(0.55_0.03_255)] mt-0.5">{description}</p>
    </Link>
  );
}

export default function SettingsPage({ onBack }: SettingsPageProps) {
  const router = useRouter();
  const [pendingAction, setPendingAction] = useState<DataClearAction | null>(
    null
  );
  const [clearing, setClearing] = useState(false);

  const pendingOption = DATA_CLEAR_OPTIONS.find(
    (o) => o.action === pendingAction
  );

  const runClear = () => {
    if (!pendingAction) return;
    setClearing(true);
    void clearAppData(pendingAction)
      .then(() => {
        appToast.success(
          pendingOption?.label
            ? `${pendingOption.label} completed`
            : "Data cleared"
        );
        setPendingAction(null);
      })
      .catch((err) =>
        appToast.error(err instanceof Error ? err.message : "Could not clear data")
      )
      .finally(() => setClearing(false));
  };

  return (
    <CricketPage>
      <CricketPageHeader onBack={onBack} title="Settings" homeHref={routes.home} />

      <CricketBroadcastCard accent className="p-5 mb-4">
        <div className="flex items-start gap-3 mb-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-[oklch(0.55_0.12_75/0.35)] bg-[oklch(0.28_0.08_75/0.35)]">
            <Settings className="h-5 w-5 text-[var(--cricket-gold)]" />
          </div>
          <div>
            <CricketEyebrow className="mb-1">App settings</CricketEyebrow>
            <p className="text-sm text-[oklch(0.65_0.03_255)] leading-relaxed">
              Manage data sync and shortcuts from the dashboard.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <RefreshRosterButton />
        </div>
      </CricketBroadcastCard>

      <CricketBroadcastCard className="p-5 space-y-3 mb-4">
        <CricketEyebrow>Data</CricketEyebrow>
        <SettingsLinkRow
          href={routes.quickMatchHistory}
          label="Match history"
          description="View quick matches saved to the database"
        />
        <button
          type="button"
          className="settings-link-row w-full text-left rounded-md border border-[oklch(0.32_0.04_255)] px-4 py-3 transition-colors hover:border-[oklch(0.5_0.08_295/0.45)] hover:bg-[oklch(0.16_0.03_255/0.6)]"
          onClick={() => router.push(routes.players)}
        >
          <p className="text-sm font-semibold text-[var(--cricket-cream)]">
            Players & teams
          </p>
          <p className="text-xs text-[oklch(0.55_0.03_255)] mt-0.5">
            Edit squad registry and rosters
          </p>
        </button>
      </CricketBroadcastCard>

      <CricketBroadcastCard className="p-5 space-y-3 border-[oklch(0.45_0.12_25/0.35)]">
        <div className="flex items-start gap-2.5">
          <AlertTriangle className="h-5 w-5 shrink-0 text-[oklch(0.72_0.14_25)] mt-0.5" />
          <div>
            <CricketEyebrow className="mb-1 text-[oklch(0.72_0.12_75)]">
              Clear data
            </CricketEyebrow>
            <p className="text-xs text-[oklch(0.55_0.03_255)] leading-relaxed">
              These actions permanently delete data from your local database.
              You will be asked to confirm each one.
            </p>
          </div>
        </div>

        <div className="space-y-2 pt-1">
          {DATA_CLEAR_OPTIONS.map((option) => (
            <button
              key={option.action}
              type="button"
              disabled={clearing}
              onClick={() => setPendingAction(option.action)}
              className={
                option.variant === "destructive"
                  ? "settings-clear-btn settings-clear-btn--full w-full text-left"
                  : "settings-clear-btn w-full text-left"
              }
            >
              <span className="block text-sm font-semibold">{option.label}</span>
              <span className="block text-xs opacity-80 mt-0.5 font-normal">
                {option.description}
              </span>
            </button>
          ))}
        </div>
      </CricketBroadcastCard>

      <CricketBroadcastCard className="p-5 mt-4 space-y-2">
        <CricketEyebrow>Storage</CricketEyebrow>
        <CricketDetailRow label="Database" value="Cloud Firestore" />
        <div className="flex items-center gap-2 text-xs text-[oklch(0.55_0.03_255)] pt-1">
          <Database className="h-3.5 w-3.5 shrink-0" />
          <span>Firebase project (synced via API)</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-[oklch(0.55_0.03_255)]">
          <History className="h-3.5 w-3.5 shrink-0" />
          <span>Use Refresh data after editing outside the app</span>
        </div>
      </CricketBroadcastCard>

      <ConfirmDeleteDialog
        open={pendingAction != null}
        onOpenChange={(open) => !open && !clearing && setPendingAction(null)}
        title={pendingOption?.label ?? "Clear data?"}
        description={
          pendingOption
            ? `${pendingOption.description} Continue?`
            : ""
        }
        confirmLabel={clearing ? "Clearing…" : "Clear"}
        onConfirm={runClear}
        loading={clearing}
      />
    </CricketPage>
  );
}
