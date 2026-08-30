import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ChatMessage, MealAnalysis } from "../types/health";
import type { HealthMetrics } from "../types/health";

const KEYS = {
  chat: "@nova/chat",
  meals: "@nova/meals",
  blood: "@nova/blood",
  metrics: "@nova/metrics",
  learningDays: "@nova/learning_days",
  displayName: "@nova/display_name",
} as const;

export async function loadLocalChat(): Promise<ChatMessage[]> {
  const raw = await AsyncStorage.getItem(KEYS.chat);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as ChatMessage[];
  } catch {
    return [];
  }
}

export async function appendLocalChat(role: "user" | "assistant", content: string) {
  const history = await loadLocalChat();
  history.push({ id: `${Date.now()}-${role}`, role, content });
  const trimmed = history.slice(-40);
  await AsyncStorage.setItem(KEYS.chat, JSON.stringify(trimmed));
}

export async function saveLocalMeal(meal: MealAnalysis) {
  const raw = await AsyncStorage.getItem(KEYS.meals);
  const list: (MealAnalysis & { at: string })[] = raw ? JSON.parse(raw) : [];
  list.unshift({ ...meal, at: new Date().toISOString() });
  await AsyncStorage.setItem(KEYS.meals, JSON.stringify(list.slice(0, 30)));
}

export async function loadLocalMeals() {
  const raw = await AsyncStorage.getItem(KEYS.meals);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as (MealAnalysis & { at: string })[];
  } catch {
    return [];
  }
}

export async function saveLocalBloodFile(name: string) {
  const raw = await AsyncStorage.getItem(KEYS.blood);
  const list: { name: string; at: string }[] = raw ? JSON.parse(raw) : [];
  list.unshift({ name, at: new Date().toISOString() });
  await AsyncStorage.setItem(KEYS.blood, JSON.stringify(list.slice(0, 10)));
}

export async function loadLocalBloodFiles() {
  const raw = await AsyncStorage.getItem(KEYS.blood);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as { name: string; at: string }[];
  } catch {
    return [];
  }
}

export async function saveLocalMetrics(m: HealthMetrics) {
  await AsyncStorage.setItem(KEYS.metrics, JSON.stringify(m));
}

export async function loadLocalMetrics(): Promise<HealthMetrics | null> {
  const raw = await AsyncStorage.getItem(KEYS.metrics);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as HealthMetrics;
  } catch {
    return null;
  }
}

export async function getLearningDays(): Promise<number> {
  const v = await AsyncStorage.getItem(KEYS.learningDays);
  return v ? Number(v) : 12;
}

export async function setLearningDays(days: number) {
  await AsyncStorage.setItem(KEYS.learningDays, String(days));
}

export async function getDisplayName(): Promise<string | null> {
  return AsyncStorage.getItem(KEYS.displayName);
}

export async function setDisplayName(name: string) {
  await AsyncStorage.setItem(KEYS.displayName, name);
}
