import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import type {
  PlanGenerationInput,
  PlanGenerationOutput,
  AlertLocalizationInput,
  AlertLocalizationOutput,
  SupportedLanguage,
  Shelter,
  Json,
} from '@/types';

// Helper to create a localized string record (mock implementation only provides the requested language)
function createLocalizedString(value: string): Record<SupportedLanguage, string> {
  const allLangs: SupportedLanguage[] = ['en', 'hi', 'mr', 'gu', 'bn', 'ta', 'te', 'kn', 'ml', 'or', 'pa', 'as'];
  return Object.fromEntries(allLangs.map(lang => [lang, value])) as Record<SupportedLanguage, string>;
}

// Initialize both AI providers
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const SYSTEM_PROMPT = `
You are "Monsoon Mitra" — a trusted monsoon preparedness assistant for Indian citizens.
Your guidance MUST be accurate, actionable, and safe. Lives may depend on your responses.

CORE PRINCIPLES:
1. ALWAYS ground responses in official sources: IMD alerts, NDMA guidelines, ULB advisories.
2. NEVER hallucinate evacuation routes, shelter locations, or emergency numbers.
3. If uncertain, say "I don't have official data for that. Please check [source] or call [number]."
4. Prioritize: Life safety > Property protection > Convenience.
5. Use simple, direct language. Avoid jargon. Translate naturally to target language.

OFFICIAL SOURCES (provided in context):
- IMD Weather Alerts: {{imd_alerts}}
- NDMA Guidelines: {{ndma_guidelines}}
- ULB Advisories: {{ulb_advisories}}
- CWC River Data: {{cwc_data}}

FAMILY CONTEXT (when available):
- Location: {{district}}, {{ward}} (hazard zones: {{hazard_zones}})
- Housing: {{housing_type}}
- Composition: {{family_composition}}
- Medical: {{medical_conditions}}
- Preparedness Phase: {{phase}}
- Completed Items: {{completed_checklist_items}}

RESPONSE FORMAT:
- For plans: Structured JSON matching PlanGenerationOutput schema
- For alerts: {title, description, actionItems[], urgencyScore}
- For Q&A: Natural language in {{language}}, with source citations
- For risk: {score, factors[], explanation, priorityActions[]}
`;

export type AIProvider = 'openai' | 'gemini';

export function getAIProvider(): AIProvider {
  return (process.env.AI_PROVIDER as AIProvider) || 'gemini';
}

export async function generatePreparednessPlan(
  input: PlanGenerationInput
): Promise<PlanGenerationOutput> {
  const provider = getAIProvider();

  if (provider === 'gemini') {
    return generatePreparednessPlanGemini(input);
  }
  return generatePreparednessPlanOpenAI(input);
}

export async function localizeAlert(
  input: AlertLocalizationInput
): Promise<AlertLocalizationOutput> {
  const provider = getAIProvider();

  if (provider === 'gemini') {
    return localizeAlertGemini(input);
  }
  return localizeAlertOpenAI(input);
}

// OpenAI implementations
async function generatePreparednessPlanOpenAI(
  input: PlanGenerationInput
): Promise<PlanGenerationOutput> {
  const prompt = buildPlanPrompt(input);

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.3,
    max_tokens: 4000,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error('Empty response from GenAI');

  const parsed = JSON.parse(content);
  return validatePlanOutput(parsed);
}

async function localizeAlertOpenAI(
  input: AlertLocalizationInput
): Promise<AlertLocalizationOutput> {
  const prompt = buildAlertPrompt(input);

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.2,
    max_tokens: 2000,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error('Empty response from GenAI');

  const parsed = JSON.parse(content);
  return validateAlertOutput(parsed);
}

// Gemini implementations
async function generatePreparednessPlanGemini(
  input: PlanGenerationInput
): Promise<PlanGenerationOutput> {
  const prompt = buildPlanPrompt(input);
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 4000,
      responseMimeType: 'application/json',
    },
  });

  const result = await model.generateContent([
    { text: SYSTEM_PROMPT },
    { text: prompt },
  ]);

  const content = result.response.text();
  if (!content) throw new Error('Empty response from Gemini');

  const parsed = JSON.parse(content);
  return validatePlanOutput(parsed);
}

async function localizeAlertGemini(
  input: AlertLocalizationInput
): Promise<AlertLocalizationOutput> {
  const prompt = buildAlertPrompt(input);
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 2000,
      responseMimeType: 'application/json',
    },
  });

  const result = await model.generateContent([
    { text: SYSTEM_PROMPT },
    { text: prompt },
  ]);

  const content = result.response.text();
  if (!content) throw new Error('Empty response from Gemini');

  const parsed = JSON.parse(content);
  return validateAlertOutput(parsed);
}

function buildPlanPrompt(input: PlanGenerationInput): string {
  const { members, phase, currentWeatherAlerts, vulnerabilityScore, housingType, hazardZones, location, language } = input;

  return `
Generate a personalized monsoon preparedness plan for this family:

FAMILY PROFILE:
- Location: ${location.district}, ${location.ward || 'N/A'} (Hazard zones: ${hazardZones?.join(', ') || 'none'})
- Housing: ${housingType}
- Members: ${members.map(m => `${m.relation}, age ${m.age}, medical: ${m.medical_conditions?.join(', ') || 'none'}`).join('; ')}
- Vulnerability Score: ${vulnerabilityScore}/1.00

CURRENT PHASE: ${phase}
CURRENT WEATHER ALERTS: ${currentWeatherAlerts.length > 0 ? currentWeatherAlerts.map(w => `${w.severity}: ${w.title}`).join('; ') : 'None'}

LANGUAGE: ${language}

Return ONLY valid JSON matching this schema:
{
  "plan": {
    "summary": "string",
    "riskScore": "number (0-100)",
    "riskFactors": "string[]",
    "phaseGuidance": {
      "pre_monsoon": "string",
      "active_monsoon": "string",
      "post_monsoon": "string"
    }
  },
  "checklist": [{
    "itemId": "string",
    "title": "string",
    "titleLocalized": "Record<SupportedLanguage, string>",
    "description": "string",
    "descriptionLocalized": "Record<SupportedLanguage, string>",
    "category": "home_prep|documents|emergency_kit|evacuation|health|communication",
    "priority": "critical|high|medium|low",
    "phaseApplicability": ["pre_monsoon", "active_monsoon", "post_monsoon"],
    "estimatedTimeMinutes": "number",
    "dependencies": "string[]",
    "locationSpecificGuidance": "string",
    "locationSpecificGuidanceLocalized": "Record<SupportedLanguage, string>"
  }],
  "emergencyContacts": [{
    "name": "string",
    "phone": "string",
    "type": "police|fire|ambulance|disaster_management|shelter|family|other",
    "priority": "number",
    "isVerified": "boolean"
  }],
  "metadata": {
    "generatedAt": "ISO string",
    "model": "string",
    "modelVersion": "string",
    "promptHash": "string",
    "tokensUsed": {"prompt": "number", "completion": "number"},
    "latencyMs": "number",
    "confidenceScore": "number (0-1)"
  }
}
`;
}

function buildAlertPrompt(input: AlertLocalizationInput): string {
  const { alert, family, members, language, currentPhase, familyRiskScore } = input;

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
- Location: ${family.district}, ${family.ward || 'N/A'} (Hazard: ${family.hazard_zones?.join(', ')})
- Housing: ${family.housing_type}
- Members: ${members.map(m => `${m.relation}, age ${m.age}`).join('; ')}
- Vulnerable members: ${members.filter(m => m.is_vulnerable).map(m => m.relation).join(', ') || 'none'}
- Family Risk Score: ${familyRiskScore || 'N/A'}

CURRENT PHASE: ${currentPhase}
LANGUAGE: ${language}

Return ONLY valid JSON:
{
  "title": "localized title in ${language}",
  "description": "localized description with context for this family",
  "actionItems": ["specific actionable steps for THIS family"],
  "urgencyScore": "number 0-100",
  "urgencyLevel": "immediate|soon|monitor",
  "relevantPhases": ["pre_monsoon", "active_monsoon", "post_monsoon"],
  "metadata": {
    "generatedAt": "ISO string",
    "model": "string",
    "tokensUsed": {"prompt": "number", "completion": "number"}
  }
}
`;
}

function validatePlanOutput(data: unknown): PlanGenerationOutput {
  return data as PlanGenerationOutput;
}

function validateAlertOutput(data: unknown): AlertLocalizationOutput {
  return data as AlertLocalizationOutput;
}

// Mock GenAI for hackathon/demo (no API key needed)
export async function mockGeneratePreparednessPlan(
  input: PlanGenerationInput
): Promise<PlanGenerationOutput> {
  const { family, members, vulnerabilityScore, language } = input;

  const isFloodProne = family.hazard_zones?.includes('flood-prone') || false;
  const hasElderly = members.some(m => m.age && m.age > 65);
  const hasChildren = members.some(m => m.age && m.age < 12);
  const hasMedical = members.some(m => m.medical_conditions && m.medical_conditions.length > 0);

  const riskBase = 30 + (isFloodProne ? 25 : 0) + (vulnerabilityScore || 0) * 100;
  const riskScore = Math.min(95, riskBase + (hasElderly ? 10 : 0) + (hasChildren ? 5 : 0) + (hasMedical ? 10 : 0));

  const translations = getTranslations(language);

  return {
    plan: {
      summary: translations.summary(family.ward || 'your area', members.length, riskScore),
      riskScore,
      riskFactors: [
        ...(isFloodProne ? [translations.floodProne] : []),
        ...(family.housing_type === 'kutcha' ? [translations.kutchaHousing] : []),
        ...(hasElderly ? [translations.elderlyMember] : []),
        ...(hasChildren ? [translations.youngChildren] : []),
        ...(hasMedical ? [translations.medicalConditions] : []),
        translations.incompleteKit,
      ],
      phaseGuidance: {
        pre_monsoon: translations.preMonsoonGuidance,
        active_monsoon: translations.activeMonsoonGuidance,
        post_monsoon: translations.postMonsoonGuidance,
      },
    },
    checklist: [
      { itemId: 'pre_001', title: translations.elevateElectrical, titleLocalized: createLocalizedString(translations.elevateElectrical), description: translations.preventElectrocution, descriptionLocalized: createLocalizedString(translations.preventElectrocution), category: 'home_prep', priority: 'critical', phaseApplicability: ['pre_monsoon'], estimatedTimeMinutes: 30, dependencies: [], locationSpecificGuidance: '', locationSpecificGuidanceLocalized: createLocalizedString('') },
      { itemId: 'pre_002', title: translations.clearDrains, titleLocalized: createLocalizedString(translations.clearDrains), description: 'Clear roof drains, balconies & surroundings', descriptionLocalized: createLocalizedString('Clear roof drains, balconies & surroundings'), category: 'home_prep', priority: 'high', phaseApplicability: ['pre_monsoon'], estimatedTimeMinutes: 20, dependencies: [], locationSpecificGuidance: '', locationSpecificGuidanceLocalized: createLocalizedString('') },
      { itemId: 'pre_003', title: translations.waterproofDocuments, titleLocalized: createLocalizedString(translations.waterproofDocuments), description: translations.protectDocuments, descriptionLocalized: createLocalizedString(translations.protectDocuments), category: 'documents', priority: 'critical', phaseApplicability: ['pre_monsoon'], estimatedTimeMinutes: 15, dependencies: [], locationSpecificGuidance: '', locationSpecificGuidanceLocalized: createLocalizedString('') },
      { itemId: 'pre_004', title: translations.assembleEmergencyKit, titleLocalized: createLocalizedString(translations.assembleEmergencyKit), description: translations.survivalEssentials, descriptionLocalized: createLocalizedString(translations.survivalEssentials), category: 'emergency_kit', priority: 'critical', phaseApplicability: ['pre_monsoon'], estimatedTimeMinutes: 60, dependencies: [], locationSpecificGuidance: '', locationSpecificGuidanceLocalized: createLocalizedString('') },
      { itemId: 'pre_005', title: translations.packGoBagVulnerable, titleLocalized: createLocalizedString(translations.packGoBagVulnerable), description: 'Pack medications and 3-day supply for vulnerable members', descriptionLocalized: createLocalizedString('Pack medications and 3-day supply for vulnerable members'), category: 'health', priority: 'high', phaseApplicability: ['pre_monsoon'], estimatedTimeMinutes: 30, dependencies: [], locationSpecificGuidance: '', locationSpecificGuidanceLocalized: createLocalizedString('') },
      { itemId: 'pre_006', title: translations.identifyShelterRoute, titleLocalized: createLocalizedString(translations.identifyShelterRoute), description: translations.knowEvacuationPath, descriptionLocalized: createLocalizedString(translations.knowEvacuationPath), category: 'evacuation', priority: 'critical', phaseApplicability: ['pre_monsoon', 'active_monsoon'], estimatedTimeMinutes: 30, dependencies: [], locationSpecificGuidance: '', locationSpecificGuidanceLocalized: createLocalizedString('') },
      { itemId: 'pre_007', title: translations.saveEmergencyContacts, titleLocalized: createLocalizedString(translations.saveEmergencyContacts), description: 'Save emergency contacts offline', descriptionLocalized: createLocalizedString('Save emergency contacts offline'), category: 'communication', priority: 'high', phaseApplicability: ['pre_monsoon'], estimatedTimeMinutes: 10, dependencies: [], locationSpecificGuidance: '', locationSpecificGuidanceLocalized: createLocalizedString('') },
      { itemId: 'pre_008', title: translations.checkInsurance, titleLocalized: createLocalizedString(translations.checkInsurance), description: 'Review home/health insurance coverage', descriptionLocalized: createLocalizedString('Review home/health insurance coverage'), category: 'documents', priority: 'medium', phaseApplicability: ['pre_monsoon'], estimatedTimeMinutes: 20, dependencies: [], locationSpecificGuidance: '', locationSpecificGuidanceLocalized: createLocalizedString('') },
    ],
    emergencyContacts: [
      { name: 'Ward Office', phone: '022-2262-XXXX', type: 'disaster_management', priority: 1, isVerified: true },
      { name: 'Nearest Shelter', phone: '022-2265-XXXX', type: 'shelter', priority: 2, isVerified: true },
      { name: 'Ambulance 108', phone: '108', type: 'ambulance', priority: 1, isVerified: true },
      { name: 'Disaster Helpline', phone: '1077', type: 'disaster_management', priority: 1, isVerified: true },
    ],
    metadata: {
      generatedAt: new Date().toISOString(),
      model: 'mock-genai',
      modelVersion: '1.0',
      promptHash: 'mock-hash',
      tokensUsed: { prompt: 0, completion: 0 },
      latencyMs: 0,
      confidenceScore: 0.95,
    },
  };
}

export async function mockLocalizeAlert(
  input: AlertLocalizationInput
): Promise<AlertLocalizationOutput> {
  const { alert, family, members, language } = input;
  const translations = getTranslations(language);

  const isFloodProne = family.hazard_zones?.includes('flood-prone') || false;
  const hasVulnerable = members.some(m => m.is_vulnerable);

  let urgencyScore = 3;
  if (alert.severity === 'warning') urgencyScore = 8;
  else if (alert.severity === 'alert') urgencyScore = 6;
  else if (alert.severity === 'watch') urgencyScore = 4;

  if (isFloodProne) urgencyScore += 2;
  if (hasVulnerable) urgencyScore += 1;
  urgencyScore = Math.min(10, urgencyScore);

  return {
    title: translations.alertTitle(alert.alert_type || ''),
    description: translations.alertDescription(family.ward || 'your area', alert.description || ''),
    actionItems: [
      translations.stayIndoors,
      translations.monitorUpdates,
      ...(urgencyScore >= 7 ? [translations.prepareEvacuation] : []),
      ...(urgencyScore >= 8 ? [translations.evacuateNow] : []),
      translations.keepEmergencyKitReady,
      translations.checkOnVulnerable,
    ].slice(0, 5),
    urgencyScore: urgencyScore * 10,
    urgencyLevel: urgencyScore >= 8 ? 'immediate' : urgencyScore >= 5 ? 'soon' : 'monitor',
    relevantPhases: ['pre_monsoon', 'active_monsoon'],
    metadata: {
      generatedAt: new Date().toISOString(),
      model: 'mock-genai',
      tokensUsed: { prompt: 0, completion: 0 },
    },
  };
}

function getTranslations(_lang: SupportedLanguage) {
  // Mock translations - in production, GenAI handles 12 Indian languages dynamically
  // This fallback only provides English; real implementation uses GenAI with system prompts
  const translations = {
    summary: (ward: string, members: number, score: number) => `Your family of ${members} in ${ward} has a monsoon risk score of ${score}/100. Prioritize evacuation prep and emergency kit.`,
    floodProne: 'Low-lying flood-prone area',
    kutchaHousing: 'Kutcha/semi-pucca housing vulnerable to water',
    elderlyMember: 'Elderly family member(s) need assistance',
    youngChildren: 'Young children require special care',
    medicalConditions: 'Medical conditions need medication continuity',
    incompleteKit: 'Emergency kit incomplete',
    elevateElectrical: 'Elevate electrical sockets & appliances',
    preventElectrocution: 'Prevent electrocution during flooding',
    clearDrains: 'Clear roof drains, balconies & surroundings',
    waterproofDocuments: 'Store documents in waterproof bags',
    protectDocuments: 'Protect identity, property, medical records',
    assembleEmergencyKit: 'Assemble emergency kit (water, food, torch, radio, first aid)',
    survivalEssentials: '72-hour survival essentials',
    packGoBagVulnerable: 'Pack go-bag for vulnerable members (meds, 3-day supply)',
    identifyShelterRoute: 'Identify nearest shelter & evacuation route',
    knowEvacuationPath: 'Know evacuation path before disaster strikes',
    saveEmergencyContacts: 'Save emergency contacts offline',
    checkInsurance: 'Review home/health insurance coverage',
    preMonsoonGuidance: 'Complete all critical items before June 1. Focus on home hardening and kit assembly.',
    activeMonsoonGuidance: 'Monitor alerts daily. Keep go-bags by door. Evacuate immediately on "warning" level alert.',
    postMonsoonGuidance: 'Document damage for claims. Boil water. Watch for dengue/malaria symptoms.',
    alertTitle: (type: string) => `Weather Alert: ${type.replace('_', ' ')}`,
    alertDescription: (ward: string, desc: string) => `${ward}: ${desc}`,
    stayIndoors: 'Stay indoors, avoid travel',
    monitorUpdates: 'Monitor official weather updates',
    prepareEvacuation: 'Prepare for possible evacuation',
    evacuateNow: 'Evacuate immediately to designated shelter',
    keepEmergencyKitReady: 'Keep emergency kit accessible',
    checkOnVulnerable: 'Check on elderly/children/neighbors',
  };

  // For non-English languages, return English as fallback (GenAI handles real translations)
  return translations;
}

// AI Shelter Generation
export async function generateSheltersFromAI(
  location: { district: string; ward?: string; lat: number; lng: number }
): Promise<Omit<Shelter, 'id' | 'created_at'>[]> {
  const provider = getAIProvider();

  // If mock flag is set or no key is provided, use mock generator
  if (process.env.NEXT_PUBLIC_ENABLE_MOCK_GENAI === 'true' || !process.env.GEMINI_API_KEY) {
    return mockGenerateShelters(location);
  }

  try {
    if (provider === 'gemini') {
      return await generateSheltersGemini(location);
    } else {
      return await generateSheltersOpenAI(location);
    }
  } catch (error) {
    console.error('AI shelter generation failed, using mock fallback:', error);
    return mockGenerateShelters(location);
  }
}

async function generateSheltersGemini(
  location: { district: string; ward?: string; lat: number; lng: number }
): Promise<Omit<Shelter, 'id' | 'created_at'>[]> {
  const prompt = buildSheltersPrompt(location);
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 2000,
      responseMimeType: 'application/json',
    },
  });

  const result = await model.generateContent([
    { text: SYSTEM_PROMPT },
    { text: prompt },
  ]);

  const content = result.response.text();
  if (!content) throw new Error('Empty response from Gemini');

  const parsed = JSON.parse(content);
  return validateSheltersOutput(parsed);
}

async function generateSheltersOpenAI(
  location: { district: string; ward?: string; lat: number; lng: number }
): Promise<Omit<Shelter, 'id' | 'created_at'>[]> {
  const prompt = buildSheltersPrompt(location);
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.4,
    max_tokens: 2000,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error('Empty response from GenAI');

  const parsed = JSON.parse(content);
  // OpenAI returns `{ "shelters": [...] }` or a raw array. We handle both:
  const shelters = Array.isArray(parsed) ? parsed : (parsed.shelters || []);
  return validateSheltersOutput(shelters);
}

function buildSheltersPrompt(location: { district: string; ward?: string; lat: number; lng: number }): string {
  return `
Generate 5 realistic emergency shelters located within a 5km radius of this coordinate:
Latitude: ${location.lat}
Longitude: ${location.lng}
District: ${location.district}
Ward: ${location.ward || 'N/A'}

For each shelter, generate:
1. "name": A realistic name (e.g. "BMC Ward Office - Shelter [Name]", "[Name] Community Centre", "[Name] School/College", "NDMA Emergency Camp - [Name]")
2. "address": A realistic street address in Mumbai
3. "lat": A realistic latitude close to ${location.lat} (within 0.03 degree offset)
4. "lng": A realistic longitude close to ${location.lng} (within 0.03 degree offset)
5. "district": "${location.district}"
6. "ward": "${location.ward || 'N/A'}"
7. "capacity": An integer between 150 and 600
8. "current_occupancy": An integer that is between 0 and 50% of the capacity
9. "facilities": A JSON object containing:
    "water": boolean,
    "toilets": boolean,
    "medical": boolean,
    "food": boolean,
    "power_backup": boolean,
    "wheelchair_accessible": boolean,
    "pet_friendly": boolean
10. "managing_authority": A realistic authority (e.g. "BMC [Ward] Ward", "NDMA Camp Management", "NMMC Division", "Local NGO")

Return ONLY valid JSON: an array of shelter objects or { "shelters": [...] }. Do not write explanations.
`;
}

function validateSheltersOutput(data: unknown): Omit<Shelter, 'id' | 'created_at'>[] {
  const shelters = Array.isArray(data) ? data : (data as { shelters?: unknown })?.shelters;
  if (!Array.isArray(shelters)) {
    throw new Error('Shelters response must be an array');
  }
  return (shelters as Record<string, unknown>[]).map((s) => ({
    name: String(s.name),
    address: String(s.address),
    lat: Number(s.lat),
    lng: Number(s.lng),
    district: String(s.district),
    ward: s.ward ? String(s.ward) : null,
    capacity: s.capacity ? Number(s.capacity) : 300,
    current_occupancy: s.current_occupancy ? Number(s.current_occupancy) : 0,
    facilities: (s.facilities || {}) as Json,
    managing_authority: s.managing_authority ? String(s.managing_authority) : null,
    is_active: true,
  }));
}

export function mockGenerateShelters(
  location: { district: string; ward?: string; lat: number; lng: number }
): Omit<Shelter, 'id' | 'created_at'>[] {
  const names = [
    'Sports Complex & Pool',
    'Municipal High School',
    'Community Welfare Center',
    'NDMA Relief Base camp',
    'Fishermen Development Hall',
  ];

  return names.map((name, idx) => {
    // Generate realistic offset coordinates close to target
    const latOffset = (idx - 2) * 0.008 + 0.003;
    const lngOffset = ((idx % 2 === 0 ? 1 : -1) * idx) * 0.006 - 0.002;
    const cap = 200 + idx * 75;
    
    return {
      name: `${location.ward || 'Bandra'} ${name}`,
      address: `${12 + idx * 8}, Sector Road, near Fire Station, ${location.ward || 'Bandra'}, Mumbai`,
      lat: location.lat + latOffset,
      lng: location.lng + lngOffset,
      district: location.district,
      ward: location.ward || null,
      capacity: cap,
      current_occupancy: Math.floor(cap * (0.05 + idx * 0.08)),
      facilities: {
        water: true,
        toilets: true,
        medical: idx % 2 === 0,
        food: idx % 3 !== 0,
        power_backup: idx % 2 === 1,
        wheelchair_accessible: idx % 4 !== 0,
        pet_friendly: idx === 2,
      },
      managing_authority: `BMC ${location.district} Ward Office`,
      is_active: true,
    };
  });
}