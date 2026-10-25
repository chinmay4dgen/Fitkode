# Coaching Platform Diagnostic Audit & Zero-Cost Recovery Plan

> **User Review & Critical Decisions**
> - **Immediate Execution Scope ($0 Non-Paid Fixes Only)**: Every root cause behind your database stopping every ~7 minutes and member updates being invisible to the coach is caused by **architectural and SQL bugs**, not genuine traffic limits. We will fix **100% of these issues for $0** on your existing Supabase Free Tier and Vercel Hobby accounts first.
> - **Eliminating Local Disk & Browser-Only Silos**: Member check-ins, onboarding data, meal plans, and workout plans currently write to temporary server disk files and isolated browser storage (`localStorage`), which vanish across devices. We will migrate all of these into your existing **Supabase Free Tier PostgreSQL database**.
> - **Stopping the 7-Minute Database Freeze for $0**: The database hangs and prompts for paid compute because of an **infinite recursion loop in your Row-Level Security (RLS) policy** and **uncompressed 50MB base64 photos**. Fixing the SQL policy and compressing photos on the client side before uploading to Supabase's free 1GB storage bucket will immediately drop CPU and memory usage to near zero.
> - **Paid Upgrades Deferred**: Paid infrastructure ($25–$32/mo) is strictly segregated at the bottom of this plan for future reference when you scale beyond 50+ active paying clients.

---

## 1. Overview & Core Concept

Your coaching platform is experiencing two critical failure modes even with just one or two users:
1. **Supabase stops responding every ~7 minutes and demands a paid compute upgrade.**
2. **Member updates (onboarding, weekly check-ins, progress photos, and plans) are invisible to the coach across devices.**

A deep audit reveals that **neither issue requires paying for a higher tier right now**. Instead, the app is accidentally sabotaging your free tier limits through four code-level flaws:
- **Infinite SQL Policy Recursion**: When an admin queries `profiles`, the RLS policy checks if the user is an admin by querying `profiles` again—which triggers the same RLS policy recursively until Postgres exhausts CPU and connection slots.
- **Split-Brain Ephemeral Storage**: When a client submits an update on their phone, the app saves it to their phone's `localStorage` and writes a JSON file to the server's temporary container disk. Because serverless functions wipe their disk and don't share files across instances, the coach's browser never sees the client's data.
- **Uncompressed Base64 Photo Bloat**: Progress photos (up to 50MB) are converted into massive text strings and shoved directly into database rows and JSON payloads, choking network requests and rapidly filling the 500MB free database limit.
- **WebSocket Connection Leaks**: Admin pages open real-time database listeners without deduplicating or cleanly closing them on re-renders, exhausting free-tier connection slots.

---

## 2. User Experience & Operational Flow (Post-Fix)

Once the **Phase 1 ($0 Non-Paid Fixes)** are applied, the experience for both clients and the coach will work seamlessly on your existing free accounts:

- **Instant Cross-Device Visibility**: When a member completes onboarding, logs a workout, or submits a weekly check-in from their phone, it writes directly to Supabase PostgreSQL. The coach dashboard reads directly from those same tables—making updates visible immediately without manual debugging.
- **Zero-Lag Photo Uploads**: When a member selects progress photos, the browser automatically compresses and resizes them (downscaling huge 10MB camera photos to crisp ~150KB WebP/JPEG files) and uploads them to a dedicated Supabase Storage bucket, storing only the lightweight image URL in the database.
- **Stable, Always-Responsive Database**: With the recursive RLS loop replaced by a non-recursive `SECURITY DEFINER` check and WebSocket channels properly managed, database CPU usage stays flat (<2% with 1–10 users), eliminating the 7-minute lockups and "Upgrade Compute" prompts.

---

## 3. Key Product Decisions: Non-Paid Direct Fixes vs. Paid Upgrades

To ensure you spend **$0 today** while resolving every functional bug, the remediation is strictly divided into **Track A (Non-Paid Direct Code & SQL Fixes — What We Will Build Now)** and **Track B (Paid Infrastructure Upgrades — Deferred Until Commercial Scale)**.

### Track A: Non-Paid Direct Fixes ($0 Cost — Immediate Execution Plan)

| Bug / Failure Symptom | Root Cause in Current App | $0 Non-Paid Direct Fix (Immediate Action) |
| :--- | :--- | :--- |
| **Database freezes every ~7 mins & asks for paid plan** | `profiles` admin RLS policy queries `profiles` inside itself, causing infinite CPU recursion on every query. | Replace recursive SQL policy with a `SECURITY DEFINER` helper function (`public.is_admin()`) that checks admin status once without re-triggering RLS. |
| **Member onboarding & profile edits don't show up cleanly** | Client writes to local browser state and triggers redundant background sync loops that fail when RLS times out. | Streamline `profiles` reads/writes to use a single authoritative Supabase upsert with proper conflict handling and zero recursive triggers. |
| **Weekly check-ins, meal plans & workouts invisible to coach** | Saved only in the user's browser `localStorage` and temporary server disk files—never saved to Supabase tables. | Create `weekly_checkins`, `meal_plans`, and `workout_plans` tables (or structured JSONB columns) in your existing **Supabase Free Tier DB** and wire the UI directly to Supabase. |
| **Database storage & memory choking on photo uploads** | 50MB express payload limit + storing raw base64 image strings inside database rows and JSON state. | Compress images client-side via HTML5 Canvas (<200KB max) and upload to **Supabase Free Storage** (1GB free tier included), saving only URLs in Postgres. |
| **Realtime channels dropping / connection exhaustion** | Multiple unguarded Supabase Realtime subscriptions opened without singleton cleanup. | Implement a single clean subscription lifecycle with proper unmount cleanup and an explicit "Refresh Data" fallback button for the coach. |
| **AI plan generation timing out on free serverless hosting** | Huge prompt payloads and slow synchronous responses risk hitting Vercel Hobby's 10-second timeout. | Optimize prompt payloads, enforce concise structured JSON schema output on fast `gemini-2.5-flash`, and allow client-triggered retries so it finishes within free limits. |

---

### Track B: Paid Upgrades (Deferred — Only Needed Later When Commercializing)

*You do **NOT** need to purchase any of these right now to fix your bugs. They are documented here solely for when you grow past a handful of beta users into a commercial business:*

| Service | Free Tier Limit (Current — $0/mo) | Paid Tier & Cost | When You Actually Need to Pay |
| :--- | :--- | :--- | :--- |
| **Supabase** | 500MB DB, 1GB Storage, pauses after 7 days of zero traffic | **Supabase Pro ($25/mo)** | Only when you have paying clients and want to prevent the 7-day inactivity sleep, need automatic daily backups, or exceed 500MB of text rows. |
| **Backend / Hosting** | Vercel Hobby ($0/mo, 10s function timeout) | **Railway / Render ($5–$7/mo)** or **Vercel Pro ($20/mo)** | Only if complex multi-week AI generations or heavy background jobs need >10 seconds of uninterrupted server execution time. |
| **Gemini API** | Free tier rate-limited requests | **Pay-As-You-Go (~$1–$2/mo)** | Only when concurrent commercial users exceed the free requests-per-minute quota. |

---

## 4. Technical Architecture & Data Strategy (Phase 1: $0 Fixes)

### Unified Zero-Cost Cloud Architecture
By removing the broken local disk layer and browser-only `localStorage` silos, all client and coach devices will communicate directly with your existing **Supabase Free Tier** instance:

```
+-----------------------+                  +-----------------------+
|   Member Device       |                  |    Coach Dashboard    |
|  (Phone / Browser)    |                  |  (Laptop / Browser)   |
+-----------+-----------+                  +-----------+-----------+
            |                                          |
            | 1. Client-side Canvas                    | 3. Instant Read/Write
            |    Photo Compression (<200KB)            |    + Clean Single
            | 2. Direct Supabase SDK                   |    Realtime Channel
            v                                          v
+------------------------------------------------------------------+
|                  SUPABASE FREE TIER ($0/MONTH)                   |
|                                                                  |
|  +------------------------------------------------------------+  |
|  | Non-Recursive RLS Gatekeeper: public.is_admin()            |  |
|  | (SECURITY DEFINER — Zero CPU Loops, Instant Auth Check)    |  |
|  +------------------------------------------------------------+  |
|                                                                  |
|  +----------------------------+  +----------------------------+  |
|  | PostgreSQL Database (500MB)|  | Supabase Storage (1GB Free)|  |
|  | - profiles (onboarding)    |  | - progress-photos bucket   |  |
|  | - weekly_checkins          |  |   (stores compressed JPEG/ |  |
|  | - meal_plans               |  |    WebP files; DB only     |  |
|  | - workout_plans            |  |    stores lightweight URL) |  |
|  +----------------------------+  +----------------------------+  |
+------------------------------------------------------------------+
```

### Step-by-Step Implementation Sequence (Phase 1 — Non-Paid Fixes Only)

1. **Step 1 — Fix the SQL Schema & Recursive RLS Policy ($0)**:
   - Update the SQL setup script and provide a clean migration block you can paste into your Supabase SQL Editor.
   - Replace the recursive `profiles` admin policy with a `SECURITY DEFINER` function `public.is_admin()` so Postgres never loops on `profiles` again.
   - Add dedicated tables in Supabase (`weekly_checkins`, `meal_plans`, `workout_plans`) with clean, non-recursive RLS policies so both the member and the coach can read and write them across devices.

2. **Step 2 — Rewire Check-Ins, Meal Plans, and Workouts to Supabase ($0)**:
   - Replace the isolated `localStorage` and temporary server disk storage for weekly check-ins, meal plans, and workout logs with direct Supabase table queries and upserts.
   - Retain lightweight in-memory/local caching only as an optimistic UI cache that immediately syncs with Supabase as the single source of truth.

3. **Step 3 — Client-Side Image Compression & Free Storage Upload ($0)**:
   - Add an automatic browser-side image compressor (using HTML5 Canvas) that resizes uploaded progress photos to a maximum dimension of 1200px at 80% JPEG/WebP quality (~150KB instead of 10–50MB).
   - Upload compressed photos to a Supabase Storage bucket (`progress-photos`) with automatic fallback to ultra-compact compressed thumbnails if the bucket hasn't been created yet, completely preventing 50MB payload crashes.

4. **Step 4 — Fix Realtime Connection Leaks & Sync Loops ($0)**:
   - Refactor the admin member list and user profile context to eliminate redundant `sync-users` polling loops and properly clean up WebSocket channels on unmount.
   - Add a manual "Sync / Refresh" button on the Coach Dashboard so you can verify live database state on demand with a single click.
