import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { generatePreparednessPlan } from '@/lib/genai';
import { PreparednessPhaseSchema } from '@/lib/validators';
import type { PlanGenerationInput } from '@/types/genai';
import type { PreparednessPhase } from '@/types/database';

const SUPPORTED_LANGUAGES = [
  'en', 'hi', 'mr', 'gu', 'bn', 'ta', 'te', 'kn', 'ml', 'or', 'pa', 'as',
] as const;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ familyId: string }> }
) {
  const { familyId } = await params;
  const searchParams = request.nextUrl.searchParams;
  const phaseParam = searchParams.get('phase');
  const language = searchParams.get('language') || 'en';

  // Validate phase
  const phaseResult = PreparednessPhaseSchema.safeParse(phaseParam || 'pre_monsoon');
  if (!phaseResult.success) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_ENUM_VALUE', message: 'Invalid phase', field: 'phase' } },
      { status: 400 }
    );
  }
  const phase = phaseResult.data as PreparednessPhase;

  // Validate language
  if (!SUPPORTED_LANGUAGES.includes(language as any)) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_ENUM_VALUE', message: 'Unsupported language', field: 'language' } },
      { status: 400 }
    );
  }

  const supabase = createServerClient() as any;

  // Auth check
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
      { status: 401 }
    );
  }

  // Fetch family with members
  const { data: family, error: familyError } = await supabase
    .from('families')
    .select('*')
    .eq('id', familyId)
    .eq('primary_member', session.user.id)
    .single();

  if (familyError || !family) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'Family not found or access denied' } },
      { status: 404 }
    );
  }

  // Fetch family members
  const { data: members } = await supabase
    .from('family_members')
    .select('*')
    .eq('family_id', familyId);

  // Fetch existing plan for this phase (check cache first)
  const { data: existingPlan } = await supabase
    .from('preparedness_plans')
    .select('*')
    .eq('family_id', familyId)
    .eq('phase', phase)
    .single();

  // Fetch active weather alerts for district
  const { data: alerts } = await supabase
    .from('weather_alerts')
    .select('*')
    .contains('districts', [family.district || 'Mumbai Suburban'])
    .lte('valid_from', new Date().toISOString())
    .gte('valid_until', new Date().toISOString());

  // If plan exists, return it with checklist items
  if (existingPlan) {
    const { data: checklistItems } = await supabase
      .from('checklist_items')
      .select('*')
      .eq('plan_id', existingPlan.id)
      .order('sort_order', { ascending: true });

    return NextResponse.json({
      success: true,
      data: {
        ...existingPlan,
        checklistItems: checklistItems || [],
      },
    });
  }

  // No existing plan — generate one via GenAI
  const riskScore = calculateRiskScore(family, members || [], alerts || []);

  const genAiInput: PlanGenerationInput = {
    family,
    members: members || [],
    phase,
    currentWeatherAlerts: alerts || [],
    vulnerabilityScore: riskScore,
    housingType: family.housing_type || 'pucca',
    hazardZones: family.hazard_zones || [],
    location: {
      district: family.district || 'Mumbai Suburban',
      ward: family.ward || undefined,
      lat: family.lat || 0,
      lng: family.lng || 0,
    },
    language: language as any,
  };

  let generatedPlan;
  try {
    generatedPlan = await generatePreparednessPlan(genAiInput);
  } catch (genAiError) {
    console.error('GenAI plan generation failed:', genAiError);
    return NextResponse.json(
      { success: false, error: { code: 'GENAI_ERROR', message: 'Failed to generate plan' } },
      { status: 502 }
    );
  }

  // Save plan to DB
  const { data: savedPlan, error: saveError } = await supabase
    .from('preparedness_plans')
    .insert({
      family_id: familyId,
      phase,
      generated_by: 'genai',
      risk_score_at_generation: generatedPlan.plan.riskScore,
      status: 'active',
    })
    .select()
    .single();

  if (saveError || !savedPlan) {
    console.error('Failed to save plan:', saveError);
    return NextResponse.json(
      { success: false, error: { code: 'DATABASE_ERROR', message: 'Failed to save plan' } },
      { status: 500 }
    );
  }

  // Save checklist items
  if (generatedPlan.checklist.length > 0) {
    const checklistInserts = generatedPlan.checklist.map((item, idx) => ({
      plan_id: savedPlan.id,
      item_text: item.title,
      item_text_localized: item.titleLocalized ? JSON.stringify(item.titleLocalized) : null,
      priority: item.priority,
      category: item.category,
      phase_applicability: item.phaseApplicability,
      sort_order: idx,
    }));

    const { error: checklistError } = await supabase
      .from('checklist_items')
      .insert(checklistInserts);

    if (checklistError) {
      console.error('Failed to save checklist items:', checklistError);
    }
  }

  // Fetch saved checklist items
  const { data: checklistItems } = await supabase
    .from('checklist_items')
    .select('*')
    .eq('plan_id', savedPlan.id)
    .order('sort_order', { ascending: true });

  return NextResponse.json({
    success: true,
    data: {
      ...savedPlan,
      checklistItems: checklistItems || [],
    },
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ familyId: string }> }
) {
  const { familyId } = await params;
  const supabase = createServerClient() as any;

  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
      { status: 401 }
    );
  }

  // Verify family ownership
  const { data: family } = await supabase
    .from('families')
    .select('id')
    .eq('id', familyId)
    .eq('primary_member', session.user.id)
    .single();

  if (!family) {
    return NextResponse.json(
      { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
      { status: 403 }
    );
  }

  let body: { planId?: string; itemId?: string; isCompleted?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_INPUT', message: 'Invalid JSON body' } },
      { status: 400 }
    );
  }

  const { planId, itemId, isCompleted } = body;

  if (!planId || !itemId || typeof isCompleted !== 'boolean') {
    return NextResponse.json(
      { success: false, error: { code: 'MISSING_REQUIRED_FIELD', message: 'planId, itemId, and isCompleted are required' } },
      { status: 400 }
    );
  }

  // Update checklist item
  const { data: updatedItem, error: updateError } = await supabase
    .from('checklist_items')
    .update({
      is_completed: isCompleted,
      completed_at: isCompleted ? new Date().toISOString() : null,
    })
    .eq('id', itemId)
    .eq('plan_id', planId)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json(
      { success: false, error: { code: 'DATABASE_ERROR', message: 'Failed to update checklist item' } },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data: updatedItem });
}

function calculateRiskScore(family: any, members: any[], alerts: any[]): number {
  let score = 30;

  if (family.hazard_zones?.includes('flood-prone')) score += 25;
  if (family.hazard_zones?.includes('landslide-prone')) score += 20;
  if (family.hazard_zones?.includes('waterlogging')) score += 15;

  if (family.housing_type === 'kutcha') score += 20;
  else if (family.housing_type === 'semi-pucca') score += 10;

  score += Math.round((family.vulnerability_score || 0) * 20);

  const vulnerableCount = members.filter((m: any) => m.is_vulnerable).length;
  score += vulnerableCount * 5;

  const maxSeverity = alerts.reduce((max: number, a: any) => {
    const severity = a.severity === 'warning' ? 3 : a.severity === 'alert' ? 2 : 1;
    return Math.max(max, severity);
  }, 0);
  score += maxSeverity * 10;

  return Math.min(100, Math.max(0, score));
}