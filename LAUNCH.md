# NOVA — Launch checklist (download-ready)

## ✅ Done in code
- App icons (1024) + splash + favicon
- `app.config.js` — iOS/Android/Web store metadata
- Privacy + Terms (HTML at `/legal/*`)
- Terms checkbox on signup
- EAS profiles: preview (TestFlight) + production
- Store listing copy (`store/listing.json`)
- Apple Privacy Manifest

## 🔲 You must do (accounts)

### A. Supabase (~15 min) — required for real users
1. [supabase.com](https://supabase.com) → new project
2. Run SQL migrations `001` + `002`
3. Enable Email auth
4. Add to Vercel env: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`

### B. Vercel (~10 min) — Web download / PWA
1. [vercel.com](https://vercel.com) → Import `nova-health` repo
2. Add env vars (Supabase + legal URLs)
3. Deploy → share link

### C. TestFlight (~1 week) — iPhone download
1. Apple Developer $99/yr → [developer.apple.com](https://developer.apple.com)
2. `npm i -g eas-cli && eas login && eas init`
3. `eas build --platform ios --profile preview`
4. App Store Connect → TestFlight → invite testers

### D. App Store (~2–4 weeks after TestFlight)
1. 3–5 screenshots → `store/screenshots/` (see README there)
2. `eas build --platform ios --profile production`
3. `eas submit --platform ios`
4. Fill App Store Connect using `store/listing.json`

### E. Security
- GitHub repo → **Private** (Settings → Danger zone)
- Revoke any tokens shared in chat
- Never commit `.env`

## Fastest path for first 50 users
**TestFlight (iOS)** + **Vercel (Web)** in parallel this week.
