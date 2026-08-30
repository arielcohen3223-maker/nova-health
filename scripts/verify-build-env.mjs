/** Checks public env vars are present at Vercel build time (no secrets logged). */
const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() ?? "";
const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";
const demo = process.env.EXPO_PUBLIC_DEMO_MODE === "true";

console.log("[nova build] EXPO_PUBLIC_SUPABASE_URL:", url ? "set" : "missing");
console.log("[nova build] EXPO_PUBLIC_SUPABASE_ANON_KEY:", key ? "set" : "missing");
console.log("[nova build] EXPO_PUBLIC_DEMO_MODE:", demo ? "true" : "false");

if (!url || !key) {
  console.warn("[nova build] Supabase env missing — app will run in local demo mode.");
}
