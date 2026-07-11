import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getActivePlan, getActiveAlerts, getRiskScore } from '@/lib/api';
import { DashboardUI } from '@/components/dashboard/DashboardUI';
import { PreparednessPhase } from '@/types';

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

  const alerts = await getActiveAlerts(district);

  return (
    <DashboardUI
      initialChecklist={checklist}
      planDetails={plan}
      alerts={alerts}
      riskScore={riskScore}
    />
  );
}
