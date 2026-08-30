import type { HealthMetrics } from "../types/health";

/** Demo baseline — replaced by HealthKit / Supabase when connected */
export const MOCK_METRICS: HealthMetrics = {
  restingHr: 58,
  hrv: 74,
  sleepHours: 7.7,
  steps: 8400,
  bodyTemp: 36.4,
  stressScore: 32,
  recordedAt: new Date().toISOString(),
  source: "mock",
};

export function computeHealthScore(m: HealthMetrics): number {
  const parts: number[] = [];
  if (m.restingHr != null) parts.push(clamp(100 - Math.abs(m.restingHr - 60) * 2, 60, 98));
  if (m.hrv != null) parts.push(clamp(m.hrv, 50, 95));
  if (m.sleepHours != null) parts.push(clamp(m.sleepHours * 11, 55, 98));
  if (m.stressScore != null) parts.push(clamp(100 - m.stressScore, 50, 95));
  if (!parts.length) return 75;
  return Math.round(parts.reduce((a, b) => a + b, 0) / parts.length);
}

export function computeRecovery(m: HealthMetrics): number {
  const hrvPart = m.hrv != null ? clamp(m.hrv * 1.1, 40, 95) : 70;
  const sleepPart = m.sleepHours != null ? clamp(m.sleepHours * 11, 40, 95) : 70;
  const stressPart = m.stressScore != null ? clamp(100 - m.stressScore * 0.8, 40, 95) : 70;
  return Math.round((hrvPart + sleepPart + stressPart) / 3);
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function formatSleep(hours: number | null): string {
  if (hours == null) return "—";
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}:${String(m).padStart(2, "0")}`;
}

export function formatSteps(steps: number | null): string {
  if (steps == null) return "—";
  return steps.toLocaleString();
}
