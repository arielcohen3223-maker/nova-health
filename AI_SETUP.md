# הפעלת AI אמיתי לצילום ארוחות (3 שלבים)

## שלב 1 — OpenAI (~5 דק)

1. https://platform.openai.com → **API keys** → **Create**
2. שמרי: `sk-...`
3. **Billing** → הוסיפי אשראי (כמה $ מספיקים)

## שלב 2 — Supabase Secrets (~3 דק)

**Dashboard** → פרויקט **nova-health** → **Edge Functions** → **Manage secrets**

| Name | Value |
|------|--------|
| `OPENAI_API_KEY` | `sk-...` |

(או בטרמינל אחרי `npx supabase login`:)
```powershell
npx supabase secrets set OPENAI_API_KEY=sk-XXXX --project-ref akylkwiejwumicjchlbe
npm run functions:deploy
```

## שלב 3 — Login באפליקציה (~3 דק)

### Supabase
**Authentication → Providers → Email** — ON  
**Authentication → Email → Confirm email** — **OFF** (לבדיקות)  
**URL Configuration:**
- Site URL: `https://nova-health-eight.vercel.app`
- Redirect: `https://nova-health-eight.vercel.app/**`

### Vercel
**Settings → Environment Variables** → **מחקי** `EXPO_PUBLIC_DEMO_MODE`  
**Deployments → Redeploy**

### בטלפון
1. פתchi https://nova-health-eight.vercel.app
2. **הרשמה** → אימייל + סיסמה (8+ תווים)
3. **☰ → ארוחה** → צלמי/בחרי תמונה
4. אמור להופיע: **"ניתוח AI אמיתי ✓"** + שם מנה וקלוריות לפי התמונה

---

## בדיקה ב-Supabase
**Table Editor → meals** — רשומה חדשה אחרי כל צילום.

## עלות משוערת
~$0.01–0.03 לכל תמונה (gpt-4o-mini + vision).
