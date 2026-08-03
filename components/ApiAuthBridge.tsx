"use client";

import { useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { clearApiTokenCache, setApiTokenProvider } from "@/lib/api-client";

/** Keeps authenticatedFetch in sync with Firebase ID tokens. */
export default function ApiAuthBridge() {
  const { user, getAccessToken } = useAuth();

  useEffect(() => {
    if (!user) {
      setApiTokenProvider(null);
      clearApiTokenCache();
      return;
    }
    setApiTokenProvider(() => getAccessToken(false));
    return () => {
      setApiTokenProvider(null);
      clearApiTokenCache();
    };
  }, [user, getAccessToken]);

  return null;
}
