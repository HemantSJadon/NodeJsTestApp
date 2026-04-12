# SSB Lecturette Prep — Deployment Guide

## Overview

This app requires:
1. **Vercel** — for hosting (you already have an account)
2. **Supabase** — for persistent AI response cache (free tier, ~2 min setup)
3. **Anthropic API Key** — for Claude AI (you will provide this)

---

## Step 1: Set Up Supabase (5 minutes)

### 1.1 Create Supabase Account & Project
1. Go to [supabase.com](https://supabase.com) → Sign Up (free)
2. Click **New Project**
3. Set a project name: `ssb-lecturette-prep`
4. Set a strong database password (save this somewhere)
5. Choose your region (closest to you — e.g., Southeast Asia)
6. Click **Create new project** — wait ~2 minutes for setup

### 1.2 Create the Database Table
1. In Supabase dashboard, go to **SQL Editor** (left sidebar)
2. Click **New Query**
3. Copy and paste the contents of `docs/supabase-setup.sql`
4. Click **Run** (green button)
5. You should see: `Setup complete! topic_cache table created.`

### 1.3 Get Your API Keys
1. Go to **Project Settings** (gear icon, left sidebar)
2. Click **API**
3. Copy these two values — you'll need them:
   - **Project URL** (looks like `https://xxxx.supabase.co`)
   - **service_role** key (under "Project API keys" — the long one labeled `service_role`)

> ⚠️ The `service_role` key has full database access. Never expose it in frontend code. In this app, it's only used server-side.

---

## Step 2: Deploy to Vercel (5 minutes)

### 2.1 Connect Repository
1. Go to [vercel.com](https://vercel.com) → Log In
2. Click **Add New** → **Project**
3. Import from GitHub: Select `hemantsjadon/nodejstestapp`
4. In **Root Directory** — click **Edit** and set to: `ai-learning-platform`
5. Framework should auto-detect as **Next.js** ✓

### 2.2 Set Environment Variables
Before deploying, add these environment variables in Vercel:

| Variable Name | Value | Notes |
|---|---|---|
| `ANTHROPIC_API_KEY` | `sk-ant-...` | Your Claude API key |
| `SUPABASE_URL` | `https://xxxx.supabase.co` | From Supabase Step 1.3 |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` | From Supabase Step 1.3 |

**How to add them:**
1. In the Vercel import screen, expand **Environment Variables**
2. Add each variable one by one
3. Make sure all 3 are added before clicking Deploy

### 2.3 Deploy
1. Click **Deploy**
2. Wait 2-3 minutes for the build
3. Your app will be live at: `https://your-app-name.vercel.app`

---

## Step 3: Verify Deployment

1. Open your Vercel URL
2. You should see the SSB Lecturette Prep homepage with all 203 topics
3. Click on any topic (e.g., **Pollution**)
4. Phase 1 (Intel Brief) should load and show "Generating..." then display content
5. The first load takes ~10-15 seconds (Claude is generating)
6. Subsequent loads for the same topic/phase will be instant (from Supabase cache)

---

## Environment Variables Reference

```env
# Required — Claude API key
ANTHROPIC_API_KEY=sk-ant-...

# Required — Supabase connection
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Optional — auto-set by Vercel
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

---

## How Caching Works

| Phase | Cached? | Where | Notes |
|---|---|---|---|
| Phase 1 — Intel Brief | ✅ Yes | Supabase + localStorage | Same for all users |
| Phase 2 — Model Script | ✅ Yes | Supabase + localStorage | Same for all users |
| Phase 3 — Concept Fire Q&A | ✅ Yes | Supabase + localStorage | Same for all users |
| Phase 4 — Live Mock | ❌ No | Not cached | User's delivery is unique |
| Phase 5 — Weak Point Fix | ❌ No | Not cached | Based on user's Phase 4 |
| Progress tracking | Browser | localStorage | Per-device |

**First visit to a topic**: Claude generates content (~10-15 seconds), stores in Supabase.
**All future visits** (by anyone): Instant load from Supabase cache.

---

## Updating the App

Push changes to branch `claude/ai-learning-platform-BXG12` — Vercel auto-deploys.

To force-regenerate a cached topic: Click the refresh icon (↻) in the phase header.

---

## Troubleshooting

| Issue | Solution |
|---|---|
| "Missing ANTHROPIC_API_KEY" error | Check Vercel env vars — make sure key starts with `sk-ant-` |
| "Missing SUPABASE_URL" error | Check Vercel env vars — ensure no trailing slash |
| Phase content not loading | Check Vercel function logs (Vercel dashboard → Deployments → Functions) |
| Cache not persisting | Verify Supabase table was created (run SQL again) |
| App not found at URL | Check Root Directory is set to `ai-learning-platform` in Vercel |
