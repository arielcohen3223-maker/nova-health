import { Platform } from "react-native";
import { config } from "../config";
import { getSupabase } from "../supabase";

export type FeatureStatus = "live" | "demo" | "native_only" | "needs_setup";

export type SystemStatus = {
  auth: FeatureStatus;
  database: FeatureStatus;
  aiChat: FeatureStatus;
  mealVision: FeatureStatus;
  healthWatch: FeatureStatus;
  bloodPdf: FeatureStatus;
  subscriptions: FeatureStatus;
  platform: string;
  supabaseConfigured: boolean;
};

export function getSystemStatus(): SystemStatus {
  const supabaseConfigured = config.isConfigured;
  const native = Platform.OS === "ios" || Platform.OS === "android";
  const web = Platform.OS === "web";

  return {
    supabaseConfigured,
    platform: Platform.OS,
    auth: supabaseConfigured && config.requiresAuth ? "live" : supabaseConfigured ? "demo" : "demo",
    database: supabaseConfigured ? "live" : "demo",
    aiChat: supabaseConfigured && !config.demoMode ? "live" : supabaseConfigured ? "needs_setup" : "demo",
    mealVision: supabaseConfigured && !config.demoMode ? "live" : supabaseConfigured ? "needs_setup" : "demo",
    healthWatch: Platform.OS === "ios" ? "native_only" : Platform.OS === "android" ? "native_only" : "needs_setup",
    bloodPdf: supabaseConfigured ? "live" : "demo",
    subscriptions: native && supabaseConfigured ? "needs_setup" : "needs_setup",
  };
}

export async function uploadBloodPdf(
  userId: string | null,
  fileUri: string,
  fileName: string,
): Promise<{ ok: boolean; mode: "cloud" | "local" }> {
  const { saveLocalBloodFile } = await import("../storage/localStore");
  await saveLocalBloodFile(fileName);

  const supabase = getSupabase();
  if (!supabase || !userId || userId === "demo-user") {
    return { ok: true, mode: "local" };
  }

  try {
    const res = await fetch(fileUri);
    const blob = await res.blob();
    const path = `${userId}/${Date.now()}-${fileName}`;
    const { error } = await supabase.storage.from("blood-tests").upload(path, blob, {
      contentType: "application/pdf",
      upsert: false,
    });
    if (error) return { ok: true, mode: "local" };
    return { ok: true, mode: "cloud" };
  } catch {
    return { ok: true, mode: "local" };
  }
}
