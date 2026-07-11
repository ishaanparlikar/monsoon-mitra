import { createServerClient } from '@/lib/supabase/server';
import { getActivePlan, getActiveAlerts, getRiskScore } from '@/lib/api';
import { DashboardUI } from '@/components/dashboard/DashboardUI';
import { PreparednessPhase } from '@/types';

export default async function DashboardPage() {
  const supabase = createServerClient();
  
  // Quick auth bypass for hackathon testing: get first family if no user session
  const { data: { session } } = await supabase.auth.getSession();
  let familyId: string | null = null;
  let district = 'Mumbai Suburban';
  
  if (session?.user) {
     const { data: familyProfile } = await supabase
       .from('families')
       .select('id, district')
       .eq('primary_member', session.user.id)
       .single<{ id: string; district: string | null }>();

     if (familyProfile) {
        familyId = familyProfile.id;
        district = familyProfile.district || 'Mumbai Suburban';
     }
  } else {
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
    if(fetchedPlan) {
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