/**
 * Domain types with computed/enriched fields for application logic.
 * These extend the raw database types with derived/computed fields.
 */

import type {
  Family,
  FamilyMember,
  PreparednessPlan as DbPreparednessPlan,
  ChecklistItem,
  WeatherAlert,
  LocalizedAlert,
  Shelter,
  EvacuationRoute,
  SOSRequest,
  CommunityReport,
  PreparednessPhase,
  ChecklistPriority,
  AlertSeverity,
  CommunityReportType,
  CommunityReportSeverity,
  VerificationStatus,
} from './database';

/**
 * Family with computed member counts and vulnerability breakdown
 */
export interface FamilyWithMembers extends Family {
  members: FamilyMemberWithProfile[];
  memberCounts: {
    total: number;
    adults: number;
    children: number; // age < 5
    elderly: number; // age > 65
    vulnerable: number;
    pets: number;
  };
  currentPhasePlan?: PreparednessPlan;
  currentRiskScore?: FamilyRiskScore;
}

/**
 * Family member with joined profile data and computed vulnerability
 */
export interface FamilyMemberWithProfile extends FamilyMember {
  profile: {
    id: string;
    phone: string;
    language: string;
    dialect?: string | null;
  };
  computedIsVulnerable: boolean; // age < 5 OR age > 65 OR medical_conditions.length > 0
}

/**
 * Plan with expanded checklist items and progress
 */
export interface PlanWithChecklist extends PreparednessPlan {
  checklistItems: ChecklistItemWithProgress[];
  progress: {
    total: number;
    completed: number;
    criticalPending: number;
    highPending: number;
    completionPercentage: number;
  };
}

/**
 * Checklist item with computed progress fields
 */
export interface ChecklistItemWithProgress extends ChecklistItem {
  localizedText?: Record<string, string>;
  isApplicableToCurrentPhase: boolean;
}

/**
 * Weather alert with per-family localizations
 */
export interface AlertWithLocalization extends WeatherAlert {
  localizedAlerts: LocalizedAlertWithFamilyContext[];
  isActive: boolean;
  timeUntilExpiry: number; // minutes
  distanceFromFamily?: number; // km, if family location known
}

export interface LocalizedAlertWithFamilyContext extends LocalizedAlert {
  familyId: string;
  familyLanguage: string;
  isRead: boolean;
  urgencyLevel: 'immediate' | 'soon' | 'monitor';
}

/**
 * Shelter with computed distance and availability
 */
export interface ShelterWithDistance extends Shelter {
  distanceKm: number;
  durationMin: number;
  availableCapacity: number;
  occupancyPercentage: number;
  isNearCapacity: boolean; // > 80%
  route?: EvacuationRouteWithWaypoints;
}

/**
 * Evacuation route with computed waypoint instructions
 */
export interface EvacuationRouteWithWaypoints {
  id: string;
  from_lat: number;
  from_lng: number;
  to_shelter_id: string;
  distance_km: number | null;
  duration_min: number | null;
  road_condition: string | null;
  suitable_for: 'vehicle' | 'pedestrian' | 'both' | null;
  last_updated: string;
  waypoints: EvacuationWaypointWithInstruction[];
  isCurrentlyPassable: boolean;
  alternativeRoutes?: EvacuationRouteWithWaypoints[];
}

export interface EvacuationWaypointWithInstruction {
  lat: number;
  lng: number;
  instruction: string;
  distanceFromPreviousKm: number;
  cumulativeDistanceKm: number;
  estimatedTimeMin: number;
}

/**
 * Family risk score with breakdown
 */
export interface FamilyRiskScore {
  familyId: string;
  score: number; // 0-100
  level: 'low' | 'moderate' | 'high' | 'critical';
  factors: RiskScoreFactors;
  trend: 'improving' | 'stable' | 'worsening';
  lastUpdated: string;
  breakdown: {
    weather: RiskFactorBreakdown;
    vulnerability: RiskFactorBreakdown;
    preparedness: RiskFactorBreakdown;
    housing: RiskFactorBreakdown;
  };
}

export interface RiskScoreFactors {
  weather: number; // 0-1
  vulnerability: number; // 0-1
  preparedness: number; // 0-1
  housing: number; // 0-1
}

export interface RiskFactorBreakdown {
  weight: number;
  value: number;
  contribution: number; // weight * value
  label: string;
  details: string[];
}

/**
 * SOS request with family context
 */
export interface SOSRequestWithContext extends Omit<SOSRequest, 'profile_id' | 'family_id'> {
  profile: {
    id: string;
    phone: string;
    language: string;
  };
  family: Pick<Family, 'id' | 'address' | 'lat' | 'lng' | 'ward'>;
  nearestShelter?: ShelterWithDistance;
  estimatedResponseTimeMin?: number;
}

/**
 * Community report with verification context
 */
export interface CommunityReportWithContext extends CommunityReport {
  reporter: {
    id: string;
    phone: string;
    credibilityScore: number; // 0-1 based on history
  };
  nearbyReports: CommunityReport[];
  verificationProgress: number; // 0-1
}

/**
 * Extended community report type with reporter info
 */
export type CommunityReportExtended = Omit<CommunityReport, 'profile_id'> & {
  profile_id: string;
  reporter?: {
    id: string;
    phone: string;
    credibilityScore: number;
  };
};

/**
 * Preparedness phase with date ranges
 */
export interface PhaseInfo {
  phase: PreparednessPhase;
  label: string;
  startMonth: number; // 1-12
  endMonth: number; // 1-12
  description: string;
  priorityCategories: ChecklistCategory[];
}

export type ChecklistCategory =
  | 'home_prep'
  | 'documents'
  | 'emergency_kit'
  | 'evacuation'
  | 'health'
  | 'communication';

/**
 * Language with native name for UI
 */
export interface SupportedLanguage {
  code: string;
  name: string;
  nativeName: string;
  flag?: string;
}

/**
 * Offline cache status for UI
 */
export interface OfflineCacheStatus {
  isCached: boolean;
  lastSynced: string | null;
  itemCounts: {
    checklistItems: number;
    evacuationRoutes: number;
    shelters: number;
    emergencyContacts: number;
  };
  totalSizeKB: number;
  isStale: boolean; // > 24 hours
}

/**
 * Emergency contact with priority
 */
export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  type: 'police' | 'fire' | 'ambulance' | 'disaster_management' | 'family' | 'shelter' | 'custom';
  priority: number; // 1 = highest
  isVerified: boolean;
}

/**
 * Notification payload for push/SMS
 */
export interface NotificationPayload {
  type: 'alert' | 'sos' | 'checklist' | 'evacuation' | 'community';
  title: string;
  body: string;
  data?: Record<string, unknown>;
  priority: 'high' | 'normal' | 'low';
  actionUrl?: string;
}

/**
 * User session with family context
 */
export interface UserSession {
  profile: {
    id: string;
    phone: string;
    language: string;
    dialect?: string | null;
  };
  family?: FamilyWithMembers;
  currentPhase: PreparednessPhase;
  riskScore?: FamilyRiskScore;
  unreadAlertsCount: number;
  activeSOSCount: number;
}

/**
 * Search/filter params for lists
 */
export interface ChecklistFilter {
  priority?: ChecklistPriority[];
  category?: ChecklistCategory[];
  phase?: PreparednessPhase[];
  showCompleted?: boolean;
  search?: string;
}

export interface AlertFilter {
  severity?: AlertSeverity[];
  type?: string[];
  isRead?: boolean;
  dateRange?: { from: string; to: string };
}

export interface ShelterFilter {
  hasFacility?: ('water' | 'toilets' | 'medical' | 'food')[];
  maxDistanceKm?: number;
  minAvailableCapacity?: number;
  isActive?: boolean;
}

export interface ReportFilter {
  type?: CommunityReportType[];
  severity?: CommunityReportSeverity[];
  verificationStatus?: VerificationStatus[];
  dateRange?: { from: string; to: string };
  bounds?: { lat: number; lng: number; radiusKm: number };
}
export interface PreparednessPlan extends DbPreparednessPlan {
  checklistItems?: ChecklistItem[];
  progress?: {
    total: number;
    completed: number;
    criticalPending: number;
    highPending: number;
    completionPercentage: number;
  };
}
