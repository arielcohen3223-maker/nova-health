# NOVA — Production launch checklist

## Architecture

```
App (Expo)
 ├── Supabase Auth + Postgres (profiles, health_snapshots, meals, chat)
 ├── Edge Functions (nova-chat, analyze-meal) → OpenAI
 ├── Apple HealthKit (iOS native build)
 └── RevenueCat (subscriptions, iOS/Android)
```

---

## Step 1 — Supabase (~20 min)

1. Create project at [supabase.com](https://supabase.com)
2. **SQL Editor** — run in order:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_meals_chat.sql`
3. **Authentication → Providers** → Enable Email
4. **Authentication → URL Configuration**:
   - Site URL: your Vercel URL
   - Redirect URLs: `http://localhost:8081`, `https://YOUR-APP.vercel.app/**`, `nova://**`
5. Copy API keys → `.env` (see `.env.example`)

### Deploy Edge Functions (AI)

Install [Supabase CLI](https://supabase.com/docs/guides/cli), then:

```powershell
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase secrets set OPENAI_API_KEY=sk-your-key
npm run functions:deploy
```

Without OpenAI key, functions return demo responses (works for testing).

---

## Step 2 — Web deploy (fastest public access)

### Vercel

1. Install Git, push project to GitHub
2. [vercel.com](https://vercel.com) → Import
3. Add env vars: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

### Local

```powershell
npm install
npm run build:web
npx serve dist -l 8087
```

---

## Step 3 — iOS + HealthKit + TestFlight

HealthKit **does not work in Expo Go** — requires a dev/production build.

```powershell
npm install -g eas-cli
eas login
eas init                    # updates app.json projectId
eas build --platform ios --profile preview   # TestFlight internal
eas build --platform ios --profile production
eas submit --platform ios
```

Update `eas.json` with your Apple ID and App Store Connect app ID.

**On device:** Settings → NOVA → Connect Apple Health

---

## Step 4 — RevenueCat (subscriptions)

1. [app.revenuecat.com](https://app.revenuecat.com) → New project
2. Add iOS + Android apps (bundle: `health.nova.app`)
3. Create entitlement: `pro` or `nova_pro`
4. Create offering + monthly package
5. Add keys to `.env`:
   - `EXPO_PUBLIC_REVENUECAT_IOS_KEY`
   - `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY`
6. Rebuild native app (`eas build`)

---

## Step 5 — Android (Play Store internal testing)

```powershell
eas build --platform android --profile production
eas submit --platform android
```

Add `google-play-service-account.json` for submit (see `eas.json`).

---

## Environment modes

| Mode | Config |
|------|--------|
| Demo (local UI) | `EXPO_PUBLIC_DEMO_MODE=true` |
| Production | Supabase keys set, demo mode **off** |
| AI enabled | `OPENAI_API_KEY` in Supabase secrets |

---

## What's implemented in code

- Email auth (signup / login / logout)
- Health metrics sync (HealthKit → Supabase)
- Live dashboard from real or mock data
- Meal photo → AI analysis (camera + Edge Function)
- NOVA chat → Edge Function + OpenAI
- Blood test PDF picker
- Settings: Health connect, subscription, privacy policy
- RevenueCat Pro upgrade flow (native builds)

---

## Still needed for full market launch

- Legal review of privacy policy (placeholder in app)
- Apple App Store review (health app guidelines)
- Garmin / Health Connect integration
- Blood test PDF parsing (OCR pipeline)
- Customer support email + account deletion flow
- Analytics (PostHog / Mixpanel)

---

## Recommended timeline

| Week | Goal |
|------|------|
| 1 | Supabase + Vercel live, 10 beta users on Web |
| 2 | TestFlight + HealthKit for iOS beta |
| 3 | RevenueCat Pro + first paying users |
| 4 | Garmin + blood PDF parsing |

---

Need help with a specific step? Provide Supabase URL + keys and we can wire live deployment.
