import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { localizeAlert } from '@/lib/genai';
import type { AlertLocalizationInput } from '@/types';
import type { Family } from '@/types/database';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ familyId: string }> }
) {
  const { familyId } = await params;
  const searchParams = request.nextUrl.searchParams;
  const language = searchParams.get('language') || 'en';

  const supabase = createServerClient() as any;

  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
      { status: 401 }
    );
  }

  // Verify family access
  const { data: family } = await supabase
    .from('families')
    .select('*')
    .eq('id', familyId)
    .single();

  if (!family) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'Family not found' } },
      { status: 404 }
    );
  }

  // Check if user is primary member or a member of this family
  const isPrimaryMember = (family as Family).primary_member === session.user.id;
  const { data: member } = await supabase
    .from('family_members')
    .select('profile_id')
    .eq('family_id', familyId)
    .eq('profile_id', session.user.id)
    .single();

  if (!isPrimaryMember && !member) {
    return NextResponse.json(
      { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
      { status: 403 }
    );
  }

  // Fetch family members for localization context
  const { data: members } = await supabase
    .from('family_members')
    .select('*')
    .eq('family_id', familyId);

  // Fetch active weather alerts for this district
  const { data: alerts } = await supabase
    .from('weather_alerts')
    .select('*')
    .contains('districts', [(family as Family).district || 'Mumbai Suburban'])
    .lte('valid_from', new Date().toISOString())
    .gte('valid_until', new Date().toISOString())
    .order('severity', { ascending: false });

  if (!alerts || alerts.length === 0) {
    return NextResponse.json({
      success: true,
      data: [],
      meta: { timestamp: new Date().toISOString() },
    });
  }

  // Fetch existing localized alerts for this family/language
  const alertIds = alerts.map((a: any) => a.id);
  const { data: existingLocalized } = await supabase
    .from('localized_alerts')
    .select('*')
    .eq('family_id', familyId)
    .eq('language', language)
    .in('weather_alert_id', alertIds);

  const existingMap = new Map(
    (existingLocalized || []).map((la: any) => [la.weather_alert_id, la])
  );

  // Localize any alerts that don't have a cached localized version
  const results = await Promise.all(
    alerts.map(async (alert: any) => {
      const existing = existingMap.get(alert.id);
      if (existing) {
        return { ...alert, localized: existing };
      }

      // Generate localization via GenAI
      const localizedInput: AlertLocalizationInput = {
        alert,
        family: family as Family,
        members: members || [],
        language: language as any,
        currentPhase: 'active_monsoon',
        familyRiskScore: (family as Family).vulnerability_score
          ? (family as Family).vulnerability_score! * 100
          : undefined,
      };

      let localized = null;
      try {
        localized = await localizeAlert(localizedInput);
      } catch (genAiError) {
        console.error('GenAI alert localization failed:', genAiError);
      }

      // Cache the localized alert
      if (localized) {
        const { data: cached } = await supabase
          .from('localized_alerts')
          .insert({
            weather_alert_id: alert.id,
            family_id: familyId,
            language,
            title_localized: localized.title,
            description_localized: localized.description,
            action_items: localized.actionItems,
            risk_score: localized.urgencyScore,
          })
          .select()
          .single();

        return { ...alert, localized: cached || localized };
      }

      return { ...alert, localized: null };
    })
  );

  return NextResponse.json({
    success: true,
    data: results,
    meta: { timestamp: new Date().toISOString() },
  });
}
