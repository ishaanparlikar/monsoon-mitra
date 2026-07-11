import { createServerClient } from '@/lib/supabase/server';
import { getActiveAlerts } from '@/lib/api';
import { AlertsUI } from '@/components/alerts/AlertsUI';
import type { Family } from '@/types/database';

export default async function AlertsPage() {
  const supabase = createServerClient();

  // Quick auth bypass for hackathon testing
  const { data: { session } } = await supabase.auth.getSession();
  let district = 'Mumbai Suburban';

  if (session?.user) {
    const { data: familyProfile } = await supabase
      .from('families')
      .select('id, district')
      .eq('primary_member', session.user.id)
      .single<Family>();

    if (familyProfile) {
      district = familyProfile.district || 'Mumbai Suburban';
    }
  } else {
    const { data: firstFamily } = await supabase
      .from('families')
      .select('id, district')
      .limit(1)
      .single<Family>();

    if (firstFamily) {
      district = firstFamily.district || 'Mumbai Suburban';
    }
  }

  const alerts = await getActiveAlerts(district);

  return (
    <AlertsUI alerts={alerts} />
  );
}
