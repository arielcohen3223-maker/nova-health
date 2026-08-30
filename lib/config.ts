const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() ?? "";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";
const demoMode = process.env.EXPO_PUBLIC_DEMO_MODE === "true";

export const config = {
  supabaseUrl,
  supabaseAnonKey,
  /** Backend is wired — auth required unless demo mode */
  isConfigured: Boolean(supabaseUrl && supabaseAnonKey),
  /** Skip login for local UI testing */
  demoMode,
  requiresAuth: Boolean(supabaseUrl && supabaseAnonKey) && !demoMode,
} as const;
