import { getSupabase } from "../supabase";
import { config } from "../config";
import type { ChatMessage, MealAnalysis } from "../types/health";

const DEMO_MEAL: MealAnalysis = {
  dishName: "Shakshuka & salad",
  calories: 420,
  proteinG: 18,
  fatG: 32,
  carbsG: 24,
  insight: "Medium-heavy evening meal — may affect sleep quality and morning HRV.",
};

const DEMO_REPLY =
  "Based on your data: sleep was 22% below baseline, HRV dipped 11%, and yesterday's heavier dinner was logged. Try 3 minutes of breathing and an earlier bedtime tonight.";

async function invokeFunction<T>(name: string, body: Record<string, unknown>): Promise<T | null> {
  const supabase = getSupabase();
  if (!supabase || !config.isConfigured) return null;
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) return null;
  return data as T;
}

export async function askNova(
  message: string,
  locale: "he" | "en",
  context?: { metricsSummary?: string },
): Promise<string> {
  const remote = await invokeFunction<{ reply: string }>("nova-chat", {
    message,
    locale,
    context,
  });
  if (remote?.reply) return remote.reply;
  return DEMO_REPLY;
}

export async function analyzeMealImage(
  base64: string,
  locale: "he" | "en",
): Promise<MealAnalysis> {
  const remote = await invokeFunction<MealAnalysis>("analyze-meal", { image: base64, locale });
  if (remote?.dishName) return remote;
  return { ...DEMO_MEAL, dishName: locale === "he" ? "שקשוקה וסלט" : DEMO_MEAL.dishName };
}

export async function saveChatMessage(userId: string, role: "user" | "assistant", content: string) {
  const supabase = getSupabase();
  if (!supabase) return;
  await supabase.from("chat_messages").insert({ user_id: userId, role, content });
}

export async function loadChatHistory(userId: string): Promise<ChatMessage[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data } = await supabase
    .from("chat_messages")
    .select("id, role, content")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(40);
  return (data ?? []) as ChatMessage[];
}

export async function saveMealLog(
  userId: string,
  meal: MealAnalysis,
) {
  const supabase = getSupabase();
  if (!supabase) return;
  await supabase.from("meals").insert({
    user_id: userId,
    dish_name: meal.dishName,
    calories: meal.calories,
    protein_g: meal.proteinG,
    fat_g: meal.fatG,
    carbs_g: meal.carbsG,
    insight: meal.insight,
  });
}
