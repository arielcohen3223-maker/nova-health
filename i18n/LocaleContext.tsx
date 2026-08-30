import React, { createContext, useContext, useMemo, useState } from "react";
import { I18nManager } from "react-native";
import { Locale, translations, TranslationKeys } from "./translations";

type LocaleContextValue = {
  locale: Locale;
  t: TranslationKeys;
  isRtl: boolean;
  toggleLocale: () => void;
  setLocale: (locale: Locale) => void;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("he");

  const setLocale = (next: Locale) => {
    setLocaleState(next);
    const rtl = next === "he";
    I18nManager.allowRTL(rtl);
    if (I18nManager.isRTL !== rtl) {
      I18nManager.forceRTL(rtl);
    }
  };

  const toggleLocale = () => setLocale(locale === "he" ? "en" : "he");

  const value = useMemo(
    () => ({
      locale,
      t: translations[locale],
      isRtl: locale === "he",
      toggleLocale,
      setLocale,
    }),
    [locale]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}
