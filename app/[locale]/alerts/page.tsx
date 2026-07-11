import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getActiveAlerts } from '@/lib/api';
import { AlertsUI } from '@/components/alerts/AlertsUI';

export default async function AlertsPage() {
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

  const district = familyProfile.district || 'Mumbai Suburban';
  const alerts = await getActiveAlerts(district);

  return <AlertsUI alerts={alerts} />;
}
