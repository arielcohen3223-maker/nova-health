import { getSupabase } from "../supabase";
import { config } from "../config";
import type { ChatMessage, MealAnalysis } from "../types/health";
import { appendLocalChat, loadLocalChat, saveLocalMeal } from "../storage/localStore";
import { localNovaReply, simulateMealAnalysis } from "../demo/localEngine";

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
  userId?: string | null,
): Promise<string> {
  const remote = await invokeFunction<{ reply: string }>("nova-chat", {
    message,
    locale,
    context,
  });
  if (remote?.reply) {
    await appendLocalChat("user", message);
    await appendLocalChat("assistant", remote.reply);
    if (userId && userId !== "demo-user") {
      await saveChatMessage(userId, "user", message);
      await saveChatMessage(userId, "assistant", remote.reply);
    }
    return remote.reply;
  }

  const reply = localNovaReply(message, locale, context?.metricsSummary);
  await appendLocalChat("user", message);
  await appendLocalChat("assistant", reply);
  return reply;
}

export async function analyzeMealImage(
  base64: string,
  locale: "he" | "en",
  userId?: string | null,
): Promise<MealAnalysis> {
  const remote = await invokeFunction<MealAnalysis>("analyze-meal", { image: base64, locale });
  const meal = remote?.dishName ? remote : simulateMealAnalysis(locale);
  await saveLocalMeal(meal);
  if (userId && userId !== "demo-user") await saveMealLog(userId, meal);
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
