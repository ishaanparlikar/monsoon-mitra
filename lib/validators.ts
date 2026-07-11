import { z } from 'zod';

export const PhoneSchema = z.string().regex(/^\+91\d{10}$/, 'Invalid Indian phone number format (+91XXXXXXXXXX)');

export const CoordinatesSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const FamilySchema = z.object({
  id: z.string().uuid(),
  primary_member: z.string().uuid(),
  address: z.string().nullable(),
  lat: z.number().nullable(),
  lng: z.number().nullable(),
  district: z.string().nullable(),
  ward: z.string().nullable(),
  hazard_zones: z.array(z.string()).nullable(),
  housing_type: z.string().nullable(),
  vulnerability_score: z.number().min(0).max(1).nullable(),
  created_at: z.string().datetime(),
});

export const FamilyInsertSchema = FamilySchema.omit({ id: true, created_at: true }).partial({
  address: true,
  lat: true,
  lng: true,
  district: true,
  ward: true,
  hazard_zones: true,
  housing_type: true,
  vulnerability_score: true,
});

export const FamilyMemberSchema = z.object({
  id: z.string().uuid(),
  family_id: z.string().uuid(),
  profile_id: z.string().uuid(),
  relation: z.string().nullable(),
  age: z.number().int().min(0).max(120).nullable(),
  medical_conditions: z.array(z.string()).nullable(),
  is_vulnerable: z.boolean(),
});

export const FamilyMemberInsertSchema = FamilyMemberSchema.omit({ id: true }).partial({
  relation: true,
  age: true,
  medical_conditions: true,
});

export const ProfileSchema = z.object({
  id: z.string().uuid(),
  phone: PhoneSchema,
  language: z.enum(['en', 'hi', 'mr', 'gu', 'bn', 'ta', 'te', 'kn', 'ml', 'or', 'pa', 'as']),
  dialect: z.string().nullable(),
  created_at: z.string().datetime(),
});

export const ProfileInsertSchema = ProfileSchema.omit({ id: true, created_at: true });

export const PreparednessPhaseSchema = z.enum(['pre_monsoon', 'active_monsoon', 'post_monsoon']);

export const PrioritySchema = z.enum(['critical', 'high', 'medium', 'low']);

export const ChecklistItemSchema = z.object({
  id: z.string().uuid(),
  plan_id: z.string().uuid(),
  item_text: z.string(),
  item_text_localized: z.record(z.string()).nullable(),
  priority: PrioritySchema,
  category: z.string().nullable(),
  phase_applicability: z.array(z.string()).nullable(),
  is_completed: z.boolean(),
  completed_at: z.string().datetime().nullable(),
  sort_order: z.number().int(),
});

export const ChecklistItemInsertSchema = ChecklistItemSchema.omit({ id: true }).partial({
  item_text_localized: true,
  category: true,
  phase_applicability: true,
  is_completed: true,
  completed_at: true,
  sort_order: true,
});

export const PreparednessPlanSchema = z.object({
  id: z.string().uuid(),
  family_id: z.string().uuid(),
  phase: PreparednessPhaseSchema,
  generated_by: z.string().nullable(),
  genai_prompt_hash: z.string().nullable(),
  risk_score_at_generation: z.number().int().min(0).max(100).nullable(),
  status: z.string(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const PreparednessPlanInsertSchema = PreparednessPlanSchema.omit({ id: true, created_at: true, updated_at: true }).partial({
  generated_by: true,
  genai_prompt_hash: true,
  risk_score_at_generation: true,
  status: true,
});

export const WeatherAlertSchema = z.object({
  id: z.string().uuid(),
  source: z.enum(['IMD', 'CWC', 'ULB', 'MOCK']),
  alert_type: z.string().nullable(),
  severity: z.enum(['watch', 'alert', 'warning']),
  districts: z.array(z.string()).nullable(),
  title: z.string().nullable(),
  description: z.string().nullable(),
  instruction: z.string().nullable(),
  valid_from: z.string().datetime(),
  valid_until: z.string().datetime(),
  metadata: z.record(z.unknown()).nullable(),
  created_at: z.string().datetime(),
});

export const WeatherAlertInsertSchema = WeatherAlertSchema.omit({ id: true, created_at: true }).partial({
  alert_type: true,
  districts: true,
  title: true,
  description: true,
  instruction: true,
  metadata: true,
});

export const LocalizedAlertSchema = z.object({
  id: z.string().uuid(),
  weather_alert_id: z.string().uuid(),
  family_id: z.string().uuid(),
  language: z.string(),
  title_localized: z.string().nullable(),
  description_localized: z.string().nullable(),
  action_items: z.array(z.string()).nullable(),
  risk_score: z.number().int().min(0).max(100).nullable(),
  generated_at: z.string().datetime(),
  read_at: z.string().datetime().nullable(),
});

export const LocalizedAlertInsertSchema = LocalizedAlertSchema.omit({ id: true, generated_at: true }).partial({
  title_localized: true,
  description_localized: true,
  action_items: true,
  risk_score: true,
  read_at: true,
});

export const ShelterSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  address: z.string().nullable(),
  lat: z.number(),
  lng: z.number(),
  district: z.string().nullable(),
  ward: z.string().nullable(),
  capacity: z.number().int().nullable(),
  current_occupancy: z.number().int(),
  facilities: z.record(z.unknown()).nullable(),
  managing_authority: z.string().nullable(),
  is_active: z.boolean(),
});

export const ShelterInsertSchema = ShelterSchema.omit({ id: true }).partial({
  address: true,
  district: true,
  ward: true,
  capacity: true,
  current_occupancy: true,
  facilities: true,
  managing_authority: true,
  is_active: true,
});

export const EvacuationRouteSchema = z.object({
  id: z.string().uuid(),
  from_lat: z.number(),
  from_lng: z.number(),
  to_shelter_id: z.string().uuid(),
  waypoints: z.record(z.unknown()).nullable(),
  distance_km: z.number().nullable(),
  duration_min: z.number().int().nullable(),
  road_condition: z.string().nullable(),
  suitable_for: z.enum(['vehicle', 'pedestrian', 'both']).nullable(),
  last_updated: z.string().datetime(),
});

export const EvacuationRouteInsertSchema = EvacuationRouteSchema.omit({ id: true }).partial({
  waypoints: true,
  distance_km: true,
  duration_min: true,
  road_condition: true,
  suitable_for: true,
  last_updated: true,
});

export const SOSRequestSchema = z.object({
  id: z.string().uuid(),
  profile_id: z.string().uuid(),
  family_id: z.string().uuid().nullable(),
  lat: z.number(),
  lng: z.number(),
  emergency_type: z.enum(['medical', 'trapped', 'evacuation', 'other']),
  description: z.string().nullable(),
  status: z.enum(['active', 'responded', 'resolved', 'false_alarm']),
  created_at: z.string().datetime(),
  resolved_at: z.string().datetime().nullable(),
});

export const SOSRequestInsertSchema = SOSRequestSchema.omit({ id: true, created_at: true }).partial({
  family_id: true,
  description: true,
  status: true,
  resolved_at: true,
});

export const CommunityReportSchema = z.object({
  id: z.string().uuid(),
  profile_id: z.string().uuid(),
  lat: z.number(),
  lng: z.number(),
  report_type: z.enum(['waterlogging', 'road_closure', 'landslide', 'shelter_status', 'power_outage']),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  description: z.string().nullable(),
  photo_url: z.string().nullable(),
  verification_status: z.enum(['unverified', 'verified', 'disputed']),
  upvotes: z.number().int(),
  created_at: z.string().datetime(),
});

export const CommunityReportInsertSchema = CommunityReportSchema.omit({ id: true, created_at: true }).partial({
  description: true,
  photo_url: true,
  verification_status: true,
  upvotes: true,
});

export const OfflineCacheManifestSchema = z.object({
  id: z.string().uuid(),
  profile_id: z.string().uuid(),
  device_id: z.string().nullable(),
  checklist_items: z.record(z.unknown()).nullable(),
  evacuation_routes: z.record(z.unknown()).nullable(),
  shelters: z.record(z.unknown()).nullable(),
  emergency_contacts: z.record(z.unknown()).nullable(),
  last_synced: z.string().datetime(),
});

export const OfflineCacheManifestInsertSchema = OfflineCacheManifestSchema.omit({ id: true }).partial({
  device_id: true,
  checklist_items: true,
  evacuation_routes: true,
  shelters: true,
  emergency_contacts: true,
  last_synced: true,
});

export const RiskScoreHistorySchema = z.object({
  id: z.string().uuid(),
  family_id: z.string().uuid(),
  score: z.number().int().min(0).max(100),
  factors: z.record(z.unknown()).nullable(),
  recorded_at: z.string().datetime(),
});

export const RiskScoreHistoryInsertSchema = RiskScoreHistorySchema.omit({ id: true }).partial({
  factors: true,
  recorded_at: true,
});

export const PlanGenerationInputSchema = z.object({
  family: FamilySchema,
  members: z.array(FamilyMemberSchema),
  phase: PreparednessPhaseSchema,
  currentWeather: z.array(WeatherAlertSchema),
  vulnerabilityScore: z.number().min(0).max(100),
  language: z.enum(['en', 'hi', 'mr', 'gu', 'bn', 'ta', 'te', 'kn', 'ml', 'or', 'pa', 'as']),
});

export const PlanGenerationOutputSchema = z.object({
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
    priority: PrioritySchema,
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
  generatedAt: z.string().datetime(),
  model: z.string(),
  version: z.number(),
});

export const AlertLocalizationInputSchema = z.object({
  alert: WeatherAlertSchema,
  family: FamilySchema,
  members: z.array(FamilyMemberSchema),
  language: z.enum(['en', 'hi', 'mr', 'gu', 'bn', 'ta', 'te', 'kn', 'ml', 'or', 'pa', 'as']),
});

export const AlertLocalizationOutputSchema = z.object({
  title: z.string(),
  description: z.string(),
  actionItems: z.array(z.string()),
  urgencyScore: z.number().min(1).max(10),
});

export const RiskExplanationInputSchema = z.object({
  family: FamilySchema,
  members: z.array(FamilyMemberSchema),
  alerts: z.array(WeatherAlertSchema),
  riskScore: z.number().min(0).max(100),
  language: z.enum(['en', 'hi', 'mr', 'gu', 'bn', 'ta', 'te', 'kn', 'ml', 'or', 'pa', 'as']),
});

export const RiskExplanationOutputSchema = z.object({
  score: z.number().min(0).max(100),
  factors: z.array(z.string()),
  explanation: z.string(),
  priorityActions: z.array(z.string()),
});

export const QAInputSchema = z.object({
  question: z.string().min(1).max(1000),
  family: FamilySchema.optional(),
  members: z.array(FamilyMemberSchema).optional(),
  alerts: z.array(WeatherAlertSchema).optional(),
  phase: PreparednessPhaseSchema.optional(),
  language: z.enum(['en', 'hi', 'mr', 'gu', 'bn', 'ta', 'te', 'kn', 'ml', 'or', 'pa', 'as']),
  sources: z.array(z.string()).optional(),
});

export const QAOutputSchema = z.object({
  answer: z.string(),
  sources: z.array(z.string()),
  confidence: z.number().min(0).max(1),
  followUpQuestions: z.array(z.string()).optional(),
});

export type Family = z.infer<typeof FamilySchema>;
export type FamilyInsert = z.infer<typeof FamilyInsertSchema>;
export type FamilyMember = z.infer<typeof FamilyMemberSchema>;
export type FamilyMemberInsert = z.infer<typeof FamilyMemberInsertSchema>;
export type Profile = z.infer<typeof ProfileSchema>;
export type ProfileInsert = z.infer<typeof ProfileInsertSchema>;
export type PreparednessPlan = z.infer<typeof PreparednessPlanSchema>;
export type PreparednessPlanInsert = z.infer<typeof PreparednessPlanInsertSchema>;
export type ChecklistItem = z.infer<typeof ChecklistItemSchema>;
export type ChecklistItemInsert = z.infer<typeof ChecklistItemInsertSchema>;
export type WeatherAlert = z.infer<typeof WeatherAlertSchema>;
export type WeatherAlertInsert = z.infer<typeof WeatherAlertInsertSchema>;
export type LocalizedAlert = z.infer<typeof LocalizedAlertSchema>;
export type LocalizedAlertInsert = z.infer<typeof LocalizedAlertInsertSchema>;
export type Shelter = z.infer<typeof ShelterSchema>;
export type ShelterInsert = z.infer<typeof ShelterInsertSchema>;
export type EvacuationRoute = z.infer<typeof EvacuationRouteSchema>;
export type EvacuationRouteInsert = z.infer<typeof EvacuationRouteInsertSchema>;
export type SOSRequest = z.infer<typeof SOSRequestSchema>;
export type SOSRequestInsert = z.infer<typeof SOSRequestInsertSchema>;
export type CommunityReport = z.infer<typeof CommunityReportSchema>;
export type CommunityReportInsert = z.infer<typeof CommunityReportInsertSchema>;
export type OfflineCacheManifest = z.infer<typeof OfflineCacheManifestSchema>;
export type OfflineCacheManifestInsert = z.infer<typeof OfflineCacheManifestInsertSchema>;
export type RiskScoreHistory = z.infer<typeof RiskScoreHistorySchema>;
export type RiskScoreHistoryInsert = z.infer<typeof RiskScoreHistoryInsertSchema>;
export type PlanGenerationInput = z.infer<typeof PlanGenerationInputSchema>;
export type PlanGenerationOutput = z.infer<typeof PlanGenerationOutputSchema>;
export type AlertLocalizationInput = z.infer<typeof AlertLocalizationInputSchema>;
export type AlertLocalizationOutput = z.infer<typeof AlertLocalizationOutputSchema>;
export type RiskExplanationInput = z.infer<typeof RiskExplanationInputSchema>;
export type RiskExplanationOutput = z.infer<typeof RiskExplanationOutputSchema>;
export type QAInput = z.infer<typeof QAInputSchema>;
export type QAOutput = z.infer<typeof QAOutputSchema>;

export function validatePhone(phone: string): boolean {
  return PhoneSchema.safeParse(phone).success;
}

export function validateCoordinates(lat: number, lng: number): boolean {
  return CoordinatesSchema.safeParse({ lat, lng }).success;
}

export function sanitizeInput<T extends z.ZodTypeAny>(schema: T, data: unknown) {
  return schema.safeParse(data);
}