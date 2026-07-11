-- Monsoon Assistant: Initial Schema Migration
-- Mumbai Suburban District Monsoon Preparedness PWA
-- All tables match types/database.ts exactly
-- Run: supabase db push  (from project root)

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE phase AS ENUM ('pre_monsoon', 'active_monsoon', 'post_monsoon');
CREATE TYPE priority AS ENUM ('critical', 'high', 'medium', 'low');
CREATE TYPE alert_severity AS ENUM ('watch', 'alert', 'warning');
CREATE TYPE emergency_type AS ENUM ('medical', 'trapped', 'evacuation', 'other');
CREATE TYPE sos_status AS ENUM ('active', 'responded', 'resolved', 'false_alarm');
CREATE TYPE report_type AS ENUM ('waterlogging', 'road_closure', 'landslide', 'shelter_status', 'power_outage');
CREATE TYPE report_severity AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE verification_status AS ENUM ('unverified', 'verified', 'disputed');
CREATE TYPE road_condition AS ENUM ('good', 'waterlogged', 'blocked', 'unknown');
CREATE TYPE suitable_for AS ENUM ('vehicle', 'pedestrian', 'both');

-- ============================================================================
-- TABLE: profiles
-- id references auth.users(id). Profiles auto-created via auth trigger.
-- ============================================================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone TEXT NOT NULL UNIQUE CHECK (phone ~ '^\+91[0-9]{10}$'),
  language TEXT NOT NULL DEFAULT 'en' CHECK (language IN (
    'en', 'hi', 'mr', 'gu', 'bn', 'ta', 'te', 'kn', 'ml', 'or', 'pa', 'as'
  )),
  dialect TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE families (
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

CREATE TABLE family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  relation TEXT,
  age INTEGER CHECK (age BETWEEN 0 AND 120),
  medical_conditions TEXT[] DEFAULT '{}',
  is_vulnerable BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE preparedness_plans (
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

CREATE TABLE checklist_items (
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

CREATE TABLE weather_alerts (
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

CREATE TABLE localized_alerts (
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

CREATE TABLE shelters (
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

CREATE TABLE evacuation_routes (
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

CREATE TABLE sos_requests (
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

CREATE TABLE community_reports (
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

CREATE TABLE offline_cache_manifests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  device_id TEXT,
  checklist_items JSONB,
  evacuation_routes JSONB,
  shelters JSONB,
  emergency_contacts JSONB,
  last_synced TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE risk_score_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
  factors JSONB,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_families_primary_member ON families(primary_member);
CREATE INDEX idx_families_district ON families(district);
CREATE INDEX idx_family_members_family_id ON family_members(family_id);
CREATE INDEX idx_family_members_profile_id ON family_members(profile_id);
CREATE INDEX idx_preparedness_plans_family_id ON preparedness_plans(family_id);
CREATE INDEX idx_preparedness_plans_phase ON preparedness_plans(family_id, phase);
CREATE INDEX idx_checklist_items_plan_id ON checklist_items(plan_id);
CREATE INDEX idx_checklist_items_priority ON checklist_items(plan_id, priority);
CREATE INDEX idx_weather_alerts_districts ON weather_alerts USING GIN(districts);
CREATE INDEX idx_weather_alerts_validity ON weather_alerts(valid_from, valid_until);
CREATE INDEX idx_localized_alerts_family_id ON localized_alerts(family_id);
CREATE INDEX idx_localized_alerts_weather_alert_id ON localized_alerts(weather_alert_id);
CREATE INDEX idx_shelters_district ON shelters(district);
CREATE INDEX idx_shelters_active ON shelters(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_evacuation_routes_shelter_id ON evacuation_routes(to_shelter_id);
CREATE INDEX idx_sos_requests_profile_id ON sos_requests(profile_id);
CREATE INDEX idx_sos_requests_family_id ON sos_requests(family_id);
CREATE INDEX idx_sos_requests_status ON sos_requests(status) WHERE status = 'active';
CREATE INDEX idx_community_reports_profile_id ON community_reports(profile_id);
CREATE INDEX idx_community_reports_location ON community_reports(lat, lng);
CREATE INDEX idx_community_reports_type ON community_reports(report_type);
CREATE INDEX idx_offline_cache_manifests_profile_id ON offline_cache_manifests(profile_id);
CREATE INDEX idx_risk_score_history_family_id ON risk_score_history(family_id);
CREATE INDEX idx_risk_score_history_recorded ON risk_score_history(recorded_at DESC);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER preparedness_plans_updated_at
  BEFORE UPDATE ON preparedness_plans
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Auto-create profile on auth.user creation (set phone in metadata for retrieval)
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

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_auth_user();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

ALTER TABLE families ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Family members can view family" ON families
  FOR SELECT USING (
    auth.uid() = primary_member
    OR EXISTS (
      SELECT 1 FROM family_members fm
      WHERE fm.family_id = families.id AND fm.profile_id = auth.uid()
    )
  );
CREATE POLICY "Primary member can insert family" ON families
  FOR INSERT WITH CHECK (auth.uid() = primary_member);
CREATE POLICY "Primary member can update family" ON families
  FOR UPDATE USING (auth.uid() = primary_member);
CREATE POLICY "Primary member can delete family" ON families
  FOR DELETE USING (auth.uid() = primary_member);

ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Family members can view members" ON family_members
  FOR SELECT USING (
    auth.uid() = profile_id
    OR EXISTS (
      SELECT 1 FROM families f
      WHERE f.id = family_members.family_id
        AND f.primary_member = auth.uid()
    )
  );
CREATE POLICY "Family primary can manage members" ON family_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM families f
      WHERE f.id = family_members.family_id
        AND f.primary_member = auth.uid()
    )
  );

ALTER TABLE preparedness_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Family can view plans" ON preparedness_plans
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM families f
      WHERE f.id = preparedness_plans.family_id
        AND f.primary_member = auth.uid()
    )
  );
CREATE POLICY "Family can manage plans" ON preparedness_plans
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM families f
      WHERE f.id = preparedness_plans.family_id
        AND f.primary_member = auth.uid()
    )
  );

ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Family can view checklist items" ON checklist_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM preparedness_plans pp
      JOIN families f ON f.id = pp.family_id
      WHERE pp.id = checklist_items.plan_id
        AND f.primary_member = auth.uid()
    )
  );
CREATE POLICY "Family can manage checklist items" ON checklist_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM preparedness_plans pp
      JOIN families f ON f.id = pp.family_id
      WHERE pp.id = checklist_items.plan_id
        AND f.primary_member = auth.uid()
    )
  );

ALTER TABLE weather_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view weather alerts" ON weather_alerts
  FOR SELECT USING (true);
CREATE POLICY "Service role can manage weather alerts" ON weather_alerts
  FOR ALL USING (auth.role() = 'service_role');

ALTER TABLE localized_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Family can view localized alerts" ON localized_alerts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM families f
      WHERE f.id = localized_alerts.family_id
        AND f.primary_member = auth.uid()
    )
  );
CREATE POLICY "Family can manage localized alerts" ON localized_alerts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM families f
      WHERE f.id = localized_alerts.family_id
        AND f.primary_member = auth.uid()
    )
  );

ALTER TABLE shelters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active shelters" ON shelters
  FOR SELECT USING (true);
CREATE POLICY "Service role can manage shelters" ON shelters
  FOR ALL USING (auth.role() = 'service_role');

ALTER TABLE evacuation_routes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view evacuation routes" ON evacuation_routes
  FOR SELECT USING (true);
CREATE POLICY "Service role can manage routes" ON evacuation_routes
  FOR ALL USING (auth.role() = 'service_role');

ALTER TABLE sos_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User can view own SOS" ON sos_requests
  FOR SELECT USING (auth.uid() = profile_id);
CREATE POLICY "User can create SOS" ON sos_requests
  FOR INSERT WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "User can update own SOS" ON sos_requests
  FOR UPDATE USING (auth.uid() = profile_id);

ALTER TABLE community_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view community reports" ON community_reports
  FOR SELECT USING (true);
CREATE POLICY "Auth users can create reports" ON community_reports
  FOR INSERT WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "User can update own reports" ON community_reports
  FOR UPDATE USING (auth.uid() = profile_id);

ALTER TABLE offline_cache_manifests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profile can manage own cache manifest" ON offline_cache_manifests
  FOR ALL USING (auth.uid() = profile_id);

ALTER TABLE risk_score_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Family can view risk history" ON risk_score_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM families f
      WHERE f.id = risk_score_history.family_id
        AND f.primary_member = auth.uid()
    )
  );
CREATE POLICY "Family can insert risk history" ON risk_score_history
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM families f
      WHERE f.id = risk_score_history.family_id
        AND f.primary_member = auth.uid()
    )
  );