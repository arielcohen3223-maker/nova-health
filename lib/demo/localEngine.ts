import type { HealthMetrics } from "../types/health";

export function localNovaReply(message: string, locale: "he" | "en", ctx?: string): string {
  const q = message.toLowerCase();
  const he = locale === "he";

  if (he && (q.includes("שינה") || q.includes("sleep"))) {
    return `בדקתי את הנתונים${ctx ? ` (${ctx})` : ""}: השינה הייתה מתחת לבסיס האישי שלך. נסי ללכת לישון 30 דקות מוקדם יותר — זה משפיע על HRV בבוקר.`;
  }
  if (!he && q.includes("sleep")) {
    return `I checked your data${ctx ? ` (${ctx})` : ""}: sleep was below your personal baseline. Try going to bed 30 minutes earlier — it affects morning HRV.`;
  }
  if (he && (q.includes("עייפ") || q.includes("tired"))) {
    return "שילוב של שינה קצרה, HRV נמוך וארוחת ערב כבדה (אם צולמה) מסביר את העייפות. נשימות 3 דקות + שינה מוקדמת יכולים לעזור.";
  }
  if (he && (q.includes("שתנה") || q.includes("change"))) {
    return "בימים האחרונים: HRV ירד מעט, פעילות עלתה, ולפחות ארוחה אחת נרשמה. NOVA מסבירה לפני שמתריעה — אין סיבה לדאגה כרגע.";
  }
  if (he && (q.includes("אוכל") || q.includes("eat"))) {
    return "העדפה: ארוחת ערב קלה, חלבון + ירקות. אם צילמת ארוחה — NOVA מוסיפה אותה כהקשר, לא כדיאטה.";
  }
  if (he) {
    return `על בסיס הנתונים שלך${ctx ? `: ${ctx}` : ""}. הגוף במגמה יציבה. שאלי על שינה, עייפות, או מה השתנה — ואסביר בפירוט.`;
  }
  return `Based on your data${ctx ? `: ${ctx}` : ""}. Your body trend is stable. Ask about sleep, tiredness, or what changed for a detailed explanation.`;
}

export function simulateMealAnalysis(locale: "he" | "en"): import("../types/health").MealAnalysis {
  if (locale === "he") {
    return {
      dishName: "שקשוקה וסלט",
      calories: 420,
      proteinG: 18,
      fatG: 32,
      carbsG: 24,
      insight: "ארוחת ערב בינונית-כבדה — ייתכן השפעה על איכות שינה ו-HRV בבוקר.",
    };
  }
  return {
    dishName: "Shakshuka & salad",
    calories: 420,
    proteinG: 18,
    fatG: 32,
    carbsG: 24,
    insight: "Medium-heavy evening meal — may affect sleep quality and morning HRV.",
  };
}

export async function applyManualHealthEntry(partial: Partial<HealthMetrics>): Promise<HealthMetrics> {
  const { loadLocalMetrics, saveLocalMetrics } = await import("../storage/localStore");
  const { MOCK_METRICS } = await import("../health/metrics");
  const prev = (await loadLocalMetrics()) ?? { ...MOCK_METRICS, recordedAt: new Date().toISOString() };
  const next = { ...prev, ...partial, recordedAt: new Date().toISOString(), source: "manual" as const };
  await saveLocalMetrics(next);
  return next;
}
