import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  getSubscriptionTier,
  initPurchases,
  isPurchasesConfigured,
  purchasePro,
  restorePurchases,
  type SubscriptionTier,
} from "../lib/payments/revenueCat";
import { useAuth } from "./AuthContext";

type SubscriptionContextValue = {
  tier: SubscriptionTier;
  loading: boolean;
  configured: boolean;
  purchase: () => Promise<boolean>;
  restore: () => Promise<void>;
  refresh: () => Promise<void>;
};

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { userId } = useAuth();
  const [tier, setTier] = useState<SubscriptionTier>("free");
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      await initPurchases(userId ?? undefined);
      setTier(await getSubscriptionTier());
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const purchase = useCallback(async () => {
    const ok = await purchasePro();
    if (ok) setTier("pro");
    return ok;
  }, []);

  const restore = useCallback(async () => {
    setTier(await restorePurchases());
  }, []);

  const value = useMemo(
    () => ({
      tier,
      loading,
      configured: isPurchasesConfigured(),
      purchase,
      restore,
      refresh,
    }),
    [tier, loading, purchase, restore, refresh],
  );

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error("useSubscription must be used within SubscriptionProvider");
  return ctx;
}
