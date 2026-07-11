import type { LanguageCode } from '@/types';

export const PHASES = {
  pre_monsoon: {
    id: 'pre_monsoon',
    label: 'Pre-Monsoon',
    months: 'Apr–May',
    description: 'Preparation, home hardening, kit assembly',
    color: 'blue',
    order: 1,
  },
  active_monsoon: {
    id: 'active_monsoon',
    label: 'Active Monsoon',
    months: 'Jun–Sep',
    description: 'Real-time alerts, evacuation, shelters, SOS',
    color: 'red',
    order: 2,
  },
  post_monsoon: {
    id: 'post_monsoon',
    label: 'Post-Monsoon',
    months: 'Oct–Nov',
    description: 'Recovery, damage assessment, disease prevention',
    color: 'green',
    order: 3,
  },
} as const;

export type PhaseId = keyof typeof PHASES;

export const PRIORITIES = {
  critical: { label: 'Critical', weight: 4, color: 'red', order: 1 },
  high: { label: 'High', weight: 3, color: 'orange', order: 2 },
  medium: { label: 'Medium', weight: 2, color: 'yellow', order: 3 },
  low: { label: 'Low', weight: 1, color: 'green', order: 4 },
} as const;

export type Priority = keyof typeof PRIORITIES;

export const CATEGORIES = {
  home_prep: { label: 'Home Preparation', icon: 'home', order: 1 },
  documents: { label: 'Documents', icon: 'file-text', order: 2 },
  emergency_kit: { label: 'Emergency Kit', icon: 'package', order: 3 },
  evacuation: { label: 'Evacuation', icon: 'navigation', order: 4 },
  health: { label: 'Health & Medical', icon: 'heart-pulse', order: 5 },
  communication: { label: 'Communication', icon: 'phone', order: 6 },
} as const;

export type Category = keyof typeof CATEGORIES;

export const ALERT_TYPES = {
  heavy_rainfall: { label: 'Heavy Rainfall', icon: 'cloud-rain', color: 'blue' },
  thunderstorm: { label: 'Thunderstorm', icon: 'zap', color: 'yellow' },
  cyclone: { label: 'Cyclone', icon: 'wind', color: 'purple' },
  flood: { label: 'Flood', icon: 'waves', color: 'blue' },
  landslide: { label: 'Landslide', icon: 'mountain', color: 'brown' },
  heat_wave: { label: 'Heat Wave', icon: 'sun', color: 'orange' },
  cold_wave: { label: 'Cold Wave', icon: 'snowflake', color: 'cyan' },
} as const;

export type AlertType = keyof typeof ALERT_TYPES;

export const SEVERITIES = {
  watch: { label: 'Watch', level: 1, color: 'yellow', description: 'Be prepared' },
  alert: { label: 'Alert', level: 2, color: 'orange', description: 'Be ready to act' },
  warning: { label: 'Warning', level: 3, color: 'red', description: 'Take immediate action' },
} as const;

export type Severity = keyof typeof SEVERITIES;

export const LANGUAGES: { code: LanguageCode; name: string; nativeName: string; rtl: false }[] = [
  { code: 'en', name: 'English', nativeName: 'English', rtl: false },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', rtl: false },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', rtl: false },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', rtl: false },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', rtl: false },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', rtl: false },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', rtl: false },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', rtl: false },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', rtl: false },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ', rtl: false },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', rtl: false },
  { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া', rtl: false },
];

export const LANGUAGE_CODES = LANGUAGES.map(l => l.code) as LanguageCode[];
export const DEFAULT_LANGUAGE: LanguageCode = 'en';

export function getLanguageByCode(code: LanguageCode) {
  return LANGUAGES.find(l => l.code === code) || LANGUAGES[0];
}

export const DISTRICTS = {
  mumbai_suburban: { name: 'Mumbai Suburban', state: 'Maharashtra', code: 'MUM_SUB' },
  mumbai_city: { name: 'Mumbai City', state: 'Maharashtra', code: 'MUM_CITY' },
  thane: { name: 'Thane', state: 'Maharashtra', code: 'THANE' },
  palghar: { name: 'Palghar', state: 'Maharashtra', code: 'PALGHAR' },
  raigad: { name: 'Raigad', state: 'Maharashtra', code: 'RAIGAD' },
} as const;

export type DistrictId = keyof typeof DISTRICTS;

export const HOUSING_TYPES = {
  pucca: { label: 'Pucca (Concrete/Brick)', vulnerability: 0.1, color: 'green' },
  'semi-pucca': { label: 'Semi-Pucca', vulnerability: 0.3, color: 'yellow' },
  kutcha: { label: 'Kutcha (Mud/Thatch)', vulnerability: 0.6, color: 'red' },
} as const;

export type HousingType = keyof typeof HOUSING_TYPES;

export const HAZARD_ZONES = {
  'flood-prone': { label: 'Flood-Prone', riskWeight: 25, color: 'blue' },
  'landslide-prone': { label: 'Landslide-Prone', riskWeight: 20, color: 'brown' },
  waterlogging: { label: 'Waterlogging', riskWeight: 15, color: 'yellow' },
  'cyclone-prone': { label: 'Cyclone-Prone', riskWeight: 20, color: 'purple' },
  'storm-surge': { label: 'Storm Surge', riskWeight: 25, color: 'red' },
  'low-lying': { label: 'Low-Lying Area', riskWeight: 15, color: 'blue' },
} as const;

export type HazardZone = keyof typeof HAZARD_ZONES;

export const EMERGENCY_NUMBERS = {
  ambulance: { number: '108', label: 'Ambulance', description: 'Medical emergency' },
  police: { number: '100', label: 'Police', description: 'Law enforcement' },
  fire: { number: '101', label: 'Fire Brigade', description: 'Fire emergency' },
  disaster: { number: '1077', label: 'Disaster Helpline', description: 'NDMA disaster management' },
  women: { number: '1091', label: 'Women Helpline', description: 'Women safety' },
  child: { number: '1098', label: 'Child Helpline', description: 'Child protection' },
  blood: { number: '104', label: 'Blood Bank', description: 'Blood donation/emergency' },
  railway: { number: '139', label: 'Railway Enquiry', description: 'Train status/enquiry' },
} as const;

export const RELATIONS = [
  'self',
  'spouse',
  'child',
  'parent',
  'grandparent',
  'sibling',
  'other',
] as const;

export type Relation = (typeof RELATIONS)[number];

export const MEDICAL_CONDITIONS = [
  'asthma',
  'diabetes',
  'hypertension',
  'heart_disease',
  'epilepsy',
  'disability_mobility',
  'disability_visual',
  'disability_hearing',
  'pregnancy',
  'elderly_care',
  'mental_health',
  'other',
] as const;

export type MedicalCondition = (typeof MEDICAL_CONDITIONS)[number];

export const FACILITIES = {
  water: { label: 'Drinking Water', icon: 'droplet' },
  toilets: { label: 'Toilets', icon: 'toilet' },
  medical: { label: 'Medical Aid', icon: 'cross' },
  food: { label: 'Food Supply', icon: 'utensils' },
  power_backup: { label: 'Power Backup', icon: 'battery' },
  wheelchair_accessible: { label: 'Wheelchair Accessible', icon: 'wheelchair' },
  pet_friendly: { label: 'Pet Friendly', icon: 'paw-print' },
} as const;

export const ROAD_CONDITIONS = {
  good: { label: 'Good', color: 'green', description: 'Normal conditions' },
  waterlogged: { label: 'Waterlogged', color: 'yellow', description: 'Standing water on road' },
  blocked: { label: 'Blocked', color: 'red', description: 'Road impassable' },
  unknown: { label: 'Unknown', color: 'gray', description: 'Condition not reported' },
} as const;

export type RoadCondition = keyof typeof ROAD_CONDITIONS;

export const SUITABLE_FOR = {
  vehicle: { label: 'Vehicle', icon: 'car' },
  pedestrian: { label: 'Pedestrian', icon: 'walk' },
  both: { label: 'Both', icon: 'car' },
} as const;

export type SuitableFor = keyof typeof SUITABLE_FOR;

export const SOS_TYPES = {
  medical: { label: 'Medical Emergency', icon: 'heart-pulse', color: 'red' },
  trapped: { label: 'Trapped/Stranded', icon: 'user-lock', color: 'orange' },
  evacuation: { label: 'Need Evacuation', icon: 'arrow-right-from-line', color: 'blue' },
  other: { label: 'Other Emergency', icon: 'alert-circle', color: 'purple' },
} as const;

export type SOSType = keyof typeof SOS_TYPES;

export const REPORT_TYPES = {
  waterlogging: { label: 'Waterlogging', icon: 'droplets', color: 'blue' },
  road_closure: { label: 'Road Closure', icon: 'road-barrier', color: 'red' },
  landslide: { label: 'Landslide', icon: 'mountain', color: 'brown' },
  shelter_status: { label: 'Shelter Status', icon: 'home', color: 'green' },
  power_outage: { label: 'Power Outage', icon: 'zap-off', color: 'yellow' },
} as const;

export type ReportType = keyof typeof REPORT_TYPES;

export const REPORT_SEVERITIES = {
  low: { label: 'Low', color: 'green', priority: 1 },
  medium: { label: 'Medium', color: 'yellow', priority: 2 },
  high: { label: 'High', color: 'orange', priority: 3 },
  critical: { label: 'Critical', color: 'red', priority: 4 },
} as const;

export type ReportSeverity = keyof typeof REPORT_SEVERITIES;

export const VERIFICATION_STATUSES = {
  unverified: { label: 'Unverified', color: 'gray' },
  verified: { label: 'Verified', color: 'green' },
  disputed: { label: 'Disputed', color: 'orange' },
} as const;

export type VerificationStatus = keyof typeof VERIFICATION_STATUSES;

export const SOS_STATUSES = {
  active: { label: 'Active', color: 'red', action: 'Requires immediate response' },
  responded: { label: 'Responded', color: 'blue', action: 'Help is on the way' },
  resolved: { label: 'Resolved', color: 'green', action: 'Situation handled' },
  false_alarm: { label: 'False Alarm', color: 'gray', action: 'Cancelled' },
} as const;

export type SOSStatus = keyof typeof SOS_STATUSES;

export const RISK_SCORE_THRESHOLDS = {
  low: { max: 30, color: 'green', label: 'Low Risk' },
  moderate: { max: 50, color: 'yellow', label: 'Moderate Risk' },
  high: { max: 75, color: 'orange', label: 'High Risk' },
  critical: { max: 100, color: 'red', label: 'Critical Risk' },
} as const;

export const VULNERABILITY_WEIGHTS = {
  hazard_zone: 25,
  housing_type: 20,
  vulnerability_index: 20,
  family_composition: 15,
  preparedness: 20,
} as const;

export const CACHE_KEYS = {
  checklist: 'offline:checklist',
  routes: 'offline:routes',
  shelters: 'offline:shelters',
  contacts: 'offline:contacts',
  alerts: 'offline:alerts',
  plan: 'offline:plan',
} as const;

export const STORAGE_KEYS = {
  language: 'app:language',
  phase: 'app:phase',
  family: 'app:family',
  notifications: 'app:notifications',
  offline_ready: 'app:offline_ready',
} as const;

export const API_ENDPOINTS = {
  family: '/api/family',
  plan: '/api/plan',
  alerts: '/api/alerts',
  shelters: '/api/shelters',
  routes: '/api/routes',
  sos: '/api/sos',
  reports: '/api/reports',
  risk: '/api/risk',
  auth: '/api/auth',
} as const;

export const GEMINI_MODELS = {
  flash: 'gemini-1.5-flash',
  pro: 'gemini-1.5-pro',
} as const;

export const OPENAI_MODELS = {
  gpt4o_mini: 'gpt-4o-mini',
  gpt4o: 'gpt-4o',
} as const;

export const ANTHROPIC_MODELS = {
  haiku: 'claude-3-haiku-20240307',
  sonnet: 'claude-3-5-sonnet-20241022',
} as const;

export const DEFAULT_MODEL_PROVIDER = 'openai' as const;
export type ModelProvider = 'openai' | 'anthropic' | 'gemini';

export const MAX_CHECKLIST_ITEMS = 20;
export const MAX_EMERGENCY_CONTACTS = 10;
export const MAX_SOS_DESCRIPTION_LENGTH = 500;
export const MAX_REPORT_DESCRIPTION_LENGTH = 300;
export const ALERT_REFRESH_INTERVAL = 5 * 60 * 1000;
export const RISK_SCORE_REFRESH_INTERVAL = 10 * 60 * 1000;
export const LOCATION_ACCURACY_THRESHOLD = 100;
export const OFFLINE_SYNC_INTERVAL = 30 * 60 * 1000;