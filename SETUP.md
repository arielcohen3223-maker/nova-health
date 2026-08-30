# NOVA — Setup Guide (כל הפיצ'רים)

מדריך זה מסביר איך להפעיל את **כל** יכולות NOVA: דמו מקומי, ענן (Supabase), AI, ו-build native לשעון.

**כתובת PWA חיה:** https://nova-health-eight.vercel.app

---

## מה עובד כבר עכשיו (בלי הגדרה)

| פיצ'ר | Web / PWA | הערות |
|--------|-----------|--------|
| כל המסכים וה-UI | ✅ | עברית + אנגלית, RTL |
| דשבורד ומדדים | ✅ | נתוני דמו + שמירה מקומית |
| צ'אט NOVA | ✅ | תשובות חכמות מקומיות (דמו) |
| צילום ארוחה | ⚠️ | מצלמה בדפדפן / native |
| העלאת PDF דם | ✅ | נשמר מקומית |
| הגדרות + סטטוס מערכת | ✅ | רואים מה פעיל ומה דורש הגדרה |

---

## שלב 1 — Supabase (15 דקות) → Auth + ענן + AI

1. צרי פרויקט ב-[supabase.com](https://supabase.com)
2. **SQL Editor** — הריצי לפי סדר:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_meals_chat.sql`
   - `supabase/migrations/003_storage.sql`
3. **Edge Functions** — פרסי:
   - `supabase/functions/nova-chat`
   - `supabase/functions/analyze-meal`
4. **Secrets** (Settings → Edge Functions):
   ```
   OPENAI_API_KEY=sk-...
   ```
5. **Vercel** → Project → Settings → Environment Variables:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   ```
6. Redeploy ב-Vercel

אחרי זה: התחברות, סנכרון צ'אט/ארוחות/דם לענן, AI אמיתי.

---

## שלב 2 — בדיקה מקומית

```bash
npm install
cp .env.example .env   # מלאי מפתחות Supabase
npm start              # Expo — סרקי QR בטלפון
npm run web            # דפדפן
npm run build:web      # build ל-Vercel
```

---

## שלב 3 — שעון חכם (native בלבד)

| פלטפורמה | דרישה |
|----------|--------|
| **iPhone + Apple Watch** | `eas build --platform ios --profile preview` + Apple Developer ($99) |
| **Galaxy + Health Connect** | `eas build --platform android --profile preview` + APK |

HealthKit / Health Connect **לא** עובדים בדפדפן — רק באפליקציה native.

---

## שלב 4 — מנוי Pro (RevenueCat)

1. חשבון ב-[revenuecat.com](https://www.revenuecat.com)
2. מוצרים ב-App Store Connect / Google Play
3. הוסיפי ל-`.env`:
   ```
   EXPO_PUBLIC_REVENUECAT_IOS_KEY=...
   EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=...
   ```
4. Build production: `eas build --profile production`

---

## איפה לראות סטטוס?

**הגדרות → סטטוס מערכת** — מציג לכל פיצ'ר: פעיל / דמו / native / דורש הגדרה.

---

## קישורים

| משאב | URL |
|------|-----|
| GitHub | https://github.com/arielcohen3223-maker/nova-health |
| PWA | https://nova-health-eight.vercel.app |
| Privacy | https://nova-health-eight.vercel.app/legal/privacy.html |
| Terms | https://nova-health-eight.vercel.app/legal/terms.html |

---

## אבטחה

- ודאי שה-repo ב-GitHub **Private**
- אל תשתפי מפתחות API בצ'אט או ב-commit
- ב-Vercel — Environment Variables בלבד, לא בקוד
