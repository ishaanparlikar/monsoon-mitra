-- Monsoon Assistant: Mumbai Suburban Seed Data
-- =============================================================================
-- PREREQUISITES (MUST run in order):
--
--   STEP 1: Create test auth.users via Supabase Admin API (service_role required)
--     Run the script below via curl or paste into Supabase Dashboard > SQL Editor:
--
--     NOTE: First create auth users, then this seed script.
--     Auth users MUST exist before profiles can be inserted (FK constraint).
--
--   STEP 2: Run this seed.sql in Supabase SQL Editor
--     After auth users are created, paste and execute this entire file.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- STEP 1: Create test auth.users (run these INSERTs via Admin API first)
-- -----------------------------------------------------------------------------
-- In Supabase Dashboard > Authentication > Users > Add User (+), create users:
--   Phone: +919876543210  → UUID: a0000000-0000-0000-0000-000000000001
--   Phone: +919876543211  → UUID: a0000000-0000-0000-0000-000000000002
--   Phone: +919876543212  → UUID: a0000000-0000-0000-0000-000000000003
--   Phone: +919876543213  → UUID: a0000000-0000-0000-0000-000000000004
--   Phone: +919876543214  → UUID: a0000000-0000-0000-0000-000000000005
--   Phone: +919876543215  → UUID: a0000000-0000-0000-0000-000000000006
--   Phone: +919876543216  → UUID: a0000000-0000-0000-0000-000000000007
--   Phone: +919876543217  → UUID: a0000000-0000-0000-0000-000000000008
--   Phone: +919876543218  → UUID: a0000000-0000-0000-0000-000000000009
--   Phone: +919876543219  → UUID: a0000000-0000-0000-0000-000000000010
--   Phone: +919876543220  → UUID: a0000000-0000-0000-0000-000000000011
--
-- OR use Admin REST API (requires SUPABASE_SERVICE_ROLE_KEY):
-- curl -X POST 'https://<ref>.supabase.co/auth/v1/admin/users' \
--   -H 'Authorization: Bearer <SERVICE_ROLE_KEY>' \
--   -H 'apikey: <SERVICE_ROLE_KEY>' \
--   -H 'Content-Type: application/json' \
--   -d '{"id": "a0000000-0000-0000-0000-000000000001", "phone": "+919876543210"}'
-- Repeat for all 11 users.
-- -----------------------------------------------------------------------------

-- Check: abort if auth.users don't exist yet
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id IN (
      'a0000000-0000-0000-0000-000000000001',
      'a0000000-0000-0000-0000-000000000002',
      'a0000000-0000-0000-0000-000000000003',
      'a0000000-0000-0000-0000-000000000004',
      'a0000000-0000-0000-0000-000000000005',
      'a0000000-0000-0000-0000-000000000006',
      'a0000000-0000-0000-0000-000000000007',
      'a0000000-0000-0000-0000-000000000008',
      'a0000000-0000-0000-0000-000000000009',
      'a0000000-0000-0000-0000-000000000010',
      'a0000000-0000-0000-0000-000000000011'
    )
  ) THEN
    RAISE NOTICE 'Auth users not found. Create test auth.users first via Supabase Dashboard > Authentication > Users. See supabase/seed.sql for instructions.';
    -- Don't abort — let the script continue so other tables can be seeded
  ELSE
    RAISE NOTICE 'Auth users found. Proceeding with seed...';
  END IF;
END $$;

-- ============================================================================
-- SEED: profiles
-- Auth.users MUST exist first (via trigger, profiles auto-create on auth.user INSERT).
-- For seed data, we manually set phone on profiles that auth trigger created.
-- ============================================================================

-- Update profiles with language preferences (auth users were created via dashboard,
-- trigger created empty profiles — now update them with language)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_phone_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_phone_check CHECK (phone ~ '^\+?91[0-9]{10}$');

INSERT INTO profiles (id, phone)
SELECT id, COALESCE(phone, '') FROM auth.users
ON CONFLICT (id) DO NOTHING;

UPDATE profiles SET
  phone = CASE id
    WHEN 'a0000000-0000-0000-0000-000000000001' THEN '+919876543210'
    WHEN 'a0000000-0000-0000-0000-000000000002' THEN '+919876543211'
    WHEN 'a0000000-0000-0000-0000-000000000003' THEN '+919876543212'
    WHEN 'a0000000-0000-0000-0000-000000000004' THEN '+919876543213'
    WHEN 'a0000000-0000-0000-0000-000000000005' THEN '+919876543214'
    WHEN 'a0000000-0000-0000-0000-000000000006' THEN '+919876543215'
    WHEN 'a0000000-0000-0000-0000-000000000007' THEN '+919876543216'
    WHEN 'a0000000-0000-0000-0000-000000000008' THEN '+919876543217'
    WHEN 'a0000000-0000-0000-0000-000000000009' THEN '+919876543218'
    WHEN 'a0000000-0000-0000-0000-000000000010' THEN '+919876543219'
    WHEN 'a0000000-0000-0000-0000-000000000011' THEN '+919876543220'
  END,
  language = CASE id
    WHEN 'a0000000-0000-0000-0000-000000000001' THEN 'hi'
    WHEN 'a0000000-0000-0000-0000-000000000002' THEN 'mr'
    WHEN 'a0000000-0000-0000-0000-000000000003' THEN 'en'
    WHEN 'a0000000-0000-0000-0000-000000000004' THEN 'gu'
    WHEN 'a0000000-0000-0000-0000-000000000005' THEN 'en'
    WHEN 'a0000000-0000-0000-0000-000000000006' THEN 'en'
    WHEN 'a0000000-0000-0000-0000-000000000007' THEN 'en'
    WHEN 'a0000000-0000-0000-0000-000000000008' THEN 'en'
    WHEN 'a0000000-0000-0000-0000-000000000009' THEN 'mr'
    WHEN 'a0000000-0000-0000-0000-000000000010' THEN 'mr'
    WHEN 'a0000000-0000-0000-0000-000000000011' THEN 'en'
  END
 WHERE id IN (
  'a0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000003',
  'a0000000-0000-0000-0000-000000000004',
  'a0000000-0000-0000-0000-000000000005',
  'a0000000-0000-0000-0000-000000000006',
  'a0000000-0000-0000-0000-000000000007',
  'a0000000-0000-0000-0000-000000000008',
  'a0000000-0000-0000-0000-000000000009',
  'a0000000-0000-0000-0000-000000000010',
  'a0000000-0000-0000-0000-000000000011'
);

-- ============================================================================
-- SEED: families (Mumbai Suburban)
-- ============================================================================

INSERT INTO families (id, primary_member, address, lat, lng, district, ward, hazard_zones, housing_type, vulnerability_score) VALUES
  -- Family 1: Andheri West — flood-prone, semi-pucca, high vulnerability
  ('f0000000-0000-0000-0000-000000000001',
   'a0000000-0000-0000-0000-000000000001',
   'B-402, Blue Hills CHS, SV Patel Road, Andheri West',
   19.1197, 72.8464,
   'Mumbai Suburban', 'K-West (Andheri West)',
   ARRAY['flood-prone', 'waterlogging'],
   'semi-pucca',
   0.68),

  -- Family 2: Vashi, Navi Mumbai — flood-prone, pucca, moderate
  ('f0000000-0000-0000-0000-000000000002',
   'a0000000-0000-0000-0000-000000000002',
   'Sector 7, Vashi, Navi Mumbai',
   19.0728, 72.9970,
   'Mumbai Suburban', 'Vashi',
   ARRAY['flood-prone'],
   'pucca',
   0.32),

  -- Family 3: Ghatkopar East — landslide + flood, kutcha, very high vulnerability
  ('f0000000-0000-0000-0000-000000000003',
   'a0000000-0000-0000-0000-000000000003',
   'Hill View Society, R.B. Mehta Road, Ghatkopar East',
   19.0868, 72.9154,
   'Mumbai Suburban', 'N-Ward (Ghatkopar)',
   ARRAY['landslide-prone', 'flood-prone'],
   'kutcha',
   0.89),

  -- Family 4: Bandra West — low risk, pucca (cast the empty array to TEXT[] to avoid P0 type error)
  ('f0000000-0000-0000-0000-000000000004',
   'a0000000-0000-0000-0000-000000000004',
   'St. Andrews Road, Bandra West',
   19.0596, 72.8295,
   'Mumbai Suburban', 'H-West (Bandra West)',
   ARRAY[]::TEXT[],
   'pucca',
   0.15),

  -- Family 5: Kurla — waterlogging area, semi-pucca
  ('f0000000-0000-0000-0000-000000000005',
   'a0000000-0000-0000-0000-000000000005',
   'LBS Marg, Kurla West',
   19.0720, 72.8828,
   'Mumbai Suburban', 'L-Ward (Kurla)',
   ARRAY['waterlogging'],
   'semi-pucca',
   0.45)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SEED: family_members
-- ============================================================================

INSERT INTO family_members (id, family_id, profile_id, relation, age, medical_conditions, is_vulnerable) VALUES
  -- Family 1: self (asthma), spouse, child (young), elderly parent (diabetes, hypertension)
  ('b0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'self', 35, ARRAY['asthma'], TRUE),
  ('b0000000-0000-0000-0000-000000000002', 'f0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', 'spouse', 32, ARRAY[]::TEXT[], FALSE),
  ('b0000000-0000-0000-0000-000000000003', 'f0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003', 'child', 7, ARRAY[]::TEXT[], TRUE),
  ('b0000000-0000-0000-0000-000000000004', 'f0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000004', 'elderly_parent', 68, ARRAY['diabetes', 'hypertension'], TRUE),

  -- Family 2: young couple with toddler
  ('b0000000-0000-0000-0000-000000000005', 'f0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000005', 'self', 28, ARRAY[]::TEXT[], FALSE),
  ('b0000000-0000-0000-0000-000000000006', 'f0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000006', 'spouse', 26, ARRAY[]::TEXT[], FALSE),
  ('b0000000-0000-0000-0000-000000000007', 'f0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000007', 'child', 3, ARRAY[]::TEXT[], TRUE),

  -- Family 3: elderly couple with teens, one with asthma
  ('b0000000-0000-0000-0000-000000000008', 'f0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000008', 'self', 45, ARRAY['arthritis'], TRUE),
  ('b0000000-0000-0000-0000-000000000009', 'f0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000009', 'spouse', 42, ARRAY[]::TEXT[], FALSE),
  ('b0000000-0000-0000-0000-000000000010', 'f0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000010', 'child', 14, ARRAY[]::TEXT[], FALSE),
  ('b0000000-0000-0000-0000-000000000011', 'f0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000011', 'child', 9, ARRAY['asthma'], TRUE),

  -- Family 4: young couple, low risk
  ('b0000000-0000-0000-0000-000000000012', 'f0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000004', 'self', 30, ARRAY[]::TEXT[], FALSE),
  ('b0000000-0000-0000-0000-000000000013', 'f0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000005', 'spouse', 28, ARRAY[]::TEXT[], FALSE),

  -- Family 5: family of 3
  ('b0000000-0000-0000-0000-000000000014', 'f0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000006', 'self', 40, ARRAY['diabetes'], TRUE),
  ('b0000000-0000-0000-0000-000000000015', 'f0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000007', 'spouse', 38, ARRAY[]::TEXT[], FALSE),
  ('b0000000-0000-0000-0000-000000000016', 'f0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000008', 'child', 12, ARRAY[]::TEXT[], FALSE)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SEED: weather_alerts (IMD/CWC style — active July 2026)
-- ============================================================================

INSERT INTO weather_alerts (id, source, alert_type, severity, districts, title, description, instruction, valid_from, valid_until, metadata) VALUES
  ('c0000000-0000-0000-0000-000000000001',
   'IMD', 'heavy_rainfall', 'warning',
   ARRAY['Mumbai Suburban', 'Mumbai City', 'Thane', 'Palghar'],
   'Red Alert: Extremely Heavy Rainfall Expected',
   'Extremely heavy rainfall (>204.4mm in 24 hours) expected at isolated places over Mumbai Suburban district. Strong winds 40-50 kmph gusting to 60 kmph. Fishermen advised not to venture into sea.',
   'Avoid all travel. Stay indoors. Keep emergency kit ready. Evacuate low-lying areas immediately if water rises. Monitor official updates every 2 hours.',
   '2026-07-11T08:00:00+05:30', '2026-07-12T08:00:00+05:30',
   '{"cap_id": "IMD-MUM-20260711-001", "probability": "high"}'),

  ('c0000000-0000-0000-0000-000000000002',
   'IMD', 'thunderstorm', 'alert',
   ARRAY['Mumbai Suburban'],
   'Orange Alert: Thunderstorm with Lightning and Gusty Winds',
   'Moderate to heavy thunderstorms with lightning and gusty winds (50-60 kmph) likely at isolated places over Mumbai Suburban district during next 12 hours.',
   'Stay away from trees, electric poles, and open fields. Unplug all electrical appliances. Do not take shelter under isolated trees.',
   '2026-07-11T12:00:00+05:30', '2026-07-12T00:00:00+05:30',
   '{"cap_id": "IMD-MUM-20260711-002", "probability": "moderate"}'),

  ('c0000000-0000-0000-0000-000000000003',
   'CWC', 'flood', 'watch',
   ARRAY['Mumbai Suburban', 'Thane'],
   'Flood Watch: Rising River Levels in Mithi and Vaitarna',
   'Mithi River and Vaitarna River water levels rising due to continuous rainfall. River levels approaching warning mark. Residents near riverbanks and low-lying areas adjacent to rivers should remain alert.',
   'Monitor water levels near your home. Keep ward control room contact ready. Prepare to evacuate if water enters ground floor. Do not attempt to cross flooded roads.',
   '2026-07-11T10:00:00+05:30', '2026-07-13T10:00:00+05:30',
   '{"river": "Mithi", "current_level_m": 4.2, "warning_level_m": 4.5, "danger_level_m": 5.0}'),

  ('c0000000-0000-0000-0000-000000000004',
   'IMD', 'landslide', 'watch',
   ARRAY['Mumbai Suburban'],
   'Yellow Watch: Landslide Risk in Hilly Areas of Eastern Suburbs',
   'Moderate rainfall over past 48 hours has saturated soil on hillsides in Powai, Ghatkopar East, and Bhandup areas. Minor landslide possible in saturated soil zones.',
   'If you live near a hillside or slope: Monitor for crack sounds or ground movement. Keep emergency contacts ready. Evacuate if directed by BMC ward officials.',
   '2026-07-11T06:00:00+05:30', '2026-07-14T06:00:00+05:30',
   '{"affected_wards": ["N-Ward (Ghatkopar)", "S-Ward (Bhandup)", "R-Central (Powai)"]}')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SEED: shelters
-- ============================================================================

INSERT INTO shelters (id, name, address, lat, lng, district, ward, capacity, current_occupancy, facilities, managing_authority, is_active) VALUES
  ('d0000000-0000-0000-0000-000000000001',
   'Andheri Sports Complex',
   'JVP Scheme, Opposite Andheri Fire Station, Andheri West',
   19.1075, 72.8261, 'Mumbai Suburban', 'K-West',
   500, 120,
   '{"water": true, "toilets": true, "medical": true, "food": true, "power_backup": true, "wheelchair_accessible": true}',
   'BMC K-West Ward', TRUE),

  ('d0000000-0000-0000-0000-000000000002',
   'St. Andrews High School',
   'St. Andrews Road, Bandra West',
   19.0596, 72.8295, 'Mumbai Suburban', 'H-West',
   300, 45,
   '{"water": true, "toilets": true, "medical": false, "food": true, "power_backup": false}',
   'BMC H-West Ward', TRUE),

  ('d0000000-0000-0000-0000-000000000003',
   'Vashi Municipal School',
   'Sector 15, Vashi, Navi Mumbai',
   19.0760, 72.9943, 'Mumbai Suburban', 'Vashi',
   400, 200,
   '{"water": true, "toilets": true, "medical": true, "food": true, "power_backup": true}',
   'NMMC Vashi Ward', TRUE),

  ('d0000000-0000-0000-0000-000000000004',
   'Ghatkopar Community Center',
   'R.B. Mehta Marg, Ghatkopar East',
   19.0842, 72.9105, 'Mumbai Suburban', 'N-Ward',
   250, 80,
   '{"water": true, "toilets": true, "medical": false, "food": false, "power_backup": false}',
   'BMC N-Ward', TRUE),

  ('d0000000-0000-0000-0000-000000000005',
   'Kurla Bus Depot Shelter',
   'LBS Marg, Kurla West',
   19.0720, 72.8828, 'Mumbai Suburban', 'L-Ward',
   350, 150,
   '{"water": true, "toilets": true, "medical": true, "food": true, "power_backup": true}',
   'BMC L-Ward', TRUE),

  ('d0000000-0000-0000-0000-000000000006',
   'Powai Cricket Ground Shelter',
   'Powai Lake Road, Powai',
   19.1180, 72.9080, 'Mumbai Suburban', 'S-Ward',
   200, 30,
   '{"water": true, "toilets": true, "medical": false, "food": true, "power_backup": false}',
   'BMC S-Ward', TRUE),

  ('d0000000-0000-0000-0000-000000000007',
   'Bandra Tram Depot Shelter',
   'Bandra Tram Depo, Waterfield Road, Bandra West',
   19.0550, 72.8350, 'Mumbai Suburban', 'H-West',
   180, 25,
   '{"water": true, "toilets": true, "medical": true, "food": true, "power_backup": true}',
   'BMC H-West Ward', TRUE)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SEED: evacuation_routes
-- ============================================================================

INSERT INTO evacuation_routes (id, from_lat, from_lng, to_shelter_id, waypoints, distance_km, duration_min, road_condition, suitable_for) VALUES
  ('e0000000-0000-0000-0000-000000000001',
   19.1197, 72.8464, 'd0000000-0000-0000-0000-000000000001',
   '[{"lat": 19.1197, "lng": 72.8464, "instruction": "Start: Blue Hills CHS entrance, Andheri West"},
    {"lat": 19.1150, "lng": 72.8400, "instruction": "Turn left on SV Road towards Andheri Station"},
    {"lat": 19.1100, "lng": 72.8320, "instruction": "Continue on Link Road northbound"},
    {"lat": 19.1075, "lng": 72.8261, "instruction": "Arrive: Andheri Sports Complex shelter entrance"}]',
   3.2, 12, 'waterlogged', 'vehicle'),

  ('e0000000-0000-0000-0000-000000000002',
   19.1197, 72.8464, 'd0000000-0000-0000-0000-000000000001',
   '[{"lat": 19.1197, "lng": 72.8464, "instruction": "Start: Blue Hills CHS, use society internal road"},
    {"lat": 19.1170, "lng": 72.8420, "instruction": "Walk via internal road to Link Road"},
    {"lat": 19.1100, "lng": 72.8320, "instruction": "Cross Link Road at pedestrian crossing"},
    {"lat": 19.1075, "lng": 72.8261, "instruction": "Arrive: Andheri Sports Complex"}]',
   2.8, 35, 'waterlogged', 'pedestrian'),

  ('e0000000-0000-0000-0000-000000000003',
   19.0868, 72.9154, 'd0000000-0000-0000-0000-000000000004',
   '[{"lat": 19.0868, "lng": 72.9154, "instruction": "Start: Hill View Society, Ghatkopar East"},
    {"lat": 19.0850, "lng": 72.9120, "instruction": "Take R.B. Mehta Marg towards station"},
    {"lat": 19.0842, "lng": 72.9105, "instruction": "Arrive: Ghatkopar Community Center"}]',
   0.8, 5, 'good', 'both'),

  ('e0000000-0000-0000-0000-000000000004',
   19.0720, 72.8828, 'd0000000-0000-0000-0000-000000000005',
   '[{"lat": 19.0720, "lng": 72.8828, "instruction": "Start: LBS Marg, Kurla West"},
    {"lat": 19.0710, "lng": 72.8810, "instruction": "Walk east on LBS Marg"},
    {"lat": 19.0720, "lng": 72.8828, "instruction": "Arrive: Kurla Bus Depot Shelter"}]',
   0.4, 8, 'good', 'both'),

  ('e0000000-0000-0000-0000-000000000005',
   19.0596, 72.8295, 'd0000000-0000-0000-0000-000000000002',
   '[{"lat": 19.0596, "lng": 72.8295, "instruction": "Start: St. Andrews Road, Bandra West"},
    {"lat": 19.0596, "lng": 72.8295, "instruction": "Arrive: St. Andrews High School shelter"}]',
   0.2, 3, 'good', 'both')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SEED: preparedness_plans
-- ============================================================================

INSERT INTO preparedness_plans (id, family_id, phase, generated_by, risk_score_at_generation, status) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', 'pre_monsoon', 'system', 72, 'active'),
  ('a1000000-0000-0000-0000-000000000002', 'f0000000-0000-0000-0000-000000000002', 'pre_monsoon', 'system', 55, 'active'),
  ('a1000000-0000-0000-0000-000000000003', 'f0000000-0000-0000-0000-000000000003', 'active_monsoon', 'system', 85, 'active'),
  ('a1000000-0000-0000-0000-000000000004', 'f0000000-0000-0000-0000-000000000004', 'pre_monsoon', 'system', 35, 'active'),
  ('a1000000-0000-0000-0000-000000000005', 'f0000000-0000-0000-0000-000000000005', 'active_monsoon', 'system', 60, 'active')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SEED: checklist_items (family 1 plan — Andheri West high-risk)
-- ============================================================================

INSERT INTO checklist_items (id, plan_id, item_text, priority, category, phase_applicability, sort_order) VALUES
  ('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001',
   'Elevate all electrical sockets and appliances above potential flood level (minimum 4 feet)',
   'critical', 'home_prep', ARRAY['pre_monsoon'], 1),
  ('b1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001',
   'Clear roof drains, balconies, and surroundings of debris and leaves',
   'high', 'home_prep', ARRAY['pre_monsoon', 'active_monsoon'], 2),
  ('b1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001',
   'Check and repair window seals and door weather strips',
   'medium', 'home_prep', ARRAY['pre_monsoon'], 3),
  ('b1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000001',
   'Charge power banks (10,000mAh+) and arrange battery-powered radio',
   'high', 'home_prep', ARRAY['pre_monsoon'], 4),
  ('b1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000001',
   'Store Aadhaar, PAN, property documents, insurance papers in waterproof bags',
   'critical', 'documents', ARRAY['pre_monsoon'], 5),
  ('b1000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000001',
   'Photocopy all important documents and store copies with trusted neighbor outside flood zone',
   'high', 'documents', ARRAY['pre_monsoon'], 6),
  ('b1000000-0000-0000-0000-000000000007', 'a1000000-0000-0000-0000-000000000001',
   'Digitize medical records and prescriptions, store in phone and cloud',
   'medium', 'documents', ARRAY['pre_monsoon'], 7),
  ('b1000000-0000-0000-0000-000000000008', 'a1000000-0000-0000-0000-000000000001',
   'Assemble 72-hour emergency kit: 9L water (3L/person for 3 days), dry food (biscuits, poha, thekua)',
   'critical', 'emergency_kit', ARRAY['pre_monsoon'], 8),
  ('b1000000-0000-0000-0000-000000000009', 'a1000000-0000-0000-0000-000000000001',
   'Pack flashlight with extra batteries, candle, matchbox, and lighter',
   'high', 'emergency_kit', ARRAY['pre_monsoon'], 9),
  ('b1000000-0000-0000-0000-000000000010', 'a1000000-0000-0000-0000-000000000001',
   'Include dust mask (N95), rubber gloves, and plastic tarpaulin sheets',
   'medium', 'emergency_kit', ARRAY['pre_monsoon'], 10),
  ('b1000000-0000-0000-0000-000000000011', 'a1000000-0000-0000-0000-000000000001',
   'Identify nearest shelter (Andheri Sports Complex) and pre-plan walking/driving route',
   'critical', 'evacuation', ARRAY['pre_monsoon', 'active_monsoon'], 11),
  ('b1000000-0000-0000-0000-000000000012', 'a1000000-0000-0000-0000-000000000001',
   'Pack go-bag for family with change of clothes, toiletries, important docs',
   'high', 'evacuation', ARRAY['pre_monsoon'], 12),
  ('b1000000-0000-0000-0000-000000000013', 'a1000000-0000-0000-0000-000000000001',
   'Identify alternate shelter in case primary shelter is full (St. Andrews HS, Bandra)',
   'medium', 'evacuation', ARRAY['pre_monsoon'], 13),
  ('b1000000-0000-0000-0000-000000000014', 'a1000000-0000-0000-0000-000000000001',
   'Stock 2-week supply of all regular medications (asthma inhalers, BP/diabetes meds)',
   'critical', 'health', ARRAY['pre_monsoon', 'active_monsoon'], 14),
  ('b1000000-0000-0000-0000-000000000015', 'a1000000-0000-0000-0000-000000000001',
   'Pack first aid kit: bandages, antiseptic, paracetamol, ORS packets, thermometer',
   'high', 'health', ARRAY['pre_monsoon'], 15),
  ('b1000000-0000-0000-0000-000000000016', 'a1000000-0000-0000-0000-000000000001',
   'Coordinate with elderly parent''s doctor for emergency prescription refills before monsoon',
   'high', 'health', ARRAY['pre_monsoon'], 16),
  ('b1000000-0000-0000-0000-000000000017', 'a1000000-0000-0000-0000-000000000001',
   'Save emergency contacts offline in phone: Ward control room, shelter, ambulance 108, disaster helpline 1077',
   'critical', 'communication', ARRAY['pre_monsoon'], 17),
  ('b1000000-0000-0000-0000-000000000018', 'a1000000-0000-0000-0000-000000000001',
   'Identify out-of-town emergency contact who can coordinate for family',
   'high', 'communication', ARRAY['pre_monsoon'], 18),
  ('b1000000-0000-0000-0000-000000000019', 'a1000000-0000-0000-0000-000000000001',
   'Download offline maps of Mumbai Suburban district to phone',
   'medium', 'communication', ARRAY['pre_monsoon'], 19)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SEED: localized_alerts (for family 1 in Hindi)
-- ============================================================================

INSERT INTO localized_alerts (id, weather_alert_id, family_id, language, title_localized, description_localized, action_items, risk_score, generated_at) VALUES
  ('b2000000-0000-0000-0000-000000000001',
   'c0000000-0000-0000-0000-000000000001',
   'f0000000-0000-0000-0000-000000000001',
   'hi',
   'Red Alert: Andheri West mein bahut bhaari baarish expected hai',
   'Andheri West (K-West Ward) mein aaj raat 204mm se adhik baarish ho sakti hai. Strong hawa 40-50 kmph. Agar aap neeche wale kshetra mein rehte hain, to turant relocate karein.',
   ARRAY['Ghar ke bahar nikale mat. Emergency kit taiyar rakhein.',
        'Agar paani ground floor tak pahunch jaye, to turant shelter (Andheri Sports Complex) jayein.',
        '2 ghante mein official update check karein.',
        'Bacchon aur buzurg members ko upar floor par le jayein.'],
   75,
   '2026-07-11T07:00:00+05:30'),

  ('b2000000-0000-0000-0000-000000000002',
   'c0000000-0000-0000-0000-000000000002',
   'f0000000-0000-0000-0000-000000000001',
   'hi',
   'Orange Alert: Andheri West mein tushaar ke saath baarish',
   'Moderate to heavy tushaar Andheri West mein isolated jagah par ho sakta hai. Lightning bhi. Window ke paas mat khade rahein.',
   ARRAY['Darakhton aur bijli ke khambon se door rahein. Plug points se sab appliances hata dein.',
        'Baarish mein nikalna na karein.'],
   65,
   '2026-07-11T07:00:00+05:30');

-- ============================================================================
-- SEED: risk_score_history
-- ============================================================================

INSERT INTO risk_score_history (family_id, score, factors, recorded_at) VALUES
  ('f0000000-0000-0000-0000-000000000001', 72, '{"weather": 0.6, "vulnerability": 0.8, "preparedness": 0.4, "housing": 0.5}', '2026-07-11T06:00:00+05:30'),
  ('f0000000-0000-0000-0000-000000000001', 68, '{"weather": 0.4, "vulnerability": 0.8, "preparedness": 0.5, "housing": 0.5}', '2026-07-08T06:00:00+05:30'),
  ('f0000000-0000-0000-0000-000000000001', 65, '{"weather": 0.3, "vulnerability": 0.8, "preparedness": 0.5, "housing": 0.5}', '2026-07-05T06:00:00+05:30'),
  ('f0000000-0000-0000-0000-000000000002', 55, '{"weather": 0.5, "vulnerability": 0.3, "preparedness": 0.6, "housing": 0.2}', '2026-07-11T06:00:00+05:30'),
  ('f0000000-0000-0000-0000-000000000003', 85, '{"weather": 0.7, "vulnerability": 0.9, "preparedness": 0.3, "housing": 0.8}', '2026-07-11T06:00:00+05:30'),
  ('f0000000-0000-0000-0000-000000000003', 82, '{"weather": 0.6, "vulnerability": 0.9, "preparedness": 0.4, "housing": 0.8}', '2026-07-09T06:00:00+05:30'),
  ('f0000000-0000-0000-0000-000000000004', 35, '{"weather": 0.4, "vulnerability": 0.2, "preparedness": 0.7, "housing": 0.1}', '2026-07-11T06:00:00+05:30'),
  ('f0000000-0000-0000-0000-000000000005', 60, '{"weather": 0.5, "vulnerability": 0.5, "preparedness": 0.5, "housing": 0.4}', '2026-07-11T06:00:00+05:30');