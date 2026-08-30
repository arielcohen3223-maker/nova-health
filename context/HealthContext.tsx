import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { HealthMetrics } from "../lib/types/health";
import { fetchHealthMetrics, isHealthConnectAvailable, isHealthKitAvailable, requestHealthPermission } from "../lib/health/healthService";
import { computeHealthScore, computeRecovery, MOCK_METRICS } from "../lib/health/metrics";
import { loadLatestFromSupabase, syncMetricsToSupabase } from "../lib/health/sync";
import { loadLocalMetrics, saveLocalMetrics } from "../lib/storage/localStore";
import { useAuth } from "./AuthContext";

type HealthContextValue = {
  metrics: HealthMetrics;
  score: number;
  recovery: number;
  loading: boolean;
  healthConnected: boolean;
  healthKitAvailable: boolean;
  healthConnectAvailable: boolean;
  connectHealth: () => Promise<boolean>;
  refresh: () => Promise<void>;
};

const HealthContext = createContext<HealthContextValue | null>(null);

export function HealthProvider({ children }: { children: React.ReactNode }) {
  const { userId } = useAuth();
  const [metrics, setMetrics] = useState<HealthMetrics>(MOCK_METRICS);
  const [loading, setLoading] = useState(false);
  const [healthConnected, setHealthConnected] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      if (userId && userId !== "demo-user") {
        const cached = await loadLatestFromSupabase(userId);
        if (cached) {
          setMetrics(cached);
          await saveLocalMetrics(cached);
          setLoading(false);
          return;
        }
      } else {
        const local = await loadLocalMetrics();
        if (local) {
          setMetrics(local);
          setLoading(false);
          return;
        }
      }
      const latest = await fetchHealthMetrics();
      setMetrics(latest);
      await saveLocalMetrics(latest);
      if (userId && userId !== "demo-user" && latest.source !== "mock") {
        await syncMetricsToSupabase(userId, latest);
      }
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const connectHealth = useCallback(async () => {
    const ok = await requestHealthPermission();
    setHealthConnected(ok);
    if (ok) await refresh();
    return ok;
  }, [refresh]);

  const value = useMemo<HealthContextValue>(
    () => ({
      metrics,
      score: computeHealthScore(metrics),
      recovery: computeRecovery(metrics),
      loading,
      healthConnected,
      healthKitAvailable: isHealthKitAvailable(),
      healthConnectAvailable: isHealthConnectAvailable(),
      connectHealth,
      refresh,
    }),
    [metrics, loading, healthConnected, connectHealth, refresh],
  );

  return <HealthContext.Provider value={value}>{children}</HealthContext.Provider>;
}

export function useHealth() {
  const ctx = useContext(HealthContext);
  if (!ctx) throw new Error("useHealth must be used within HealthProvider");
  return ctx;
}
