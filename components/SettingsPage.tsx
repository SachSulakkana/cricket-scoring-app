"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, Database, History, KeyRound, Settings } from "lucide-react";
import ConfirmDeleteDialog from "@/components/ConfirmDeleteDialog";
import RefreshRosterButton from "@/components/RefreshRosterButton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  clearAppData,
  DATA_CLEAR_OPTIONS,
  type DataClearAction,
} from "@/lib/clear-app-data";
import { appToast } from "@/lib/app-toast";
import {
  getStoredApiSecret,
  setStoredApiSecret,
} from "@/lib/api-client";
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
  const [apiSecret, setApiSecret] = useState("");

  useEffect(() => {
    setApiSecret(getStoredApiSecret());
  }, []);

  const saveApiSecret = () => {
    setStoredApiSecret(apiSecret);
    appToast.success(
      apiSecret.trim()
        ? "API secret saved for this browser"
        : "API secret cleared"
    );
  };

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
        <div className="flex items-start gap-2.5">
          <KeyRound className="h-5 w-5 shrink-0 text-[var(--cricket-gold)] mt-0.5" />
          <div>
            <CricketEyebrow className="mb-1">API access</CricketEyebrow>
            <p className="text-xs text-[oklch(0.55_0.03_255)] leading-relaxed">
              If the server sets <code className="text-[0.65rem]">CRICKET_API_SECRET</code>,
              enter the same value here so this browser can save roster and match data.
            </p>
          </div>
        </div>
        <Input
          type="password"
          value={apiSecret}
          onChange={(e) => setApiSecret(e.target.value)}
          placeholder="Optional API secret"
          className="cricket-form-input"
          autoComplete="off"
        />
        <Button type="button" variant="secondary" onClick={saveApiSecret}>
          Save API secret
        </Button>
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
              These actions permanently delete data from Firestore.
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
                  ? "settings-clear-btn settings-clear-btn--full btn-12 btn-12--destructive btn-12--full w-full text-left"
                  : "settings-clear-btn btn-12 btn-12--sm w-full text-left"
              }
            >
              <span className="btn-12__label block w-full">
                <span className="block text-sm font-semibold">{option.label}</span>
                <span className="block text-xs opacity-80 mt-0.5 font-normal normal-case">
                  {option.description}
                </span>
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
