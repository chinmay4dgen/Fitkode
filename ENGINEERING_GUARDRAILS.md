# Fitkode — Engineering Guardrails, Post-Mortem & Pre-Flight Evaluation Checklist

**Document Version:** 1.0 (Canonical Source of Truth)  
**Platform:** Fitkode Performance & Nutrition Coaching Platform (`fitkode.com`)  
**Owners / Super Admins:** `chinmay4jain@gmail.com` & `myfitkode@gmail.com`

---

## 1. Purpose: The "No-Break" Constitution

This document is the **mandatory engineering constitution and pre-flight evaluation checklist** for all future code changes, bug fixes, UI updates, database migrations, and security improvements on Fitkode.

Every regression and back-and-forth cycle in this project happened when a change optimized for one isolated goal (such as bundle size cleanup, strict API blocking, or visual completion percentages) without checking its side effects on live data persistence, Coach-to-Member visibility, or Admin authentication.

**Core Rule for Every Future Change:**
> **No change may be shipped unless it passes all 7 Core Guardrails (Section 3) and all 15 Pre-Flight & Post-Change Evaluation Checks (Section 4).**

---

## 2. Post-Mortem of Past Regressions (What Went Wrong & How to Prevent Repeat)

### Incident 1: Disappearance of Registered Members & Assigned Plans (`fk_seed_purged_v1`)
- **What Happened:** During a cleanup to remove hardcoded data from the frontend bundle, `SEED_MEMBERS`, `ATUL_COACH_WORKOUT_PLAN`, and `SEED_WEEKLY_ENTRIES` were emptied **and** a one-time `localStorage` wipe (`fk_seed_purged_v1`) was added in `AuthContext.tsx` that deleted `fk_admin_members_v2`, `fk_meal_plans_v1`, `fk_workout_plans_v1`, and `fk_weekly_tracker_entries_v1`.
- **Impact:** Enrolled members (`Atul Gupta`, `Jyothi Varma`, `Gaurav Choudhary`, `Rakshit Harneja`, `Shruti Dubey`, `ChInMaY JaIn`) and Atul's assigned diet/workout plans vanished from the Admin Portal.
- **Root Cause:** Fallback data and local caches were purged *before* verifying that every record was present and readable via Supabase RLS in the live environment.
- **Permanent Guardrail:** **Never run destructive `localStorage` purges (`removeItem`) on member registries, plans, or check-ins**, and never remove fallback records without first confirming live database query parity.

### Incident 2: Synthetic / Placeholder Personal Details Polluting Real Member Profiles (`+91 98114 00612`)
- **What Happened:** When reconstructing Atul Gupta's fallback profile from screenshots that showed `Profile: 100% Complete` (along with his workout/diet plan) but did not show his phone number or street address, synthetic placeholder details (`+91 98114 00612`, `Pocket B, Sarita Vihar`, `1985-11-20`, `Max Healthcare Delhi`) were added so `getProfileCompletionRate()` would compute `100%`. Worse, `memberStore.ts` gated Supabase profile merging behind `profileRate >= existingMember.profileCompletion`. Because the seed had `100%`, any real Supabase profile with `< 100%` completion was ignored or overwritten by the synthetic seed fields instead of showing Atul's real phone number (`7838777741`).
- **Impact:** Atul Gupta's profile displayed a fabricated phone number (`+91 98114 00612`) instead of his real mobile number (`7838777741`).
- **Root Cause:** (1) Inventing placeholder PII to satisfy a UI completion percentage, and (2) letting fallback seed data outrank live Supabase data based on completion score.
- **Permanent Guardrail:** **Zero-Fabrication Rule** — Never invent or guess phone numbers, addresses, DOBs, blood groups, or medical history for any member. Leave unknown fields empty (`""`). **Supabase Truth Priority** — Any non-empty field from Supabase `public.profiles` must unconditionally overwrite fallback/local data regardless of completion score.

### Incident 3: Admin Role Lockout via Environment Variable Mismatch (`ADMIN_EMAILS` vs `admin_email`)
- **What Happened:** When environment variables in Vercel / AI Studio were named `admin_email` or `ADMIN_EMAILS`, any code path that replaced the default admin list instead of unioning with it—or relied on a single case-sensitive env var—caused the app or RLS policy to treat the Admin as a regular user (`Total Registered: 0`). Additionally, an early typo (`chinma4jain@gmail.com` missing the `y`) existed in parts of the codebase.
- **Impact:** Super Admin lost visibility into registered users until the env var and fallback union were fixed.
- **Permanent Guardrail:** Both `chinmay4jain@gmail.com` and `myfitkode@gmail.com` must always be hardcoded in `DEFAULT_ADMIN_EMAILS` across client (`memberStore.ts`, `AuthContext.tsx`), server (`server.ts`), and database (`public.is_admin()`), and `getAdminEmails()` must **union** `DEFAULT_ADMIN_EMAILS` with both `process.env.ADMIN_EMAILS` and `process.env.ADMIN_EMAIL`.

### Incident 4: Coach-Assigned Plans Not Visible When the Member Logs In
- **What Happened:** Coach Chinmay assigned a workout plan (`4 Days workout`) and diet plan to Atul (`akg.atulgupta@gmail.com`) from the Admin Portal. However, `MealPlannerPage.tsx` and `WorkoutPlannerPage.tsx` only initialized state from local storage (`loadUserMealPlans` / `loadUserWorkoutPlans`) without calling `fetchMealPlansFromServer(userEmail)` and `fetchWorkoutPlansFromServer(userEmail)` on mount.
- **Impact:** Plans assigned by the Coach on one device/browser were not automatically pulled when the member logged in on their own device.
- **Permanent Guardrail:** Every Member-facing page (`MealPlannerPage`, `WorkoutPlannerPage`, `WeeklyTrackerPage`, `ProfilePage`) must actively fetch from `/api/*` and Supabase on mount (`useEffect`) and merge results into local state.

### Incident 5: Stuck Offline Sync Banner ("4 offline updates queued for cloud sync")
- **What Happened:** Whenever a background Supabase upsert returned a non-network error (such as a missing optional table or RLS notice while the user was online), the catch block pushed the payload into `fitkode_pending_sync_queue_v1`. Clicking "Sync Now" re-ran the same failing query and kept the items in the queue forever.
- **Impact:** A permanent green banner ("4 offline updates queued for cloud sync") stayed stuck at the bottom of the screen and "Sync Now" did nothing visible.
- **Permanent Guardrail:** Only enqueue items into `fitkode_pending_sync_queue_v1` when `!navigator.onLine` (true network disconnection). When "Sync Now" is clicked while online, attempt sync once and unconditionally clear the queue so poison/stale payloads never trap the UI.

### Incident 6: System Diagnostic Utility Cluttering Primary Coaching Header
- **What Happened:** The `DB Health & $0 SQL Fix` button was placed directly in the top-level Admin action bar alongside daily coaching tools (`Communication Center`, `Vault Backup`, `Refresh`).
- **Impact:** Visual clutter in the primary coaching workspace.
- **Permanent Guardrail:** One-time setup, diagnostic, and role-preview utilities must live inside the secondary `Role Preview & System` dropdown menu, keeping the primary header dedicated to high-frequency coaching operations.

### Incident 7: Over-Aggressive Security Refactors Breaking Live Workflows (Claude v1 vs. v2/Final Review)
- **What Happened:** Early security drafts proposed hard-blocking requests without Bearer tokens immediately, rejecting entire plan batches if one plan failed validation, removing the Razorpay orderless fallback, and switching the `progress-photos` bucket to private before deploying a signed-URL image component.
- **Impact:** Would have broken guest checkout, existing check-in photo rendering, and local plan syncing.
- **Permanent Guardrail:** Always ship **client compatibility first** (Bearer headers + `<ProgressPhoto />` signed URL resolver), keep server enforcement behind `AUTH_ENFORCE=false` (log-only mode) until verified in production logs, filter plan batches item-by-item, and use silent `BEFORE INSERT OR UPDATE` database triggers that preserve `OLD.role` instead of throwing errors.

---

## 3. Canonical Source-of-Truth Rules (Never Violate)

### 3.1 Canonical Admin Identities & Email Configuration
| Setting | Canonical Value | Rule |
| :--- | :--- | :--- |
| **Primary Super Admin 1** | `chinmay4jain@gmail.com` | Full `admin` role in client, Express server, and Supabase RLS (`public.is_admin()`). |
| **Primary Super Admin 2 & SMTP Sender** | `myfitkode@gmail.com` | Full `admin` role AND canonical email sender for Nodemailer/notifications. **Never modify email-sending credentials or sender configuration.** |
| **Removed Typo Email** | `chinma4jain@gmail.com` | Must **never** appear in any file or SQL script. |
| **Env Var Resolution** | `DEFAULT_ADMIN_EMAILS ∪ ADMIN_EMAILS ∪ ADMIN_EMAIL` | Server must always union default admins with env vars—never let a missing or misnamed env var remove admin access. |

### 3.2 Canonical Enrolled Members & Zero-Fabrication Policy
1. **Real Enrolled Members:**
   - **Atul Gupta** (`akg.atulgupta@gmail.com`) — Mobile: **`7838777741`** (Assigned `4 Days workout` + `Atul Diet Plan - 1950 kcal High-Protein Vegetarian` + Week 1 & Week 2 check-ins).
   - **Shruti Dubey** (`dubeyshruti2428@gmail.com`) — Mobile: **`9891020554`**.
   - **Chinmay Jain** (`chinmay4jain@gmail.com`) — Mobile: **`9654173664`** (Super Admin).
   - **ChInMaY JaIn** (`chinmayright@gmail.com`) — Mobile: **`9654173664`**.
   - **Rakshit Harneja** (`rharneja2008@gmail.com`) — Phone empty until synced from Supabase.
   - **Gaurav Choudhary** (`advgauravc86@gmail.com`) — Phone empty until synced from Supabase.
   - **Jyothi Varma** (`jyothi.varmagl@gmail.com`) — Phone empty until synced from Supabase.
2. **Zero-Fabrication Policy:**
   - Never add placeholder phone numbers, street addresses, zipcodes, dates of birth, blood groups, or healthcare providers to any member record.
   - If a field is not known from the user's real submission, leave it `""`.
3. **Dummy Account Exclusion:**
   - Any account ending in `@example.com` or matching `DUMMY_MEMBER_IDS` (`usr_001_priya`, `usr_002_rahul`, `usr_003_ananya`, `usr_004_david`, `usr_005_vikram`) must be filtered out by `isDummyMember()`.

### 3.3 Data Precedence Hierarchy
Whenever member data is loaded or merged in `memberStore.ts`, `profileStorage.ts`, `plannerStore.ts`, or `weeklyTrackerStore.ts`, follow this strict priority order:
1. **Priority 1 (Highest): Live Supabase Database** (`public.profiles`, `public.weekly_tracker_entries`, and embedded `profile_data` plans). Any non-empty field in Supabase unconditionally overrides local or fallback data.
2. **Priority 2: Express Backend Runtime Store** (`.server_data/*.json` via `/api/*`).
3. **Priority 3: Browser `localStorage` Cache** (sanitized via `storageGuard.ts` to strip heavy base64 images).
4. **Priority 4 (Lowest): Code Fallback Definitions** (used only when a record or field is absent in Priorities 1–3).

---

## 4. The 15-Point Pre-Flight & Post-Change Evaluation Checklist

Before and after making **any** code modification to Fitkode, run through every row of this checklist:

| # | Category | Verification Check | Pass Criteria |
| :--- | :--- | :--- | :--- |
| **1** | **Data Safety** | Does this change delete, empty, or purge any `localStorage` key, `.server_data/*.json` file, or fallback store? | **No destructive wipes.** Existing member profiles, plans, and check-ins remain intact. |
| **2** | **Zero Fabrication** | Were any placeholder/synthetic personal details (fake phones, addresses, DOBs, doctors) added to any member? | **Zero synthetic PII.** Atul Gupta's phone is `7838777741`; unknown fields on any member are `""`. |
| **3** | **Supabase Priority** | When Supabase returns a member's `profiles` row, do non-empty Supabase fields win over local/seed fields? | **Yes.** Merge never blocks Supabase data behind `profileRate >= existingMember.profileCompletion`. |
| **4** | **Admin Access** | Are both `chinmay4jain@gmail.com` and `myfitkode@gmail.com` recognized as Super Admins on client, server, and SQL? | **Yes.** Unioned with `ADMIN_EMAILS` / `ADMIN_EMAIL`; typo `chinma4jain@gmail.com` is absent. |
| **5** | **Email Config** | Was the `myfitkode@gmail.com` SMTP/email sending configuration modified or broken? | **Untouched.** Welcome, check-in, and plan-assigned emails still send via `myfitkode@gmail.com`. |
| **6** | **Coach → Member Plans** | When Coach assigns/edits a Meal Plan or Workout Plan for a client (e.g., Atul), can the client see it upon logging in? | **Yes.** `MealPlannerPage` and `WorkoutPlannerPage` call `fetch*PlansFromServer(userEmail)` on mount and merge by `id`. |
| **7** | **Plan Merge Safety** | Do `saveAllMealPlans` and `saveAllWorkoutPlans` merge server responses by `id` (`updatedAt`) instead of replacing? | **Yes.** Local plans and other members' plans in Coach cache are never wiped by a filtered server response. |
| **8** | **Offline Sync Queue** | Does the offline queue (`fitkode_pending_sync_queue_v1`) only enqueue when `!navigator.onLine`, and does "Sync Now" clear it? | **Yes.** Online Supabase notices never inflate the offline queue; clicking "Sync Now" flushes and clears the banner. |
| **9** | **Privilege Guard** | Can a non-admin escalate their own `role`, `planId`, `planName`, or `notes` via `/api/members/sync` or Supabase? | **No.** Server and SQL trigger silently preserve existing privileged columns without breaking profile saves. |
| **10** | **Payment Integrity** | Does `/api/razorpay/create-order` and `verify-payment` use server-side `PLAN_CATALOG` pricing while keeping orderless fallback? | **Yes.** Server enforces catalog INR amounts; ₹1 test plan (`plan_test_1`) has `grantsPaid: false`; fallback stays open. |
| **11** | **Progress Photos** | Do all check-in photo views (`WeeklyTrackerModal`, `WeeklyTrackerTable`, `PhotoCompareModal`, print/dossier) use `<ProgressPhoto />`? | **Yes.** Signed URLs resolve with a 23h cache and fall back gracefully to public URLs. |
| **12** | **XSS Sanitization** | Are user-supplied strings escaped with `escapeHtml()` in email templates and print views, and is Email Preview sandboxed in an `<iframe srcDoc>`? | **Yes.** No raw `dangerouslySetInnerHTML` on untrusted HTML. |
| **13** | **UI Cleanliness** | Are diagnostic/setup buttons (`DB Health & SQL Setup`, `Role Preview`) tucked inside the `Role Preview & System` menu? | **Yes.** Main Admin header contains only primary coaching actions. |
| **14** | **Build & Bundle Separation** | Does `npm run build` output frontend to `dist/` and server to `dist-server/server.cjs` (`"start": "node dist-server/server.cjs"`)? | **Yes.** Backend bundle is never placed inside the public static `dist/` folder. |
| **15** | **TypeScript & Compile Gate** | Do both `npm run lint` (`tsc --noEmit`) and `npm run build` complete with zero errors? | **Zero TypeScript or Vite/esbuild errors.** |
