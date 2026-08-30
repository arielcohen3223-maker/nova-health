import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { config } from "../lib/config";
import { getSupabase } from "../lib/supabase";
import { getDisplayName, getLearningDays, setDisplayName } from "../lib/storage/localStore";

export type Profile = {
  id: string;
  display_name: string | null;
  locale: "he" | "en";
  onboarding_step: "welcome" | "learning" | "active";
  learning_days: number;
};

const DEMO_USER_ID = "demo-user";

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  /** Real Supabase id or demo-user when in demo mode */
  userId: string | null;
  displayName: string | null;
  loading: boolean;
  configured: boolean;
  requiresAuth: boolean;
  isDemo: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function fetchProfile(userId: string): Promise<Profile | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (error) throw error;
  return data as Profile | null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(config.requiresAuth);

  const refreshProfile = useCallback(async () => {
    if (!session?.user?.id) {
      setProfile(null);
      return;
    }
    try {
      setProfile(await fetchProfile(session.user.id));
    } catch {
      setProfile(null);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    if (!config.requiresAuth) {
      let mounted = true;
      (async () => {
        const [name, days] = await Promise.all([getDisplayName(), getLearningDays()]);
        if (!mounted) return;
        setProfile({
          id: DEMO_USER_ID,
          display_name: name ?? (config.demoMode ? "Guest" : "Noa"),
          locale: "he",
          onboarding_step: days >= 28 ? "active" : "learning",
          learning_days: days,
        });
        setLoading(false);
      })();
      return () => {
        mounted = false;
      };
    }

    const supabase = getSupabase();
    if (!supabase) {
      setLoading(false);
      return;
    }

    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setLoading(false);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (session?.user?.id) refreshProfile();
    else setProfile(null);
  }, [session?.user?.id, refreshProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase not configured");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signUp = useCallback(async (email: string, password: string, displayName: string) => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase not configured");
    if (displayName.trim()) await setDisplayName(displayName.trim());
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName.trim() || undefined } },
    });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    await supabase.auth.signOut();
    setProfile(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      session,
      profile,
      userId: session?.user?.id ?? profile?.id ?? null,
      displayName:
        profile?.display_name ??
        (session?.user?.user_metadata?.display_name as string | undefined) ??
        null,
      loading,
      configured: config.isConfigured,
      requiresAuth: config.requiresAuth,
      isDemo: !config.requiresAuth || !session,
      signIn,
      signUp,
      signOut,
      refreshProfile,
    }),
    [session, profile, loading, signIn, signUp, signOut, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
