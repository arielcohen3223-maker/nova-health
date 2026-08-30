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

### א. צרי פרויקט
1. [supabase.com/dashboard](https://supabase.com/dashboard) → **New project**
2. שמרי את **Project URL** ו-**anon key** (Settings → API)

### ב. הריצי SQL (פעם אחת)
**SQL Editor** → הדביקי את כל הקובץ `supabase/full_setup.sql` → **Run**

### ג. Auth URLs
**Authentication → URL Configuration:**
- Site URL: `https://nova-health-eight.vercel.app`
- Redirect URLs: `https://nova-health-eight.vercel.app/**`

**Authentication → Providers → Email** — ודאי ש-Email מופעל.

> לבדיקות קלות: **Authentication → Email → Confirm email** — כבוי (אפשר להפעיל בפרודקשן).

### ד. מפתחות ב-Vercel
**Settings → Environment Variables:**

| Name | Value |
|------|--------|
| `EXPO_PUBLIC_SUPABASE_URL` | `https://xxxx.supabase.co` |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` |
| `EXPO_PUBLIC_DEMO_MODE` | `true` (בינתיים — האפליקציה עובדת בלי login) |

→ **Deployments → Redeploy**

### ה. Edge Functions + OpenAI
```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase secrets set OPENAI_API_KEY=sk-...
npm run functions:deploy
```

**או** הריצי בטרמינל: `npm run setup:supabase` — הסקריפט יבקש מפתחות ויכין `.env` מקומי.

כשהכל עובד — **מחקי** `EXPO_PUBLIC_DEMO_MODE` מ-Vercel והפעילי login אמיתי.

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
