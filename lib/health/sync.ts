import { getSupabase } from "../supabase";
import type { HealthMetrics } from "../types/health";

export async function syncMetricsToSupabase(userId: string, metrics: HealthMetrics): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  await supabase.from("health_snapshots").insert({
    user_id: userId,
    recorded_at: metrics.recordedAt,
    resting_hr: metrics.restingHr,
    hrv: metrics.hrv,
    sleep_hours: metrics.sleepHours,
    steps: metrics.steps,
    body_temp: metrics.bodyTemp,
    stress_score: metrics.stressScore,
    source: metrics.source,
  });
}

export async function loadLatestFromSupabase(userId: string): Promise<HealthMetrics | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("health_snapshots")
    .select("*")
    .eq("user_id", userId)
    .order("recorded_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;

  return {
    restingHr: data.resting_hr,
    hrv: data.hrv,
    sleepHours: data.sleep_hours,
    steps: data.steps,
    bodyTemp: data.body_temp,
    stressScore: data.stress_score,
    recordedAt: data.recorded_at,
    source: "supabase",
  };
}

export async function updateLearningDays(userId: string, days: number): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  await supabase.from("profiles").update({ learning_days: days, updated_at: new Date().toISOString() }).eq("id", userId);
}
