import { SheltersUI } from '@/components/shelters/SheltersUI';
import { createServerClient } from '@/lib/supabase/server';

export default async function SheltersPage() {
  const supabase = createServerClient();
  
  // Quick auth bypass for hackathon testing: get first family if no user session
  const { data: { session } } = await supabase.auth.getSession();
  let familyId: string | null = null;
  
  if (session?.user) {
    const { data: familyProfile } = await supabase
      .from('families')
      .select('id')
      .eq('primary_member', session.user.id)
      .single<{ id: string }>();

    if (familyProfile) {
      familyId = familyProfile.id;
    }
  } else {
    const { data: firstFamily } = await supabase
      .from('families')
      .select('id')
      .limit(1)
      .single<{ id: string }>();

    if (firstFamily) {
      familyId = firstFamily.id;
    }
  }

  return <SheltersUI familyId={familyId} />;
}
