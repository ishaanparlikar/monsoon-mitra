# Supabase Setup Guide

## Quick Start: One-File Setup (Recommended)

**Run `supabase/complete_setup.sql` in Supabase Dashboard > SQL Editor**

This single file contains:

- All enum types
- All tables (profiles, families, family_members, preparedness_plans, checklist_items, weather_alerts, localized_alerts, shelters, evacuation_routes, sos_requests, community_reports, offline_cache_manifests, risk_score_history)
- All indexes
- Triggers (updated_at, auto-profile on auth user creation)
- Row Level Security (RLS) policies
- Seed data (5 families, members, weather alerts, shelters, evacuation routes, plans, checklist items)

---

## Prerequisites: Create Auth Users First

Before running the complete setup, you need auth.users for the seed data FK references.

**Test Users to Create** (via Dashboard > Authentication > Users > Add User):

| Phone         | UUID                                 |
| ------------- | ------------------------------------ |
| +919876543210 | a0000000-0000-0000-0000-000000000001 |
| +919876543211 | a0000000-0000-0000-0000-000000000002 |
| +919876543212 | a0000000-0000-0000-0000-000000000003 |
| +919876543213 | a0000000-0000-0000-0000-000000000004 |
| +919876543214 | a0000000-0000-0000-0000-000000000005 |
| +919876543215 | a0000000-0000-0000-0000-000000000006 |
| +919876543216 | a0000000-0000-0000-0000-000000000007 |
| +919876543217 | a0000000-0000-0000-0000-000000000008 |
| +919876543218 | a0000000-0000-0000-0000-000000000009 |
| +919876543219 | a0000000-0000-0000-0000-000000000010 |
| +919876543220 | a0000000-0000-0000-0000-000000000011 |

---

## Alternative: Using Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Push schema migration
supabase db push

# Seed data
supabase db seed --file=supabase/seed.sql
```

---

## Verification

After setup, verify tables exist:

```sql
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
```

Expected tables (13 total):

- profiles
- families
- family_members
- preparedness_plans
- checklist_items
- weather_alerts
- localized_alerts
- shelters
- evacuation_routes
- sos_requests
- community_reports
- offline_cache_manifests
- risk_score_history

---

## Files Reference

| File                                         | Purpose                                     |
| -------------------------------------------- | ------------------------------------------- |
| `supabase/complete_setup.sql`                | **One-file setup** — run this in SQL Editor |
| `supabase/migrations/001_initial_schema.sql` | Schema only (for CLI `db push`)             |
| `supabase/seed.sql`                          | Seed data only (after auth users created)   |
| `supabase/setup_test_users.sql`              | Instructions for creating test auth users   |
