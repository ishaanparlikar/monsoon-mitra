-- =============================================================================
-- Monsoon Assistant: Complete Database Setup
-- Run this in Supabase Dashboard > SQL Editor to set up everything at once
-- =============================================================================

-- ============================================================================
-- PART 1: ENUMS
-- ============================================================================

CREATE TYPE IF NOT EXISTS phase AS ENUM ('pre_monsoon', 'active_monsoon', 'post_monsoon');
CREATE TYPE IF NOT EXISTS priority AS ENUM ('critical', 'high', 'medium', 'low');
CREATE TYPE IF NOT EXISTS alert_severity AS ENUM ('watch', 'alert', 'warning');
CREATE TYPE IF NOT EXISTS emergency_type AS ENUM ('medical', 'trapped', 'evacuation', 'other');
CREATE TYPE IF NOT EXISTS sos_status AS ENUM ('active', 'responded', 'resolved', 'false_alarm');
CREATE TYPE IF NOT EXISTS report_type AS ENUM ('waterlogging', 'road_closure', 'landslide', 'shelter_status', 'power_outage');
CREATE TYPE IF NOT EXISTS report_severity AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE IF NOT EXISTS verification_status AS ENUM ('unverified', 'verified', 'disputed');
CREATE TYPE IF NOT EXISTS road_condition AS ENUM ('good', 'waterlogged', 'blocked', 'unknown');
CREATE TYPE IF NOT EXISTS suitable_for AS ENUM ('vehicle', 'pedestrian', 'both');

-- ============================================================================
-- PART 2: TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone TEXT NOT NULL UNIQUE CHECK (phone ~ '^\+91[0-9]{10}$'),
  language TEXT NOT NULL DEFAULT 'en' CHECK (language IN (
    'en', 'hi', 'mr', 'gu', 'bn', 'ta', 'te', 'kn', 'ml', 'or', 'pa', 'as'
  )),
  dialect TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  primary_member UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  address TEXT,
  lat DOUBLE PRECISION CHECK (lat BETWEEN -90 AND 90),
  lng DOUBLE PRECISION CHECK (lng BETWEEN -180 AND 180),
  district TEXT DEFAULT 'Mumbai Suburban',
  ward TEXT,
  hazard_zones TEXT[] DEFAULT '{}',
  housing_type TEXT CHECK (housing_type IN ('pucca', 'semi-pucca', 'kutcha')),
  vulnerability_score DOUBLE PRECISION CHECK (vulnerability_score BETWEEN 0 AND 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  relation TEXT,
  age INTEGER CHECK (age BETWEEN 0 AND 120),
  medical_conditions TEXT[] DEFAULT '{}',
  is_vulnerable BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS preparedness_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  phase phase NOT NULL,
  generated_by TEXT,
  genai_prompt_hash TEXT,
  risk_score_at_generation INTEGER CHECK (risk_score_at_generation BETWEEN 0 AND 100),
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(family_id, phase)
);

CREATE TABLE IF NOT EXISTS checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES preparedness_plans(id) ON DELETE CASCADE,
  item_text TEXT NOT NULL,
  item_text_localized JSONB,
  priority priority NOT NULL DEFAULT 'medium',
  category TEXT,
  phase_applicability TEXT[] DEFAULT '{pre_monsoon,active_monsoon,post_monsoon}',
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS weather_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL CHECK (source IN ('IMD', 'CWC', 'ULB', 'MOCK')),
  alert_type TEXT,
  severity alert_severity NOT NULL,
  districts TEXT[] DEFAULT '{}',
  title TEXT,
  description TEXT,
  instruction TEXT,
  valid_from TIMESTAMPTZ NOT NULL,
  valid_until TIMESTAMPTZ NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS localized_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  weather_alert_id UUID NOT NULL REFERENCES weather_alerts(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  language TEXT NOT NULL CHECK (language IN (
    'en', 'hi', 'mr', 'gu', 'bn', 'ta', 'te', 'kn', 'ml', 'or', 'pa', 'as'
  )),
  title_localized TEXT,
  description_localized TEXT,
  action_items TEXT[] DEFAULT '{}',
  risk_score INTEGER CHECK (risk_score BETWEEN 0 AND 100),
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at TIMESTAMPTZ,
  UNIQUE(weather_alert_id, family_id, language)
);

CREATE TABLE IF NOT EXISTS shelters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  lat DOUBLE PRECISION NOT NULL CHECK (lat BETWEEN -90 AND 90),
  lng DOUBLE PRECISION NOT NULL CHECK (lng BETWEEN -180 AND 180),
  district TEXT DEFAULT 'Mumbai Suburban',
  ward TEXT,
  capacity INTEGER,
  current_occupancy INTEGER NOT NULL DEFAULT 0,
  facilities JSONB,
  managing_authority TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS evacuation_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_lat DOUBLE PRECISION NOT NULL,
  from_lng DOUBLE PRECISION NOT NULL,
  to_shelter_id UUID NOT NULL REFERENCES shelters(id) ON DELETE CASCADE,
  waypoints JSONB,
  distance_km DOUBLE PRECISION,
  duration_min INTEGER,
  road_condition TEXT CHECK (road_condition IN ('good', 'waterlogged', 'blocked', 'unknown')),
  suitable_for suitable_for DEFAULT 'both',
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sos_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id),
  family_id UUID REFERENCES families(id) ON DELETE SET NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  emergency_type emergency_type NOT NULL,
  description TEXT,
  status sos_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS community_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id),
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  report_type report_type NOT NULL,
  severity report_severity NOT NULL,
  description TEXT,
  photo_url TEXT,
  verification_status verification_status NOT NULL DEFAULT 'unverified',
  upvotes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS offline_cache_manifests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  device_id TEXT,
  checklist_items JSONB,
  evacuation_routes JSONB,
  shelters JSONB,
  emergency_contacts JSONB,
  last_synced TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS risk_score_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
  factors JSONB,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- PART 3: INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_families_primary_member ON families(primary_member);
CREATE INDEX IF NOT EXISTS idx_families_district ON families(district);
CREATE INDEX IF NOT EXISTS idx_family_members_family_id ON family_members(family_id);
CREATE INDEX IF NOT EXISTS idx_family_members_profile_id ON family_members(profile_id);
CREATE INDEX IF NOT EXISTS idx_preparedness_plans_family_id ON preparedness_plans(family_id);
CREATE INDEX IF NOT EXISTS idx_preparedness_plans_phase ON preparedness_plans(family_id, phase);
CREATE INDEX IF NOT EXISTS idx_checklist_items_plan_id ON checklist_items(plan_id);
CREATE INDEX IF NOT EXISTS idx_checklist_items_priority ON checklist_items(plan_id, priority);
CREATE INDEX IF NOT EXISTS idx_weather_alerts_districts ON weather_alerts USING GIN(districts);
CREATE INDEX IF NOT EXISTS idx_weather_alerts_validity ON weather_alerts(valid_from, valid_until);
CREATE INDEX IF NOT EXISTS idx_localized_alerts_family_id ON localized_alerts(family_id);
CREATE INDEX IF NOT EXISTS idx_localized_alerts_weather_alert_id ON localized_alerts(weather_alert_id);
CREATE INDEX IF NOT EXISTS idx_shelters_district ON shelters(district);
CREATE INDEX IF NOT EXISTS idx_shelters_active ON shelters(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_evacuation_routes_shelter_id ON evacuation_routes(to_shelter_id);
CREATE INDEX IF NOT EXISTS idx_sos_requests_profile_id ON sos_requests(profile_id);
CREATE INDEX IF NOT EXISTS idx_sos_requests_family_id ON sos_requests(family_id);
CREATE INDEX IF NOT EXISTS idx_sos_requests_status ON sos_requests(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_community_reports_profile_id ON community_reports(profile_id);
CREATE INDEX IF NOT EXISTS idx_community_reports_location ON community_reports(lat, lng);
CREATE INDEX IF NOT EXISTS idx_community_reports_type ON community_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_offline_cache_manifests_profile_id ON offline_cache_manifests(profile_id);
CREATE INDEX IF NOT EXISTS idx_risk_score_history_family_id ON risk_score_history(family_id);
CREATE INDEX IF NOT EXISTS idx_risk_score_history_recorded ON risk_score_history(recorded_at DESC);

-- ============================================================================
-- PART 4: TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS preparedness_plans_updated_at ON preparedness_plans;
CREATE TRIGGER preparedness_plans_updated_at
  BEFORE UPDATE ON preparedness_plans
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE FUNCTION handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.phone, '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_auth_user();

-- ============================================================================
-- PART 5: ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

ALTER TABLE families ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Family members can view family" ON families;
CREATE POLICY "Family members can view family" ON families FOR SELECT USING (
  auth.uid() = primary_member
  OR EXISTS (
    SELECT 1 FROM family_members fm
    WHERE fm.family_id = families.id AND fm.profile_id = auth.uid()
  )
);
DROP POLICY IF EXISTS "Family primary member can insert family" ON families;
CREATE POLICY "Family primary member can insert family" ON families FOR INSERT WITH CHECK (auth.uid() = primary_member);
DROP POLICY IF EXISTS "Family primary member can update family" ON families;
CREATE POLICY "Family primary member can update family" ON families FOR UPDATE USING (auth.uid() = primary_member);
DROP POLICY IF EXISTS "Family primary member can delete family" ON families;
CREATE POLICY "Family primary member can delete family" ON families FOR DELETE USING (auth.uid() = primary_member);

ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Family members can view members" ON family_members;
CREATE POLICY "Family members can view members" ON family_members FOR SELECT USING (
  auth.uid() = profile_id
  OR EXISTS (
    SELECT 1 FROM families f
    WHERE f.id = family_members.family_id
      AND f.primary_member = auth.uid()
  )
);
DROP POLICY IF EXISTS "Family primary can manage members" ON family_members;
CREATE POLICY "Family primary can manage members" ON family_members FOR ALL USING (
  EXISTS (
    SELECT 1 FROM families f
    WHERE f.id = family_members.family_id
      AND f.primary_member = auth.uid()
  )
);

ALTER TABLE preparedness_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Family can view plans" ON preparedness_plans;
CREATE POLICY "Family can view plans" ON preparedness_plans FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM families f
    WHERE f.id = preparedness_plans.family_id
      AND f.primary_member = auth.uid()
  )
);
DROP POLICY IF EXISTS "Family can manage plans" ON preparedness_plans;
CREATE POLICY "Family can manage plans" ON preparedness_plans FOR ALL USING (
  EXISTS (
    SELECT 1 FROM families f
    WHERE f.id = preparedness_plans.family_id
      AND f.primary_member = auth.uid()
  )
);

ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Family can view checklist items" ON checklist_items;
CREATE POLICY "Family can view checklist items" ON checklist_items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM preparedness_plans pp
    JOIN families f ON f.id = pp.family_id
    WHERE pp.id = checklist_items.plan_id
      AND f.primary_member = auth.uid()
  )
);
DROP POLICY IF EXISTS "Family can manage checklist items" ON checklist_items;
CREATE POLICY "Family can manage checklist items" ON checklist_items FOR ALL USING (
  EXISTS (
    SELECT 1 FROM preparedness_plans pp
    JOIN families f ON f.id = pp.family_id
    WHERE pp.id = checklist_items.plan_id
      AND f.primary_member = auth.uid()
  )
);

ALTER TABLE weather_alerts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view weather alerts" ON weather_alerts;
CREATE POLICY "Anyone can view weather alerts" ON weather_alerts FOR SELECT USING (true);
DROP POLICY IF EXISTS "Service role can manage weather alerts" ON weather_alerts;
CREATE POLICY "Service role can manage weather alerts" ON weather_alerts FOR ALL USING (auth.role() = 'service_role');

ALTER TABLE localized_alerts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Family can view localized alerts" ON localized_alerts;
CREATE POLICY "Family can view localized alerts" ON localized_alerts FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM families f
    WHERE f.id = localized_alerts.family_id
      AND f.primary_member = auth.uid()
  )
);
DROP POLICY IF EXISTS "Family can manage localized alerts" ON localized_alerts;
CREATE POLICY "Family can manage localized alerts" ON localized_alerts FOR ALL USING (
  EXISTS (
    SELECT 1 FROM families f
    WHERE f.id = localized_alerts.family_id
      AND f.primary_member = auth.uid()
  )
);

ALTER TABLE shelters ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view active shelters" ON shelters;
CREATE POLICY "Anyone can view active shelters" ON shelters FOR SELECT USING (true);
DROP POLICY IF EXISTS "Service role can manage shelters" ON shelters;
CREATE POLICY "Service role can manage shelters" ON shelters FOR ALL USING (auth.role() = 'service_role');

ALTER TABLE evacuation_routes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view evacuation routes" ON evacuation_routes;
CREATE POLICY "Anyone can view evacuation routes" ON evacuation_routes FOR SELECT USING (true);
DROP POLICY IF EXISTS "Service role can manage routes" ON evacuation_routes;
CREATE POLICY "Service role can manage routes" ON evacuation_routes FOR ALL USING (auth.role() = 'service_role');

ALTER TABLE sos_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "User can view own SOS" ON sos_requests;
CREATE POLICY "User can view own SOS" ON sos_requests FOR SELECT USING (auth.uid() = profile_id);
DROP POLICY IF EXISTS "User can create SOS" ON sos_requests;
CREATE POLICY "User can create SOS" ON sos_requests FOR INSERT WITH CHECK (auth.uid() = profile_id);
DROP POLICY IF EXISTS "User can update own SOS" ON sos_requests;
CREATE POLICY "User can update own SOS" ON sos_requests FOR UPDATE USING (auth.uid() = profile_id);

ALTER TABLE community_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view community reports" ON community_reports;
CREATE POLICY "Anyone can view community reports" ON community_reports FOR SELECT USING (true);
DROP POLICY IF EXISTS "Auth users can create reports" ON community_reports;
CREATE POLICY "Auth users can create reports" ON community_reports FOR INSERT WITH CHECK (auth.uid() = profile_id);
DROP POLICY IF EXISTS "User can update own reports" ON community_reports;
CREATE POLICY "User can update own reports" ON community_reports FOR UPDATE USING (auth.uid() = profile_id);

ALTER TABLE offline_cache_manifests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Profile can manage own cache manifest" ON offline_cache_manifests;
CREATE POLICY "Profile can manage own cache manifest" ON offline_cache_manifests FOR ALL USING (auth.uid() = profile_id);

ALTER TABLE risk_score_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Family can view risk history" ON risk_score_history;
CREATE POLICY "Family can view risk history" ON risk_score_history FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM families f
    WHERE f.id = risk_score_history.family_id
      AND f.primary_member = auth.uid()
  )
);
DROP POLICY IF EXISTS "Family can insert risk history" ON risk_score_history;
CREATE POLICY "Family can insert risk history" ON risk_score_history FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM families f
    WHERE f.id = risk_score_history.family_id
      AND f.primary_member = auth.uid()
  )
);

-- ============================================================================
-- PART 6: SEED DATA (families, shelters, alerts, plans, checklist items)
-- Note: Auth users must be created FIRST via Dashboard > Authentication
-- ============================================================================

-- Families
INSERT INTO families (id, primary_member, address, lat, lng, district, ward, hazard_zones, housing_type, vulnerability_score) VALUES
  ('f0000000-0000-0000-0000-000000000001',
   'a0000000-0000-0000-0000-000000000001',
   'B-402, Blue Hills CHS, SV Patel Road, Andheri West',
   19.1197, 72.8464,
   'Mumbai Suburban', 'K-West (Andheri West)',
   ARRAY['flood-prone', 'waterlogging'],
   'semi-pucca',
   0.68),

  ('f0000000-0000-0000-0000-000000000002',
   'a0000000-0000-0000-0000-000000000002',
   'Sector 7, Vashi, Navi Mumbai',
   19.0728, 72.9970,
   'Mumbai Suburban', 'Vashi',
   ARRAY['flood-prone'],
   'pucca',
   0.32),

  ('f0000000-0000-0000-0000-000000000003',
   'a0000000-0000-0000-0000-000000000003',
   'Hill View Society, R.B. Mehta Road, Ghatkopar East',
   19.0868, 72.9154,
   'Mumbai Suburban', 'N-Ward (Ghatkopar)',
   ARRAY['landslide-prone', 'flood-prone'],
   'kutcha',
   0.89),

  ('f0000000-0000-0000-0000-000000000004',
   'a0000000-0000-0000-0000-000000000004',
   'St. Andrews Road, Bandra West',
   19.0596, 72.8295,
   'Mumbai Suburban', 'H-West (Bandra West)',
   ARRAY[],
   'pucca',
   0.15),

  ('f0000000-0000-0000-0000-000000000005',
   'a0000000-0000-0000-0000-000000000005',
   'LBS Marg, Kurla West',
   19.0720, 72.8828,
   'Mumbai Suburban', 'L-Ward (Kurla)',
   ARRAY['waterlogging'],
   'semi-pucca',
   0.45)
ON CONFLICT (id) DO NOTHING;

-- Family Members
INSERT INTO family_members (id, family_id, profile_id, relation, age, medical_conditions, is_vulnerable) VALUES
  ('m0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'self', 35, ARRAY['asthma'], TRUE),
  ('m0000000-0000-0000-0000-000000000002', 'f0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', 'spouse', 32, ARRAY[]::TEXT[], FALSE),
  ('m0000000-0000-0000-0000-000000000003', 'f0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003', 'child', 7, ARRAY[]::TEXT[], TRUE),
  ('m0000000-0000-0000-0000-000000000004', 'f0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000004', 'elderly_parent', 68, ARRAY['diabetes', 'hypertension'], TRUE),

  ('m0000000-0000-0000-0000-000000000005', 'f0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000005', 'self', 28, ARRAY[]::TEXT[], FALSE),
  ('m0000000-0000-0000-0000-000000000006', 'f0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000006', 'spouse', 26, ARRAY[]::TEXT[], FALSE),
  ('m0000000-0000-0000-0000-000000000007', 'f0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000007', 'child', 3, ARRAY[]::TEXT[], TRUE),

  ('m0000000-0000-0000-0000-000000000008', 'f0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000008', 'self', 45, ARRAY['arthritis'], TRUE),
  ('m0000000-0000-0000-0000-000000000009', 'f0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000009', 'spouse', 42, ARRAY[]::TEXT[], FALSE),
  ('m0000000-0000-0000-0000-000000000010', 'f0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000010', 'child', 14, ARRAY[]::TEXT[], FALSE),
  ('m0000000-0000-0000-0000-000000000011', 'f0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000011', 'child', 9, ARRAY['asthma'], TRUE),

  ('m0000000-0000-0000-0000-000000000012', 'f0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000004', 'self', 30, ARRAY[]::TEXT[], FALSE),
  ('m0000000-0000-0000-0000-000000000013', 'f0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000005', 'spouse', 28, ARRAY[]::TEXT[], FALSE),

  ('m0000000-0000-0000-0000-000000000014', 'f0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000006', 'self', 40, ARRAY['diabetes'], TRUE),
  ('m0000000-0000-0000-0000-000000000015', 'f0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000007', 'spouse', 38, ARRAY[]::TEXT[], FALSE),
  ('m0000000-0000-0000-0000-000000000016', 'f0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000008', 'child', 12, ARRAY[]::TEXT[], FALSE)
ON CONFLICT (id) DO NOTHING;

-- Weather Alerts
INSERT INTO weather_alerts (id, source, alert_type, severity, districts, title, description, instruction, valid_from, valid_until, metadata) VALUES
  ('w0000000-0000-0000-0000-000000000001',
   'IMD', 'heavy_rainfall', 'warning',
   ARRAY['Mumbai Suburban', 'Mumbai City', 'Thane', 'Palghar'],
   'Red Alert: Extremely Heavy Rainfall Expected',
   'Extremely heavy rainfall (>204.4mm in 24 hours) expected at isolated places over Mumbai Suburban district. Strong winds 40-50 kmph gusting to 60 kmph. Fishermen advised not to venture into sea.',
   'Avoid all travel. Stay indoors. Keep emergency kit ready. Evacuate low-lying areas immediately if water rises. Monitor official updates every 2 hours.',
   '2026-07-11T08:00:00+05:30', '2026-07-12T08:00:00+05:30',
   '{"cap_id": "IMD-MUM-20260711-001", "probability": "high"}'),

  ('w0000000-0000-0000-0000-000000000002',
   'IMD', 'thunderstorm', 'alert',
   ARRAY['Mumbai Suburban'],
   'Orange Alert: Thunderstorm with Lightning and Gusty Winds',
   'Moderate to heavy thunderstorms with lightning and gusty winds (50-60 kmph) likely at isolated places over Mumbai Suburban district during next 12 hours.',
   'Stay away from trees, electric poles, and open fields. Unplug all electrical appliances. Do not take shelter under isolated trees.',
   '2026-07-11T12:00:00+05:30', '2026-07-12T00:00:00+05:30',
   '{"cap_id": "IMD-MUM-20260711-002", "probability": "moderate"}'),

  ('w0000000-0000-0000-0000-000000000003',
   'CWC', 'flood', 'watch',
   ARRAY['Mumbai Suburban', 'Thane'],
   'Flood Watch: Rising River Levels in Mithi and Vaitarna',
   'Mithi River and Vaitarna River water levels rising due to continuous rainfall. River levels approaching warning mark. Residents near riverbanks and low-lying areas adjacent to rivers should remain alert.',
   'Monitor water levels near your home. Keep ward control room contact ready. Prepare to evacuate if water enters ground floor. Do not attempt to cross flooded roads.',
   '2026-07-11T10:00:00+05:30', '2026-07-13T10:00:00+05:30',
   '{"river": "Mithi", "current_level_m": 4.2, "warning_level_m": 4.5, "danger_level_m": 5.0}'),

  ('w0000000-0000-0000-0000-000000000004',
   'IMD', 'landslide', 'watch',
   ARRAY['Mumbai Suburban'],
   'Yellow Watch: Landslide Risk in Hilly Areas of Eastern Suburbs',
   'Moderate rainfall over past 48 hours has saturated soil on hillsides in Powai, Ghatkopar East, and Bhandup areas. Minor landslide possible in saturated soil zones.',
   'If you live near a hillside or slope: Monitor for crack sounds or ground movement. Keep emergency contacts ready. Evacuate if directed by BMC ward officials.',
   '2026-07-11T06:00:00+05:30', '2026-07-14T06:00:00+05:30',
   '{"affected_wards": ["N-Ward (Ghatkopar)", "S-Ward (Bhandup)", "R-Central (Powai)"]}')
ON CONFLICT (id) DO NOTHING;

-- Shelters
INSERT INTO shelters (id, name, address, lat, lng, district, ward, capacity, current_occupancy, facilities, managing_authority, is_active) VALUES
  ('s0000000-0000-0000-0000-000000000001',
   'Andheri Sports Complex',
   'JVP Scheme, Opposite Andheri Fire Station, Andheri West',
   19.1075, 72.8261, 'Mumbai Suburban', 'K-West',
   500, 120,
   '{"water": true, "toilets": true, "medical": true, "food": true, "power_backup": true, "wheelchair_accessible": true}',
   'BMC K-West Ward', TRUE),

  ('s0000000-0000-0000-0000-000000000002',
   'St. Andrews High School',
   'St. Andrews Road, Bandra West',
   19.0596, 72.8295, 'Mumbai Suburban', 'H-West',
   300, 45,
   '{"water": true, "toilets": true, "medical": false, "food": true, "power_backup": false}',
   'BMC H-West Ward', TRUE),

  ('s0000000-0000-0000-0000-000000000003',
   'Vashi Municipal School',
   'Sector 15, Vashi, Navi Mumbai',
   19.0760, 72.9943, 'Mumbai Suburban', 'Vashi',
   400, 200,
   '{"water": true, "toilets": true, "medical": true, "food": true, "power_backup": true}',
   'NMMC Vashi Ward', TRUE),

  ('s0000000-0000-0000-0000-000000000004',
   'Ghatkopar Community Center',
   'R.B. Mehta Marg, Ghatkopar East',
   19.0842, 72.9105, 'Mumbai Suburban', 'N-Ward',
   250, 80,
   '{"water": true, "toilets": true, "medical": false, "food": false, "power_backup": false}',
   'BMC N-Ward', TRUE),

  ('s0000000-0000-0000-0000-000000000005',
   'Kurla Bus Depot Shelter',
   'LBS Marg, Kurla West',
   19.0720, 72.8828, 'Mumbai Suburban', 'L-Ward',
   350, 150,
   '{"water": true, "toilets": true, "medical": true, "food": true, "power_backup": true}',
   'BMC L-Ward', TRUE),

  ('s0000000-0000-0000-0000-000000000006',
   'Powai Cricket Ground Shelter',
   'Powai Lake Road, Powai',
   19.1180, 72.9080, 'Mumbai Suburban', 'S-Ward',
   200, 30,
   '{"water": true, "toilets": true, "medical": false, "food": true, "power_backup": false}',
   'BMC S-Ward', TRUE),

  ('s0000000-0000-0000-0000-000000000007',
   'Bandra Tram Depot Shelter',
   'Bandra Tram Depo, Waterfield Road, Bandra West',
   19.0550, 72.8350, 'Mumbai Suburban', 'H-West',
   180, 25,
   '{"water": true, "toilets": true, "medical": true, "food": true, "power_backup": true}',
   'BMC H-West Ward', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Preparedness Plans
INSERT INTO preparedness_plans (id, family_id, phase, generated_by, risk_score_at_generation, status) VALUES
  ('p0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', 'pre_monsoon', 'system', 72, 'active'),
  ('p0000000-0000-0000-0000-000000000002', 'f0000000-0000-0000-0000-000000000002', 'pre_monsoon', 'system', 55, 'active'),
  ('p0000000-0000-0000-0000-000000000003', 'f0000000-0000-0000-0000-000000000003', 'active_monsoon', 'system', 85, 'active'),
  ('p0000000-0000-0000-0000-000000000004', 'f0000000-0000-0000-0000-000000000004', 'pre_monsoon', 'system', 35, 'active'),
  ('p0000000-0000-0000-0000-000000000005', 'f0000000-0000-0000-0000-000000000005', 'active_monsoon', 'system', 60, 'active')
ON CONFLICT (id) DO NOTHING;

-- Checklist Items (for family 1 - Andheri West high-risk)
INSERT INTO checklist_items (id, plan_id, item_text, priority, category, phase_applicability, sort_order) VALUES
  ('ci000000-0000-0000-0000-000000000001', 'p0000000-0000-0000-0000-000000000001',
   'Elevate all electrical sockets and appliances above potential flood level (minimum 4 feet)',
   'critical', 'home_prep', ARRAY['pre_monsoon'], 1),
  ('ci000000-0000-0000-0000-000000000002', 'p0000000-0000-0000-0000-000000000001',
   'Clear roof drains, balconies, and surroundings of debris and leaves',
   'high', 'home_prep', ARRAY['pre_monsoon', 'active_monsoon'], 2),
  ('ci000000-0000-0000-0000-000000000003', 'p0000000-0000-0000-0000-000000000001',
   'Check and repair window seals and door weather strips',
   'medium', 'home_prep', ARRAY['pre_monsoon'], 3),
  ('ci000000-0000-0000-0000-000000000004', 'p0000000-0000-0000-0000-000000000001',
   'Charge power banks (10,000mAh+) and arrange battery-powered radio',
   'high', 'home_prep', ARRAY['pre_monsoon'], 4),
  ('ci000000-0000-0000-0000-000000000005', 'p0000000-0000-0000-0000-000000000001',
   'Store Aadhaar, PAN, property documents, insurance papers in waterproof bags',
   'critical', 'documents', ARRAY['pre_monsoon'], 5),
  ('ci000000-0000-0000-0000-000000000006', 'p0000000-0000-0000-0000-000000000001',
   'Photocopy all important documents and store copies with trusted neighbor outside flood zone',
   'high', 'documents', ARRAY['pre_monsoon'], 6),
  ('ci000000-0000-0000-0000-000000000007', 'p0000000-0000-0000-0000-000000000001',
   'Digitize medical records and prescriptions, store in phone and cloud',
   'medium', 'documents', ARRAY['pre_monsoon'], 7),
  ('ci000000-0000-0000-0000-000000000008', 'p0000000-0000-0000-0000-000000000001',
   'Assemble 72-hour emergency kit: 9L water (3L/person for 3 days), dry food (biscuits, poha, thekua)',
   'critical', 'emergency_kit', ARRAY['pre_monsoon'], 8),
  ('ci000000-0000-0000-0000-000000000009', 'p0000000-0000-0000-0000-000000000001',
   'Pack flashlight with extra batteries, candle, matchbox, and lighter',
   'high', 'emergency_kit', ARRAY['pre_monsoon'], 9),
  ('ci000000-0000-0000-0000-000000000010', 'p0000000-0000-0000-0000-000000000001',
   'Include dust mask (N95), rubber gloves, and plastic tarpaulin sheets',
   'medium', 'emergency_kit', ARRAY['pre_monsoon'], 10),
  ('ci000000-0000-0000-0000-000000000011', 'p0000000-0000-0000-0000-000000000001',
   'Identify nearest shelter (Andheri Sports Complex) and pre-plan walking/driving route',
   'critical', 'evacuation', ARRAY['pre_monsoon', 'active_monsoon'], 11),
  ('ci000000-0000-0000-0000-000000000012', 'p0000000-0000-0000-0000-000000000001',
   'Pack go-bag for family with change of clothes, toiletries, important docs',
   'high', 'evacuation', ARRAY['pre_monsoon'], 12),
  ('ci000000-0000-0000-0000-000000000013', 'p0000000-0000-0000-0000-000000000001',
   'Identify alternate shelter in case primary shelter is full (St. Andrews HS, Bandra)',
   'medium', 'evacuation', ARRAY['pre_monsoon'], 13),
  ('ci000000-0000-0000-0000-000000000014', 'p0000000-0000-0000-0000-000000000001',
   'Stock 2-week supply of all regular medications (asthma inhalers, BP/diabetes meds)',
   'critical', 'health', ARRAY['pre_monsoon', 'active_monsoon'], 14),
  ('ci000000-0000-0000-0000-000000000015', 'p0000000-0000-0000-0000-000000000001',
   'Pack first aid kit: bandages, antiseptic, paracetamol, ORS packets, thermometer',
   'high', 'health', ARRAY['pre_monsoon'], 15),
  ('ci000000-0000-0000-0000-000000000016', 'p0000000-0000-0000-0000-000000000001',
   'Coordinate with elderly parent''s doctor for emergency prescription refills before monsoon',
   'high', 'health', ARRAY['pre_monsoon'], 16),
  ('ci000000-0000-0000-0000-000000000017', 'p0000000-0000-0000-0000-000000000001',
   'Save emergency contacts offline in phone: Ward control room, shelter, ambulance 108, disaster helpline 1077',
   'critical', 'communication', ARRAY['pre_monsoon'], 17),
  ('ci000000-0000-0000-0000-000000000018', 'p0000000-0000-0000-0000-000000000001',
   'Identify out-of-town emergency contact who can coordinate for family',
   'high', 'communication', ARRAY['pre_monsoon'], 18),
  ('ci000000-0000-0000-0000-000000000019', 'p0000000-0000-0000-0000-000000000001',
   'Download offline maps of Mumbai Suburban district to phone',
   'medium', 'communication', ARRAY['pre_monsoon'], 19)
ON CONFLICT (id) DO NOTHING;

-- Evacuation Routes
INSERT INTO evacuation_routes (id, from_lat, from_lng, to_shelter_id, waypoints, distance_km, duration_min, road_condition, suitable_for) VALUES
  ('r0000000-0000-0000-0000-000000000001',
   19.1197, 72.8464, 's0000000-0000-0000-0000-000000000001',
   '[{"lat": 19.1197, "lng": 72.8464, "instruction": "Start: Blue Hills CHS entrance, Andheri West"},
    {"lat": 19.1150, "lng": 72.8400, "instruction": "Turn left on SV Road towards Andheri Station"},
    {"lat": 19.1100, "lng": 72.8320, "instruction": "Continue on Link Road northbound"},
    {"lat": 19.1075, "lng": 72.8261, "instruction": "Arrive: Andheri Sports Complex shelter entrance"}]',
   3.2, 12, 'waterlogged', 'vehicle'),

  ('r0000000-0000-0000-0000-000000000002',
   19.1197, 72.8464, 's0000000-0000-0000-0000-000000000001',
   '[{"lat": 19.1197, "lng": 72.8464, "instruction": "Start: Blue Hills CHS, use society internal road"},
    {"lat": 19.1170, "lng": 72.8420, "instruction": "Walk via internal road to Link Road"},
    {"lat": 19.1100, "lng": 72.8320, "instruction": "Cross Link Road at pedestrian crossing"},
    {"lat": 19.1075, "lng": 72.8261, "instruction": "Arrive: Andheri Sports Complex"}]',
   2.8, 35, 'waterlogged', 'pedestrian'),

  ('r0000000-0000-0000-0000-000000000003',
   19.0868, 72.9154, 's0000000-0000-0000-0000-000000000004',
   '[{"lat": 19.0868, "lng": 72.9154, "instruction": "Start: Hill View Society, Ghatkopar East"},
    {"lat": 19.0850, "lng": 72.9120, "instruction": "Take R.B. Mehta Marg towards station"},
    {"lat": 19.0842, "lng": 72.9105, "instruction": "Arrive: Ghatkopar Community Center"}]',
   0.8, 5, 'good', 'both'),

  ('r0000000-0000-0000-0000-000000000004',
   19.0720, 72.8828, 's0000000-0000-0000-0000-000000000005',
   '[{"lat": 19.0720, "lng": 72.8828, "instruction": "Start: LBS Marg, Kurla West"},
    {"lat": 19.0710, "lng": 72.8810, "instruction": "Walk east on LBS Marg"},
    {"lat": 19.0720, "lng": 72.8828, "instruction": "Arrive: Kurla Bus Depot Shelter"}]',
   0.4, 8, 'good', 'both'),

  ('r0000000-0000-0000-0000-000000000005',
   19.0596, 72.8295, 's0000000-0000-0000-0000-000000000002',
   '[{"lat": 19.0596, "lng": 72.8295, "instruction": "Start: St. Andrews Road, Bandra West"},
    {"lat": 19.0596, "lng": 72.8295, "instruction": "Arrive: St. Andrews High School shelter"}]',
   0.2, 3, 'good', 'both')
ON CONFLICT (id) DO NOTHING;

-- Risk Score History
INSERT INTO risk_score_history (family_id, score, factors, recorded_at) VALUES
  ('f0000000-0000-0000-0000-000000000001', 72, '{"weather": 0.6, "vulnerability": 0.8, "preparedness": 0.4, "housing": 0.5}', '2026-07-11T06:00:00+05:30'),
  ('f0000000-0000-0000-0000-000000000001', 68, '{"weather": 0.4, "vulnerability": 0.8, "preparedness": 0.5, "housing": 0.5}', '2026-07-08T06:00:00+05:30'),
  ('f0000000-0000-0000-0000-000000000001', 65, '{"weather": 0.3, "vulnerability": 0.8, "preparedness": 0.5, "housing": 0.5}', '2026-07-05T06:00:00+05:30'),
  ('f0000000-0000-0000-0000-000000000002', 55, '{"weather": 0.5, "vulnerability": 0.3, "preparedness": 0.6, "housing": 0.2}', '2026-07-11T06:00:00+05:30'),
  ('f0000000-0000-0000-0000-000000000003', 85, '{"weather": 0.7, "vulnerability": 0.9, "preparedness": 0.3, "housing": 0.8}', '2026-07-11T06:00:00+05:30'),
  ('f0000000-0000-0000-0000-000000000003', 82, '{"weather": 0.6, "vulnerability": 0.9, "preparedness": 0.4, "housing": 0.8}', '2026-07-09T06:00:00+05:30'),
  ('f0000000-0000-0000-0000-000000000004', 35, '{"weather": 0.4, "vulnerability": 0.2, "preparedness": 0.7, "housing": 0.1}', '2026-07-11T06:00:00+05:30'),
  ('f0000000-0000-0000-0000-000000000005', 60, '{"weather": 0.5, "vulnerability": 0.5, "preparedness": 0.5, "housing": 0.4}', '2026-07-11T06:00:00+05:30');

-- ============================================================================
-- DONE!
-- ============================================================================

SELECT 'Database setup complete!' AS status;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
