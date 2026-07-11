import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getActivePlan, getActiveAlerts, getRiskScore } from '@/lib/api';
import { DashboardUI } from '@/components/dashboard/DashboardUI';
import { PreparednessPhase } from '@/types';

// Hardcoded default family for hackathon demo (no Supabase seeding needed)
const MOCK_CHECKLIST = [
  { id: 'm1', item_text: 'Elevate electrical sockets & appliances above 4 feet', category: 'home_prep', priority: 'critical', is_completed: false, phase_applicability: ['pre_monsoon'] },
  { id: 'm2', item_text: 'Clear roof drains, balconies & surroundings of debris', category: 'home_prep', priority: 'high', is_completed: true, phase_applicability: ['pre_monsoon', 'active_monsoon'] },
  { id: 'm3', item_text: 'Waterproof doors & windows with weather stripping', category: 'home_prep', priority: 'medium', is_completed: false, phase_applicability: ['pre_monsoon'] },
  { id: 'm4', item_text: 'Charge power banks (10,000mAh+) and battery torch', category: 'home_prep', priority: 'high', is_completed: false, phase_applicability: ['pre_monsoon'] },
  { id: 'm5', item_text: 'Store Aadhaar, PAN, property docs in waterproof bags', category: 'documents', priority: 'critical', is_completed: false, phase_applicability: ['pre_monsoon'] },
  { id: 'm6', item_text: 'Digitize medical records and store in cloud + phone', category: 'documents', priority: 'high', is_completed: true, phase_applicability: ['pre_monsoon'] },
  { id: 'm7', item_text: 'Assemble 72-hour emergency kit: 9L water, dry food, first aid', category: 'emergency_kit', priority: 'critical', is_completed: false, phase_applicability: ['pre_monsoon'] },
  { id: 'm8', item_text: 'Pack flashlight, candle, matchbox, lighter, dust mask N95', category: 'emergency_kit', priority: 'high', is_completed: false, phase_applicability: ['pre_monsoon'] },
  { id: 'm9', item_text: 'Pack go-bag for vulnerable members: meds, 3-day supply', category: 'health', priority: 'high', is_completed: false, phase_applicability: ['pre_monsoon'] },
  { id: 'm10', item_text: 'Stock 2-week supply of regular medications (inhalers, BP meds)', category: 'health', priority: 'critical', is_completed: false, phase_applicability: ['pre_monsoon', 'active_monsoon'] },
  { id: 'm11', item_text: 'Identify nearest shelter & pre-plan walking/driving route', category: 'evacuation', priority: 'critical', is_completed: false, phase_applicability: ['pre_monsoon', 'active_monsoon'] },
  { id: 'm12', item_text: 'Save emergency contacts offline: ward office, 108, 1077', category: 'communication', priority: 'critical', is_completed: true, phase_applicability: ['pre_monsoon'] },
  { id: 'm13', item_text: 'Download offline maps of Mumbai Suburban district', category: 'communication', priority: 'medium', is_completed: false, phase_applicability: ['pre_monsoon'] },
  { id: 'm14', item_text: 'Review home/health insurance flood damage coverage', category: 'documents', priority: 'medium', is_completed: false, phase_applicability: ['pre_monsoon'] },
  { id: 'm15', item_text: 'Prepare pet/livestock evacuation plan with carrier & food', category: 'health', priority: 'low', is_completed: false, phase_applicability: ['pre_monsoon'] },
];

const MOCK_ALERTS = [
  { id: 'a1', title: 'Red Alert: Extremely Heavy Rainfall', description: 'Heavy rainfall (64.5–204.4mm) expected in Mumbai Suburban. Strong winds 40–50 kmph. Fishermen advised not to venture into sea.', severity: 'warning', instruction: 'Avoid all travel. Stay indoors. Keep emergency kit ready.', alert_type: 'heavy_rainfall' },
  { id: 'a2', title: 'Orange Alert: Thunderstorm with Lightning', description: 'Moderate to heavy thunderstorms with lightning and gusty winds (50–60 kmph) over Mumbai Suburban.', severity: 'alert', instruction: 'Stay away from trees and electric poles. Unplug electrical appliances.', alert_type: 'thunderstorm' },
  { id: 'a3', title: 'Flood Watch: Mithi River Rising', description: 'Mithi River water levels approaching warning mark due to continuous rainfall. Low-lying areas adjacent to rivers should be alert.', severity: 'watch', instruction: 'Monitor water levels near your home. Prepare to evacuate if water enters ground floor.', alert_type: 'flood' },
];

export default async function DashboardPage() {
  const supabase = createServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user) {
    redirect('/login');
  }

  const { data: familyProfile } = await supabase
    .from('families')
    .select('id, district')
    .eq('primary_member', session.user.id)
    .single<{ id: string; district: string | null }>();

  // HACKATHON: fallback to first family if no family linked to user
  let familyId: string | null = familyProfile?.id ?? null;
  let district = familyProfile?.district || 'Mumbai Suburban';

  if (!familyId) {
    const { data: firstFamily } = await supabase
      .from('families')
      .select('id, district')
      .limit(1)
      .single<{ id: string; district: string | null }>();
    if (firstFamily) {
      familyId = firstFamily.id;
      district = firstFamily.district || 'Mumbai Suburban';
    }
  }

  let plan = null;
  let checklist: any[] = [];
  let riskScore = 0;

  if (familyId) {
    const fetchedPlan = await getActivePlan(familyId, 'pre_monsoon' as PreparednessPhase);
    if (fetchedPlan) {
      plan = fetchedPlan;
      checklist = fetchedPlan.checklistItems || [];
    }
    riskScore = await getRiskScore(familyId);
  }

  // HACKATHON: use mock data when no family in DB
  const hasNoData = checklist.length === 0;
  if (hasNoData) {
    checklist = MOCK_CHECKLIST;
    riskScore = 72;
    plan = {
      id: 'mock-plan',
      family_id: familyId ?? 'demo',
      phase: 'pre_monsoon' as PreparednessPhase,
      summary: 'Your family of 4 in Andheri West has a monsoon risk score of 72/100. Prioritize evacuation prep and emergency kit.',
    };
  }

  const alerts = hasNoData ? MOCK_ALERTS : await getActiveAlerts(district);

  return (
    <DashboardUI
      initialChecklist={checklist}
      planDetails={plan}
      alerts={alerts}
      riskScore={riskScore}
    />
  );
}
