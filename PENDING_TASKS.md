# Pending Tasks — Monsoon Assistant

## Build Status

- ✅ `npm run build` **PASSES** — all type errors fixed

---

## P0 — Backend (Supabase Database)

### ✅ Database Schema & Seed Data — READY

**File**: `supabase/complete_setup.sql`

**This file contains everything needed:**

- All 13 tables (profiles, families, family_members, preparedness_plans, checklist_items, weather_alerts, localized_alerts, shelters, evacuation_routes, sos_requests, community_reports, offline_cache_manifests, risk_score_history)
- All indexes
- All RLS policies
- All triggers
- All seed data (5 families, 16 members, 4 weather alerts, 7 shelters, 5 evacuation routes, 19 checklist items, risk scores)

**To Run:**

1. Go to Supabase Dashboard > SQL Editor
2. Create test auth users first (phones: +919876543210 through +919876543220)
3. Paste and execute `supabase/complete_setup.sql`

### ⚠️ Environment Variables Need Update

The `.env` file has placeholder values. Update with real credentials:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-real-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-real-service-role-key
GEMINI_API_KEY=your-real-gemini-key
```

---

## ✅ P0 — Type Errors Blocking Build — FIXED

### 1. `AlertsUI` Props Mismatch — FIXED

**Files**: `components/alerts/AlertsUI.tsx` and `app/[locale]/alerts/page.tsx`
**Fix**: Renamed `initialAlerts` to `alerts` in prop interface and call site

### 2. Supabase Query Type Narrowing — FIXED

**Files**: Multiple API routes and pages
**Fix**:

- `lib/supabase/server.ts` - Uses `@supabase/auth-helpers-nextjs` with proper typing
- `lib/supabase/client.ts` - Uses `@supabase/auth-helpers-nextjs` with proper typing
- `app/actions.ts` - Removed `as any` cast
- `types/index.ts` - Fixed duplicate export conflict

---

## P1 — ESLint Warnings (Clean Before Commit)

### 3. Unused Imports/Variables

- `components/shelters/SheltersUI.tsx`: `ArrowUpRight` unused
- `components/alerts/AlertsUI.tsx`: `Button` unused
- `components/ui/BottomNavigation.tsx`: `Menu`, `X`, `Button` unused
- `components/ui/ChecklistItem.tsx`: `useCallback`, `MoreVertical`, `Button` unused, `itemRef` unused
- `lib/validators.ts`: Many unused type imports
- `lib/genai.ts`: `Family`, `FamilyMember`, `WeatherAlert`, `PreparednessPhase` unused

### 4. `any` Type Usage

Multiple files use `any` instead of proper types (warnings only, build passes)

---

## ✅ P1 — Missing PWA Requirements — FIXED

### 5. Service Worker Created

**File**: `/public/sw.js` — production-ready with cache-first for static assets, network-first for safety data, offline fallback, push notifications

### 6. PWA Manifest — EXISTING

**File**: `/public/manifest.json` — verified configured with icons/shortcuts

---

## P2 — Testing

### 7. Jest Test Suite

`npm run test:ci` must pass before deploy

---

## Deployment Checklist

- [ ] Supabase project linked and seeded
- [ ] Auth users created
- ✅ `npm run build` passes
- [ ] `npm run test:ci` passes
- ✅ PWA manifest + SW registered
- [ ] All env vars set in Vercel
