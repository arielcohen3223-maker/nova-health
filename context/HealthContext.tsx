import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { HealthMetrics } from "../lib/types/health";
import { fetchHealthMetrics, isHealthKitAvailable, requestHealthKitPermission } from "../lib/health/healthService";
import { computeHealthScore, computeRecovery, MOCK_METRICS } from "../lib/health/metrics";
import { loadLatestFromSupabase, syncMetricsToSupabase } from "../lib/health/sync";
import { useAuth } from "./AuthContext";

type HealthContextValue = {
  metrics: HealthMetrics;
  score: number;
  recovery: number;
  loading: boolean;
  healthConnected: boolean;
  healthKitAvailable: boolean;
  connectHealth: () => Promise<boolean>;
  refresh: () => Promise<void>;
};

const HealthContext = createContext<HealthContextValue | null>(null);

export function HealthProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<HealthMetrics>(MOCK_METRICS);
  const [loading, setLoading] = useState(false);
  const [healthConnected, setHealthConnected] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      if (user?.id) {
        const cached = await loadLatestFromSupabase(user.id);
        if (cached) {
          setMetrics(cached);
          setLoading(false);
          return;
        }
      }
      const latest = await fetchHealthMetrics();
      setMetrics(latest);
      if (user?.id && latest.source !== "mock") {
        await syncMetricsToSupabase(user.id, latest);
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const connectHealth = useCallback(async () => {
    const ok = await requestHealthKitPermission();
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
