# NOVA on Vercel — step by step

Deploy the web app so anyone can open NOVA in a browser (and "Add to Home Screen" on iPhone).

---

## Option A — GitHub import (recommended)

### 1. Open Vercel
Go to **[vercel.com/new](https://vercel.com/new)** and sign in with **GitHub**.

### 2. Import repository
- Find **`arielcohen3223-maker/nova-health`**
- Click **Import**

### 3. Project settings (should auto-detect from `vercel.json`)

| Setting | Value |
|---------|--------|
| Framework Preset | **Other** |
| Build Command | `npm run build:web` |
| Output Directory | `dist` |
| Install Command | `npm install` |

### 4. Environment Variables (required for login)

Click **Environment Variables** and add:

| Name | Value |
|------|--------|
| `EXPO_PUBLIC_SUPABASE_URL` | `https://YOUR_PROJECT.supabase.co` |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | your anon key from Supabase |

Optional (after first deploy, update with your real Vercel URL):

| Name | Value |
|------|--------|
| `EXPO_PUBLIC_PRIVACY_URL` | `https://nova-health-eight.vercel.app/legal/privacy.html` |
| `EXPO_PUBLIC_TERMS_URL` | `https://nova-health-eight.vercel.app/legal/terms.html` |

> Without Supabase keys the app runs in **demo mode** (no real accounts).

### 5. Deploy
Click **Deploy** — wait ~2–3 minutes.

Your live URL: **https://nova-health-eight.vercel.app**

> Do **not** use `nova-health.vercel.app` — that domain belongs to another project.

Your URL will be something like:
**`https://nova-health-eight.vercel.app`**

### 6. After deploy
1. Copy your Vercel URL
2. Supabase → **Authentication → URL Configuration**:
   - Site URL: your Vercel URL
   - Redirect URLs: `https://nova-health-eight.vercel.app/**`
3. Update privacy/terms env vars with your URL → **Redeploy**

---

## Option B — CLI (terminal)

```powershell
cd "C:\Users\אריאל\Documents\Codex\2026-07-29\files-mentioned-by-the-user-build\outputs\nova"
npx vercel login
npx vercel --prod
```

Follow prompts. Add env vars in [vercel.com/dashboard](https://vercel.com/dashboard) → Project → Settings → Environment Variables.

---

## Custom domain (optional)

Vercel Dashboard → Project → **Domains** → add e.g. `app.nova.health`

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Build fails | Check build logs; run `npm run build:web` locally |
| Login doesn't work | Add Supabase env vars + redirect URLs |
| Legal pages 404 | `vercel.json` includes `/legal/*`; redeploy latest commit |
| Old UI | Hard refresh Ctrl+F5 |

---

## What users get

- Full NOVA web app (Hebrew + English)
- Sign up / login (with Supabase)
- Dashboard, chat, meals, settings
- Privacy policy at `/legal/privacy.html`

For **App Store download**, use TestFlight separately — see `LAUNCH.md`.
