import { getSupabase } from "../supabase";
import { config } from "../config";
import type { ChatMessage, MealAnalysis } from "../types/health";
import { appendLocalChat, loadLocalChat, saveLocalMeal } from "../storage/localStore";
import { localNovaReply, simulateMealAnalysis } from "../demo/localEngine";

export type AiInvokeResult<T> = { data: T | null; error: string | null; needsAuth: boolean };

async function invokeFunction<T>(name: string, body: Record<string, unknown>): Promise<AiInvokeResult<T>> {
  const supabase = getSupabase();
  if (!supabase || !config.isConfigured) {
    return { data: null, error: "not_configured", needsAuth: false };
  }
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) {
    const msg = error.message ?? String(error);
    const needsAuth = /401|unauthorized|jwt/i.test(msg);
    return { data: null, error: msg, needsAuth };
  }
  return { data: data as T, error: null, needsAuth: false };
}

export async function askNova(
  message: string,
  locale: "he" | "en",
  context?: { metricsSummary?: string },
  userId?: string | null,
): Promise<string> {
  const remote = await invokeFunction<{ reply: string }>("nova-chat", {
    message,
    locale,
    context,
  });
  if (remote.data?.reply) {
    await appendLocalChat("user", message);
    await appendLocalChat("assistant", remote.data.reply);
    return remote.data.reply;
  }

  const reply = localNovaReply(message, locale, context?.metricsSummary);
  await appendLocalChat("user", message);
  await appendLocalChat("assistant", reply);
  return reply;
}

export type MealAnalysisResult = MealAnalysis & {
  source: "openai" | "demo";
  hint?: "needs_auth" | "needs_openai" | null;
};

export async function analyzeMealImage(
  base64: string,
  locale: "he" | "en",
  userId?: string | null,
): Promise<MealAnalysisResult> {
  const remote = await invokeFunction<MealAnalysis>("analyze-meal", { image: base64, locale });
  if (remote.data?.dishName) {
    const meal: MealAnalysisResult = { ...remote.data, source: "openai", hint: null };
    await saveLocalMeal(meal);
    return meal;
  }
  const hint = remote.needsAuth ? "needs_auth" : remote.error ? "needs_openai" : null;
  const meal: MealAnalysisResult = { ...simulateMealAnalysis(locale), source: "demo", hint };
  await saveLocalMeal(meal);
  return meal;
}

export async function saveChatMessage(userId: string, role: "user" | "assistant", content: string) {
  const supabase = getSupabase();
  if (!supabase) return;
  await supabase.from("chat_messages").insert({ user_id: userId, role, content });
}

export async function loadChatHistory(userId: string | null): Promise<ChatMessage[]> {
  if (!userId || userId === "demo-user") return loadLocalChat();

  const supabase = getSupabase();
  if (!supabase) return loadLocalChat();

  const { data } = await supabase
    .from("chat_messages")
    .select("id, role, content")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(40);

  const cloud = (data ?? []) as ChatMessage[];
  if (cloud.length) return cloud;
  return loadLocalChat();
}

export async function saveMealLog(userId: string, meal: MealAnalysis) {
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
