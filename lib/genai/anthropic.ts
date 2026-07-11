import Anthropic from '@anthropic-ai/sdk';
import type {
  PlanGenerationInput,
  PlanGenerationOutput,
  AlertLocalizationInput,
  AlertLocalizationOutput,
  LanguageCode,
  Family,
  FamilyMember,
  WeatherAlert,
  PreparednessPhase,
} from '@/types';
import { z } from 'zod';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `
You are "Monsoon Mitra" — a trusted monsoon preparedness assistant for Indian citizens.
Your guidance MUST be accurate, actionable, and safe. Lives may depend on your responses.

CORE PRINCIPLES:
1. ALWAYS ground responses in official sources: IMD alerts, NDMA guidelines, ULB advisories.
2. NEVER hallucinate evacuation routes, shelter locations, or emergency numbers.
3. If uncertain, say "I don't have official data for that. Please check [source] or call [number]."
4. Prioritize: Life safety > Property protection > Convenience.
5. Use simple, direct language. Avoid jargon. Translate naturally to target language.
`;

const PLAN_OUTPUT_SCHEMA = z.object({
  summary: z.string(),
  riskScore: z.number().min(0).max(100),
  riskFactors: z.array(z.string()),
  criticalActions: z.array(z.object({
    itemId: z.string(),
    title: z.string(),
    why: z.string(),
  })),
  checklist: z.array(z.object({
    itemId: z.string(),
    title: z.string(),
    category: z.enum(['home_prep', 'documents', 'emergency_kit', 'evacuation', 'health', 'communication']),
    priority: z.enum(['critical', 'high', 'medium', 'low']),
    status: z.enum(['pending', 'in_progress', 'done', 'not_applicable']),
  })),
  phaseGuidance: z.object({
    pre_monsoon: z.string(),
    active_monsoon: z.string(),
    post_monsoon: z.string(),
  }),
  emergencyContacts: z.array(z.object({
    name: z.string(),
    phone: z.string(),
    type: z.enum(['authority', 'shelter', 'emergency']),
  })),
  generatedAt: z.string(),
  model: z.string(),
  version: z.number(),
});

const ALERT_OUTPUT_SCHEMA = z.object({
  title: z.string(),
  description: z.string(),
  actionItems: z.array(z.string()),
  urgencyScore: z.number().min(1).max(10),
});

function buildPlanPrompt(input: PlanGenerationInput): string {
  const { family, members, phase, currentWeather, vulnerabilityScore, language } = input;
  const alertSummary = currentWeather.length > 0
    ? currentWeather.map(w => `${w.severity}: ${w.title}`).join('; ')
    : 'None';

  return `
Generate a personalized monsoon preparedness plan for this family:

FAMILY PROFILE:
- Location: ${family.district}, ${family.ward} (Hazard zones: ${family.hazard_zones?.join(', ') || 'none'})
- Housing: ${family.housing_type}
- Members: ${members.map(m => `${m.relation}, age ${m.age}, medical: ${m.medical_conditions?.join(', ') || 'none'}`).join('; ')}
- Vulnerability Score: ${vulnerabilityScore}/100

CURRENT PHASE: ${phase}
CURRENT WEATHER ALERTS: ${alertSummary}
LANGUAGE: ${language}

Return ONLY valid JSON matching this schema:
{
  "summary": "string",
  "riskScore": "number (0-100)",
  "riskFactors": "string[]",
  "criticalActions": [{"itemId": "string", "title": "string", "why": "string"}],
  "checklist": [{
    "itemId": "string",
    "title": "string",
    "category": "home_prep|documents|emergency_kit|evacuation|health|communication",
    "priority": "critical|high|medium|low",
    "status": "pending|in_progress|done|not_applicable"
  }],
  "phaseGuidance": {
    "pre_monsoon": "string",
    "active_monsoon": "string",
    "post_monsoon": "string"
  },
  "emergencyContacts": [{"name": "string", "phone": "string", "type": "authority|shelter|emergency"}],
  "generatedAt": "ISO string",
  "model": "string",
  "version": "number"
}
`;
}

function buildAlertPrompt(input: AlertLocalizationInput): string {
  const { alert, family, members, language } = input;

  return `
Localize this weather alert for a specific family:

ALERT:
- Type: ${alert.alert_type}
- Severity: ${alert.severity}
- Title: ${alert.title}
- Description: ${alert.description}
- Official Instruction: ${alert.instruction}
- Valid: ${alert.valid_from} to ${alert.valid_until}

FAMILY:
- Location: ${family.district}, ${family.ward} (Hazard: ${family.hazard_zones?.join(', ')})
- Housing: ${family.housing_type}
- Members: ${members.map(m => `${m.relation}, age ${m.age}`).join('; ')}
- Vulnerable members: ${members.filter(m => m.is_vulnerable).map(m => m.relation).join(', ') || 'none'}

LANGUAGE: ${language}

Return ONLY valid JSON:
{
  "title": "localized title in ${language}",
  "description": "localized description with context for this family",
  "actionItems": ["specific actionable steps for THIS family"],
  "urgencyScore": "number 1-10"
}
`;
}

export async function generatePreparednessPlan(
  input: PlanGenerationInput
): Promise<PlanGenerationOutput> {
  const prompt = buildPlanPrompt(input);

  const response = await anthropic.messages.create({
    model: 'claude-3-haiku-20240307',
    max_tokens: 3000,
    temperature: 0.3,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = response.content[0];
  if (content.type !== 'text') throw new Error('Unexpected response type from Anthropic');

  const parsed = JSON.parse(content.text);
  return PLAN_OUTPUT_SCHEMA.parse(parsed);
}

export async function localizeAlert(
  input: AlertLocalizationInput
): Promise<AlertLocalizationOutput> {
  const prompt = buildAlertPrompt(input);

  const response = await anthropic.messages.create({
    model: 'claude-3-haiku-20240307',
    max_tokens: 1200,
    temperature: 0.2,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = response.content[0];
  if (content.type !== 'text') throw new Error('Unexpected response type from Anthropic');

  const parsed = JSON.parse(content.text);
  return ALERT_OUTPUT_SCHEMA.parse(parsed);
}

export async function answerQuestion(
  question: string,
  context: {
    family?: Family;
    members?: FamilyMember[];
    alerts?: WeatherAlert[];
    phase?: PreparednessPhase;
    language: LanguageCode;
  }
): Promise<string> {
  const familyContext = context.family ? `
FAMILY CONTEXT:
- Location: ${context.family.district}, ${context.family.ward} (Hazard: ${context.family.hazard_zones?.join(', ')})
- Housing: ${context.family.housing_type}
- Members: ${context.members?.map(m => `${m.relation}, age ${m.age}`).join('; ') || 'N/A'}
` : '';

  const alertContext = context.alerts?.length ? `
ACTIVE ALERTS:
${context.alerts.map(a => `- ${a.severity}: ${a.title} - ${a.instruction}`).join('\n')}
` : 'No active alerts.';

  const prompt = `
${SYSTEM_PROMPT}

${familyContext}
${alertContext}
CURRENT PHASE: ${context.phase || 'pre_monsoon'}
LANGUAGE: ${context.language}

USER QUESTION: ${question}

Answer in ${context.language}. Cite official sources when possible.
`;

  const response = await anthropic.messages.create({
    model: 'claude-3-haiku-20240307',
    max_tokens: 1500,
    temperature: 0.3,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = response.content[0];
  if (content.type !== 'text') throw new Error('Unexpected response type');
  return content.text;
}

export async function explainRiskScore(
  score: number,
  factors: string[],
  context: {
    family?: Family;
    members?: FamilyMember[];
    alerts?: WeatherAlert[];
    language: LanguageCode;
  }
): Promise<{ explanation: string; priorityActions: string[] }> {
  const prompt = `
Explain this risk score to a citizen in ${context.language}:

RISK SCORE: ${score}/100
RISK FACTORS: ${factors.join(', ')}

FAMILY: ${context.family?.district}, ${context.family?.ward} (${context.family?.housing_type})
MEMBERS: ${context.members?.map(m => `${m.relation}, ${m.age}`).join('; ') || 'N/A'}
ALERTS: ${context.alerts?.map(a => `${a.severity}: ${a.alert_type}`).join(', ') || 'None'}

Return JSON: { "explanation": "plain language explanation", "priorityActions": ["action1", "action2", "action3"] }
`;

  const response = await anthropic.messages.create({
    model: 'claude-3-haiku-20240307',
    max_tokens: 1000,
    temperature: 0.2,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = response.content[0];
  if (content.type !== 'text') throw new Error('Unexpected response type');
  return JSON.parse(content.text);
}