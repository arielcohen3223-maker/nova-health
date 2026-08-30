export type HealthSource = "healthkit" | "health_connect" | "mock" | "supabase";

export type HealthMetrics = {
  restingHr: number | null;
  hrv: number | null;
  sleepHours: number | null;
  steps: number | null;
  bodyTemp: number | null;
  stressScore: number | null;
  recordedAt: string;
  source: HealthSource;
};

export type MealAnalysis = {
  dishName: string;
  calories: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
  insight: string;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export type SubscriptionTier = "free" | "pro";
