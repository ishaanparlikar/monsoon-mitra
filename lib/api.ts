import { createServerClient } from '@/lib/supabase/server';
import type {
  Family,
  FamilyMember,
  WeatherAlert,
  Shelter,
  EvacuationRoute,
  PreparednessPhase,
} from '@/types';

// Family API
export async function getFamily(familyId: string): Promise<Family | null> {
  const supabase = createServerClient() as any;
  const { data, error } = await supabase
    .from('families')
    .select('*')
    .eq('id', familyId)
    .single();

  if (error) {
    console.error('getFamily error:', error);
    return null;
  }
  return data;
}

export async function getFamilyWithMembers(familyId: string): Promise<{ family: Family; members: FamilyMember[] } | null> {
  const supabase = createServerClient() as any;
  const { data: family, error: familyError } = await supabase
    .from('families')
    .select('*')
    .eq('id', familyId)
    .single();

  if (familyError || !family) {
    return null;
  }

  const { data: members } = await supabase
    .from('family_members')
    .select('*')
    .eq('family_id', familyId);

  return { family, members: members || [] };
}

// Plan API
export async function getActivePlan(familyId: string, phase: PreparednessPhase): Promise<any> {
  const supabase = createServerClient() as any;
  // Fetch from preparedness_plans where family_id = familyId and phase = phase
  const { data: plan, error } = await supabase
    .from('preparedness_plans')
    .select('*')
    .eq('family_id', familyId)
    .eq('phase', phase)
    .single();

  if (error || !plan) {
    return null;
  }

  // Fetch checklist items
  const { data: items } = await supabase
    .from('checklist_items')
    .select('*')
    .eq('plan_id', plan.id)
    .order('sort_order', { ascending: true });

  return {
    ...plan,
    checklistItems: items || [],
  };
}

export async function getPlanForLanguage(familyId: string, phase: PreparednessPhase, _language: string): Promise<any> {
  // In a real implementation this would merge localize fields, for now we just return the plan
  return getActivePlan(familyId, phase);
}

// Alerts API
export async function getActiveAlerts(district: string): Promise<WeatherAlert[]> {
  const supabase = createServerClient() as any;
  const { data, error } = await supabase
    .from('weather_alerts')
    .select('*')
    .overlaps('districts', [district])
    .gte('valid_until', new Date().toISOString());

  if (error) {
    console.error('getActiveAlerts error:', error);
    return [];
  }
  return data || [];
}

export async function getLocalizedAlerts(familyId: string, language: string): Promise<any[]> {
  const supabase = createServerClient() as any;
  const { data, error } = await supabase
    .from('localized_alerts')
    .select('*, weather_alert:weather_alerts(*)')
    .eq('family_id', familyId)
    .eq('language', language);
    
  if (error) {
    console.error('getLocalizedAlerts error:', error);
    return [];
  }
  return data || [];
}

// Shelters API
export async function getSheltersNearFamily(familyId: string): Promise<Shelter[]> {
  const family = await getFamily(familyId);
  if (!family || !family.lat || !family.lng) return [];

  const supabase = createServerClient() as any;
  // We can just fetch active shelters. For real distance querying, we'd use PostGIS
  const { data, error } = await supabase
    .from('shelters')
    .select('*')
    .eq('is_active', true);

  if (error) {
    console.error('getSheltersNearFamily error:', error);
    return [];
  }
  return data || [];
}

export async function getShelterById(shelterId: string): Promise<Shelter | null> {
  const supabase = createServerClient() as any;
  const { data, error } = await supabase
    .from('shelters')
    .select('*')
    .eq('id', shelterId)
    .single();

  return error ? null : data;
}

// Routes API
export async function getRoutesToShelter(familyId: string, shelterId: string): Promise<EvacuationRoute[]> {
  const supabase = createServerClient() as any;
  const { data, error } = await supabase
    .from('evacuation_routes')
    .select('*')
    .eq('to_shelter_id', shelterId); // Ideally should filter by distance from family using st_distance

  return error ? [] : (data || []);
}

export function calculateRiskScore(
  family: Pick<Family, 'hazard_zones' | 'housing_type' | 'vulnerability_score'>,
  members: Pick<FamilyMember, 'is_vulnerable'>[],
  alerts: Pick<WeatherAlert, 'severity'>[]
): number {
  let score = 30;

  if (family.hazard_zones?.includes('flood-prone')) score += 25;
  if (family.hazard_zones?.includes('landslide-prone')) score += 20;
  if (family.hazard_zones?.includes('waterlogging')) score += 15;

  if (family.housing_type === 'kutcha') score += 20;
  else if (family.housing_type === 'semi-pucca') score += 10;

  score += Math.round((family.vulnerability_score || 0) * 20);

  const vulnerableCount = members.filter(m => m.is_vulnerable).length;
  score += vulnerableCount * 5;

  const maxSeverity = alerts.reduce((max, a) => {
    const severity = a.severity === 'warning' ? 3 : a.severity === 'alert' ? 2 : 1;
    return Math.max(max, severity);
  }, 0);
  score += maxSeverity * 10;

  return Math.min(100, Math.max(0, score));
}

// Risk Score API
export async function getRiskScore(familyId: string): Promise<number> {
  const supabase = createServerClient() as any;
  const { data, error } = await supabase
    .from('risk_score_history')
    .select('score')
    .eq('family_id', familyId)
    .order('recorded_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return 0; // default
  }
  return data.score;
}

// Checklist API
export async function updateChecklistItem(
  planId: string,
  itemId: string,
  isCompleted: boolean
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServerClient() as any;
  
  const { error } = await supabase
    .from('checklist_items')
    .update({ 
      is_completed: isCompleted,
      completed_at: isCompleted ? new Date().toISOString() : null
    })
    .eq('id', itemId)
    .eq('plan_id', planId);

  if (error) {
    console.error('updateChecklistItem error:', error);
    return { success: false, error: error.message };
  }
  return { success: true };
}

// SOS API
export async function createSOSRequest(data: {
  familyId: string;
  lat: number;
  lng: number;
  emergencyType: 'medical' | 'trapped' | 'evacuation' | 'other';
  description?: string;
}): Promise<{ id: string | null }> {
  const supabase = createServerClient() as any;
  
  // Need profile_id: get from auth
  const { data: { session } } = await supabase.auth.getSession();
  const profileId = session?.user?.id;
  
  if (!profileId) return { id: null };
  
  const { data: sos, error } = await supabase
    .from('sos_requests')
    .insert({
      family_id: data.familyId,
      profile_id: profileId,
      lat: data.lat,
      lng: data.lng,
      emergency_type: data.emergencyType,
      description: data.description,
      status: 'active'
    })
    .select('id')
    .single();

  if (error) {
    console.error('createSOSRequest error:', error);
    return { id: null };
  }
  return { id: sos.id };
}

// Community Reports API
export async function createCommunityReport(data: {
  profileId: string;
  lat: number;
  lng: number;
  reportType: 'waterlogging' | 'road_closure' | 'landslide' | 'shelter_status' | 'power_outage';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description?: string;
  photoUrl?: string;
}): Promise<{ id: string | null }> {
  const supabase = createServerClient() as any;
  
  const { data: report, error } = await supabase
    .from('community_reports')
    .insert({
      profile_id: data.profileId,
      lat: data.lat,
      lng: data.lng,
      report_type: data.reportType,
      severity: data.severity,
      description: data.description,
      photo_url: data.photoUrl,
    })
    .select('id')
    .single();

  if (error) {
    console.error('createCommunityReport error:', error);
    return { id: null };
  }
  return { id: report.id };
}