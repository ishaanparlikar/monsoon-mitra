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

  if (!familyProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted">No family profile found. Please contact support.</p>
      </div>
    );
  }

  const familyId = familyProfile.id;
  const district = familyProfile.district || 'Mumbai Suburban';

  let plan = null;
  let checklist: any[] = [];

  const fetchedPlan = await getActivePlan(familyId, 'pre_monsoon' as PreparednessPhase);
  if (fetchedPlan) {
    plan = fetchedPlan;
    checklist = fetchedPlan.checklistItems || [];
  }

  const riskScore = await getRiskScore(familyId);
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
