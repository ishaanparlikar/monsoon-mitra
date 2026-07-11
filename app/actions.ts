'use server';

import { createServerClient } from '@/lib/supabase/server';
import { answerConversationQuestion, FamilyQARequestContext } from '@/lib/genai';
import { getFamilyWithMembers, getActivePlan, getRiskScore, getActiveAlerts } from '@/lib/api';
import { PreparednessPhase } from '@/types';

export async function updateChecklistItem(
  planId: string,
  itemId: string,
  isCompleted: boolean
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServerClient() as any;

  const updates = {
    is_completed: isCompleted,
    completed_at: isCompleted ? new Date().toISOString() : null,
  };

  const { error } = await supabase
    .from('checklist_items')
    .update(updates)
    .eq('id', itemId)
    .eq('plan_id', planId);

  if (error) {
    console.error('updateChecklistItem error:', error);
    return { success: false, error: error.message };
  }
  return { success: true };
}

export async function askAssistant(
  question: string,
  familyId?: string,
  overrideLanguage?: string
): Promise<{ success: boolean; answer: string; error?: string }> {
  try {
    const supabase = createServerClient();
    
    // Quick auth bypass for hackathon testing: get first family if no user session
    const { data: { session } } = await supabase.auth.getSession();
    
    let resolvedFamilyId = familyId;
    let district = 'Mumbai Suburban';
    const language = overrideLanguage || 'en';

    if (!resolvedFamilyId) {
      if (session?.user) {
        const { data: familyProfile } = await (supabase
          .from('families')
          .select('id, district')
          .eq('primary_member', session.user.id)
          .single() as any);
        if (familyProfile) {
          resolvedFamilyId = familyProfile.id;
          district = familyProfile.district || 'Mumbai Suburban';
        }
      }
      
      if (!resolvedFamilyId) {
        const { data: firstFamily } = await (supabase
          .from('families')
          .select('id, district')
          .limit(1)
          .single() as any);
        if (firstFamily) {
          resolvedFamilyId = firstFamily.id;
          district = firstFamily.district || 'Mumbai Suburban';
        }
      }
    }

    if (!resolvedFamilyId) {
      return { success: false, answer: '', error: 'Family context not found' };
    }

    // Resolve context details
    const familyData = await getFamilyWithMembers(resolvedFamilyId);
    if (!familyData) {
      return { success: false, answer: '', error: 'Family details not found' };
    }

    const { family, members } = familyData;
    const plan = await getActivePlan(resolvedFamilyId, 'pre_monsoon' as PreparednessPhase);
    const riskScore = await getRiskScore(resolvedFamilyId);
    const alerts = await getActiveAlerts(district);

    let completionRatio = '0/0';
    if (plan && plan.checklistItems) {
      const items = plan.checklistItems;
      const completed = items.filter((i: any) => i.is_completed).length;
      completionRatio = `${completed}/${items.length}`;
    }

    const familyContext: FamilyQARequestContext = {
      location: {
        district: family.district || 'Mumbai Suburban',
        ward: family.ward || null,
        hazard_zones: family.hazard_zones || [],
      },
      housingType: family.housing_type || 'pucca',
      members: members.map((m) => ({
        relation: m.relation || 'member',
        age: m.age || undefined,
        medical_conditions: (m.medical_conditions as string[]) || [],
      })),
      riskScore,
      completionRatio,
      activeAlerts: alerts.map((a) => ({
        severity: a.severity,
        title: a.title || 'Alert',
        description: a.description || '',
      })),
    };

    const answer = await answerConversationQuestion({
      question,
      familyContext,
      language,
    });

    return { success: true, answer };
  } catch (error: any) {
    console.error('askAssistant error:', error);
    return { success: false, answer: '', error: error?.message || 'Failed to get answer' };
  }
}