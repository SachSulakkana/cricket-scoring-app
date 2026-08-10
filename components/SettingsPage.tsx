"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, LogOut, Settings, UserRound } from "lucide-react";
import ConfirmDeleteDialog from "@/components/ConfirmDeleteDialog";
import RefreshRosterButton from "@/components/RefreshRosterButton";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/AuthProvider";
import { isAuthDisabled } from "@/lib/client-flags";
import {
  clearAppData,
  DATA_CLEAR_OPTIONS,
  type DataClearAction,
} from "@/lib/clear-app-data";
import { appToast } from "@/lib/app-toast";
import {
  CricketBroadcastCard,
  CricketEyebrow,
  CricketPage,
  CricketPageHeader,
} from "@/components/cricket-shell";
import { routes } from "@/lib/app-routes";

interface SettingsPageProps {
  onBack: () => void;
}

export default function SettingsPage({ onBack }: SettingsPageProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [pendingAction, setPendingAction] = useState<DataClearAction | null>(
    null
  );
  const [clearing, setClearing] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

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

  const onSignOut = () => {
    setSigningOut(true);
    void logout()
      .then(() => {
        appToast.success("Signed out");
        router.replace(routes.login);
        router.refresh();
      })
      .catch((err) =>
        appToast.error(err instanceof Error ? err.message : "Could not sign out")
      )
      .finally(() => setSigningOut(false));
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
          <UserRound className="h-5 w-5 shrink-0 text-[var(--cricket-gold)] mt-0.5" />
          <div className="min-w-0 flex-1">
            <CricketEyebrow className="mb-1">Account</CricketEyebrow>
            <p className="text-sm text-[var(--cricket-cream)] truncate">
              {isAuthDisabled() ? "Local device (no login)" : user?.email ?? "Signed in"}
            </p>
            <p className="text-xs text-[oklch(0.55_0.03_255)] mt-0.5">
              Your players, teams, and tournaments are private to this account.
            </p>
          </div>
        </div>
      </CricketBroadcastCard>

      <CricketBroadcastCard className="p-5 space-y-3 border-[oklch(0.45_0.12_25/0.35)]">
        <div className="flex items-start gap-2.5">
          <AlertTriangle className="h-5 w-5 shrink-0 text-[oklch(0.72_0.14_25)] mt-0.5" />
          <div>
            <CricketEyebrow className="mb-1 text-[oklch(0.72_0.12_75)]">
              Clear data
            </CricketEyebrow>
            <p className="text-xs text-[oklch(0.55_0.03_255)] leading-relaxed">
              These actions permanently delete data from your account.
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

      {!isAuthDisabled() && (
        <CricketBroadcastCard className="p-5 mt-4 mb-2">
          <Button
            type="button"
            variant="secondary"
            disabled={signingOut}
            onClick={onSignOut}
            className="w-full gap-2"
          >
            <LogOut className="h-4 w-4" />
            {signingOut ? "Logging out…" : "Logout"}
          </Button>
        </CricketBroadcastCard>
      )}

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
