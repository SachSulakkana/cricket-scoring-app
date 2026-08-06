"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { appToast } from "@/lib/app-toast";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { APP_NAME } from "@/lib/app-brand";
import { getSafeReturnTo, routes } from "@/lib/app-routes";

function authErrorMessage(error: unknown): string {
  const code =
    error && typeof error === "object" && "code" in error
      ? String((error as { code?: string }).code)
      : "";
  switch (code) {
    case "auth/email-already-in-use":
      return "An account with this email already exists";
    case "auth/invalid-email":
      return "Enter a valid email address";
    case "auth/weak-password":
      return "Password must be at least 6 characters";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Invalid email or password";
    case "auth/popup-closed-by-user":
      return "Google sign-in was cancelled";
    case "auth/popup-blocked":
      return "Pop-up blocked. Allow pop-ups for this site and try again";
    case "auth/unauthorized-domain":
      return "This domain is not allowed for sign-in. Add it in Firebase → Authentication → Settings → Authorized domains";
    default:
      return error instanceof Error ? error.message : "Authentication failed";
  }
}

export default function AuthForm({ mode }: { mode: "login" | "register" }) {
  const searchParams = useSearchParams();
  const returnTo = getSafeReturnTo(searchParams.get("returnTo")) ?? routes.home;
  const {
    user,
    loading,
    loginWithEmail,
    registerWithEmailPassword,
    loginWithGoogle,
  } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const title = mode === "login" ? "Sign in" : "Create account";
  const submitLabel = mode === "login" ? "Sign in" : "Create account";

  const finish = () => {
    // Hard navigation so middleware + HomePage see the new `__session` cookie
    // and auth state in one clean load (client soft nav raced ahead of setUser).
    window.location.assign(returnTo);
  };

  // After Google redirect (or refresh while already signed in), leave auth pages.
  useEffect(() => {
    if (loading || !user) return;
    window.location.replace(returnTo);
  }, [loading, user, returnTo]);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (mode === "register" && password !== confirm) {
      appToast.error("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      appToast.error("Password must be at least 6 characters");
      return;
    }

    setSubmitting(true);
    const action =
      mode === "login"
        ? loginWithEmail(email.trim(), password)
        : registerWithEmailPassword(email.trim(), password);

    void action
      .then(() => {
        appToast.success(mode === "login" ? "Signed in" : "Account created");
        finish();
      })
      .catch((error) => appToast.error(authErrorMessage(error)))
      .finally(() => setSubmitting(false));
  };

  const onGoogle = () => {
    setSubmitting(true);
    void loginWithGoogle()
      .then((completed) => {
        if (!completed) return; // full-page Google redirect in progress
        appToast.success("Signed in with Google");
        finish();
      })
      .catch((error) => appToast.error(authErrorMessage(error)))
      .finally(() => setSubmitting(false));
  };

  return (
    <div className="auth-page">
      <div className="auth-page__panel">
        <p className="auth-page__brand">{APP_NAME}</p>
        <h1 className="auth-page__title">{title}</h1>
        <p className="auth-page__subtitle">
          {mode === "login"
            ? "Sign in to access your scoring workspace."
            : "Register to keep players, teams, and tournaments private to you."}
        </p>

        <form className="auth-page__form" onSubmit={onSubmit}>
          <div className="auth-page__field">
            <Label htmlFor="auth-email">Email</Label>
            <Input
              id="auth-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="cricket-form-input"
              disabled={submitting}
            />
          </div>
          <div className="auth-page__field">
            <Label htmlFor="auth-password">Password</Label>
            <Input
              id="auth-password"
              type="password"
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="cricket-form-input"
              disabled={submitting}
            />
          </div>
          {mode === "register" ? (
            <div className="auth-page__field">
              <Label htmlFor="auth-confirm">Confirm password</Label>
              <Input
                id="auth-confirm"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="cricket-form-input"
                disabled={submitting}
              />
            </div>
          ) : null}

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Please wait…" : submitLabel}
          </Button>
        </form>

        <div className="auth-page__divider">
          <span>or</span>
        </div>

        <Button
          type="button"
          variant="secondary"
          className="w-full gap-2"
          disabled={submitting}
          onClick={onGoogle}
        >
          <svg
            className="h-4 w-4 shrink-0"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </Button>

        <p className="auth-page__switch">
          {mode === "login" ? (
            <>
              No account?{" "}
              <Link href={routes.register}>Create one</Link>
            </>
          ) : (
            <>
              Already registered?{" "}
              <Link href={routes.login}>Sign in</Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
