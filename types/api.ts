/**
 * API route types for Next.js App Router.
 * Generic response wrappers and webhook payloads.
 */

import type {
  Profile,
  Family,
  FamilyMember,
  PreparednessPlan,
  ChecklistItem,
  WeatherAlert,
  LocalizedAlert,
  Shelter,
  EvacuationRoute,
  SOSRequest,
  CommunityReport,
  OfflineCacheManifest,
  RiskScoreHistory,
  PreparednessPhase,
  AlertSeverity,
  CommunityReportType,
  CommunityReportSeverity,
  VerificationStatus,
  SuitableFor,
  EmergencyType,
  SOSStatus,
} from './database';

import type {
  PlanGenerationOutput,
  AlertLocalizationOutput,
  QAInput,
  QAOutput,
  RiskExplanationOutput,
  ImageAnalysisOutput,
  VoiceInteractionOutput,
} from './genai';

import type {
  SOSRequestWithContext,
  CommunityReportWithContext,
} from './domain';

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T = unknown> {
  success: true;
  data: T;
  meta?: ApiResponseMeta;
}

export interface ApiResponseMeta {
  timestamp: string;
  requestId: string;
  version: string;
  pagination?: PaginationMeta;
  cache?: CacheMeta;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface CacheMeta {
  hit: boolean;
  maxAge: number;
  staleWhileRevalidate: number;
}

/**
 * Paginated response for list endpoints
 */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: ApiResponseMeta & { pagination: PaginationMeta };
}

/**
 * Error response format
 */
export interface ErrorResponse {
  success: false;
  error: ApiError;
  meta: Pick<ApiResponseMeta, 'timestamp' | 'requestId' | 'version'>;
}

export interface ApiError {
  code: ApiErrorCode;
  message: string;
  details?: Record<string, unknown>;
  field?: string; // for validation errors
  retryable: boolean;
  docsUrl?: string;
}

export type ApiErrorCode =
  // Auth errors (401, 403)
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'TOKEN_EXPIRED'
  | 'INVALID_TOKEN'
  | 'OTP_EXPIRED'
  | 'OTP_INVALID'
  | 'PHONE_NOT_VERIFIED'

  // Validation errors (400)
  | 'VALIDATION_ERROR'
  | 'INVALID_INPUT'
  | 'MISSING_REQUIRED_FIELD'
  | 'INVALID_FORMAT'
  | 'INVALID_ENUM_VALUE'

  // Resource errors (404, 409)
  | 'NOT_FOUND'
  | 'ALREADY_EXISTS'
  | 'CONFLICT'
  | 'DEPENDENCY_NOT_FOUND'

  // Business logic errors (422)
  | 'FAMILY_LIMIT_EXCEEDED'
  | 'PLAN_ALREADY_EXISTS_FOR_PHASE'
  | 'INVALID_PHASE_TRANSITION'
  | 'CHECKLIST_ITEM_NOT_FOUND'
  | 'SHELTER_AT_CAPACITY'
  | 'ROUTE_BLOCKED'
  | 'SOS_ALREADY_ACTIVE'

  // Rate limiting (429)
  | 'RATE_LIMITED'
  | 'TOO_MANY_REQUESTS'

  // Server errors (500)
  | 'INTERNAL_ERROR'
  | 'DATABASE_ERROR'
  | 'EXTERNAL_API_ERROR'
  | 'GENAI_ERROR'
  | 'GENAI_RATE_LIMITED'
  | 'GENAI_TIMEOUT'

  // Offline/PWA
  | 'OFFLINE_ACTION_QUEUED'
  | 'CACHE_STALE'
  | 'SYNC_CONFLICT';

/**
 * HTTP status codes mapped to error codes
 */
export const ERROR_CODE_STATUS_MAP: Record<ApiErrorCode, number> = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  TOKEN_EXPIRED: 401,
  INVALID_TOKEN: 401,
  OTP_EXPIRED: 400,
  OTP_INVALID: 400,
  PHONE_NOT_VERIFIED: 403,

  VALIDATION_ERROR: 400,
  INVALID_INPUT: 400,
  MISSING_REQUIRED_FIELD: 400,
  INVALID_FORMAT: 400,
  INVALID_ENUM_VALUE: 400,

  NOT_FOUND: 404,
  ALREADY_EXISTS: 409,
  CONFLICT: 409,
  DEPENDENCY_NOT_FOUND: 404,

  FAMILY_LIMIT_EXCEEDED: 422,
  PLAN_ALREADY_EXISTS_FOR_PHASE: 422,
  INVALID_PHASE_TRANSITION: 422,
  CHECKLIST_ITEM_NOT_FOUND: 404,
  SHELTER_AT_CAPACITY: 422,
  ROUTE_BLOCKED: 422,
  SOS_ALREADY_ACTIVE: 422,

  RATE_LIMITED: 429,
  TOO_MANY_REQUESTS: 429,

  INTERNAL_ERROR: 500,
  DATABASE_ERROR: 500,
  EXTERNAL_API_ERROR: 502,
  GENAI_ERROR: 502,
  GENAI_RATE_LIMITED: 429,
  GENAI_TIMEOUT: 504,

  OFFLINE_ACTION_QUEUED: 202,
  CACHE_STALE: 200,
  SYNC_CONFLICT: 409,
};

/**
 * Request context (injected by middleware)
 */
export interface RequestContext {
  requestId: string;
  userId?: string;
  familyId?: string;
  deviceId?: string;
  ip: string;
  userAgent: string;
  timestamp: string;
  locale: string;
  isOffline: boolean;
}

/**
 * Auth API types
 */
export namespace AuthApi {
  export interface SendOTPRequest {
    phone: string; // E.164 format
    language?: string;
  }

  export interface SendOTPResponse extends ApiResponse<{ sent: boolean; expiresIn: number }> {}

  export interface VerifyOTPRequest {
    phone: string;
    otp: string; // 6-digit
    deviceId?: string;
  }

  export interface VerifyOTPResponse extends ApiResponse<{
    session: UserSession;
    profile: Profile;
    isNewUser: boolean;
  }> {}

  export interface UserSession {
    accessToken: string;
    refreshToken: string;
    expiresAt: string;
  }

  export interface RefreshTokenRequest {
    refreshToken: string;
  }

  export interface RefreshTokenResponse extends ApiResponse<UserSession> {}

  export interface LogoutRequest {
    refreshToken: string;
  }

  export interface LogoutResponse extends ApiResponse<{ success: boolean }> {}
}

/**
 * Family API types
 */
export namespace FamilyApi {
  export interface CreateFamilyRequest {
    address: string;
    lat: number;
    lng: number;
    district: string;
    ward?: string;
    housingType: string;
    hazardZones?: string[];
  }

  export interface CreateFamilyResponse extends ApiResponse<Family> {}

  export interface GetFamilyResponse extends ApiResponse<FamilyWithMembers> {}

  export interface UpdateFamilyRequest {
    address?: string;
    lat?: number;
    lng?: number;
    district?: string;
    ward?: string;
    housingType?: string;
    hazardZones?: string[];
  }

  export interface UpdateFamilyResponse extends ApiResponse<Family> {}

  export interface AddMemberRequest {
    profileId: string;
    relation: string;
    age?: number;
    medicalConditions?: string[];
  }

  export interface AddMemberResponse extends ApiResponse<FamilyMember> {}

  export interface UpdateMemberRequest {
    relation?: string;
    age?: number;
    medicalConditions?: string[];
  }

  export interface UpdateMemberResponse extends ApiResponse<FamilyMember> {}

  export interface RemoveMemberResponse extends ApiResponse<{ success: boolean }> {}

  export interface FamilyWithMembers extends Family {
    members: FamilyMemberWithProfile[];
    memberCounts: {
      total: number;
      adults: number;
      children: number;
      elderly: number;
      vulnerable: number;
      pets: number;
    };
  }

  export interface FamilyMemberWithProfile extends FamilyMember {
    profile: Profile;
  }
}

/**
 * Preparedness Plan API types
 */
export namespace PlanApi {
  export interface GeneratePlanRequest {
    familyId: string;
    phase: PreparednessPhase;
    forceRegenerate?: boolean;
  }

  export interface GeneratePlanResponse extends ApiResponse<PreparednessPlanWithChecklist> {}

  export interface GetPlanRequest {
    familyId: string;
    phase: PreparednessPhase;
  }

  export interface GetPlanResponse extends ApiResponse<PreparednessPlanWithChecklist | null> {}

  export interface ListPlansRequest {
    familyId: string;
  }

  export interface ListPlansResponse extends ApiResponse<PreparednessPlanWithChecklist[]> {}

  export interface UpdateChecklistItemRequest {
    itemId: string;
    isCompleted: boolean;
  }

  export interface UpdateChecklistItemResponse extends ApiResponse<ChecklistItem> {}

  export interface ReorderChecklistRequest {
    planId: string;
    itemOrders: { id: string; sortOrder: number }[];
  }

  export interface ReorderChecklistResponse extends ApiResponse<{ success: boolean }> {}

  export interface PreparednessPlanWithChecklist extends PreparednessPlan {
    checklistItems: ChecklistItem[];
    progress: {
      total: number;
      completed: number;
      criticalPending: number;
      highPending: number;
      completionPercentage: number;
    };
  }
}

/**
 * Alert API types
 */
export namespace AlertApi {
  export interface ListWeatherAlertsRequest {
    district?: string;
    severity?: AlertSeverity;
    activeOnly?: boolean;
    limit?: number;
    offset?: number;
  }

  export interface ListWeatherAlertsResponse extends PaginatedResponse<WeatherAlert> {}

  export interface GetWeatherAlertResponse extends ApiResponse<WeatherAlert | null> {}

  export interface ListLocalizedAlertsRequest {
    familyId: string;
    unreadOnly?: boolean;
    limit?: number;
    offset?: number;
  }

  export interface ListLocalizedAlertsResponse extends PaginatedResponse<LocalizedAlertWithFamily> {}

  export interface MarkAlertReadRequest {
    alertId: string;
  }

  export interface MarkAlertReadResponse extends ApiResponse<LocalizedAlert> {}

  export interface MarkAllAlertsReadRequest {
    familyId: string;
  }

  export interface MarkAllAlertsReadResponse extends ApiResponse<{ count: number }> {}

  export interface LocalizedAlertWithFamily extends LocalizedAlert {
    weatherAlert: WeatherAlert;
    family: { id: string; district: string; ward?: string };
  }
}

/**
 * Shelter & Evacuation API types
 */
export namespace ShelterApi {
  export interface ListSheltersRequest {
    district?: string;
    ward?: string;
    lat?: number;
    lng?: number;
    radiusKm?: number;
    facility?: string;
    minCapacity?: number;
    activeOnly?: boolean;
    limit?: number;
    offset?: number;
  }

  export interface ListSheltersResponse extends PaginatedResponse<ShelterWithDistance> {}

  export interface GetShelterResponse extends ApiResponse<ShelterWithDistance | null> {}

  export interface GetEvacuationRoutesRequest {
    fromLat: number;
    fromLng: number;
    shelterId?: string;
    suitableFor?: SuitableFor;
    maxDistanceKm?: number;
  }

  export interface GetEvacuationRoutesResponse extends ApiResponse<EvacuationRouteWithDetails[]> {}

  export interface ShelterWithDistance extends Shelter {
    distanceKm: number;
    durationMin: number;
    availableCapacity: number;
    occupancyPercentage: number;
    isNearCapacity: boolean;
    route?: EvacuationRouteWithDetails;
  }

  export interface EvacuationRouteWithDetails extends Omit<EvacuationRoute, 'waypoints'> {
    shelter: Pick<Shelter, 'id' | 'name' | 'address' | 'lat' | 'lng' | 'capacity' | 'current_occupancy'>;
    waypoints: EvacuationWaypoint[];
    isCurrentlyPassable: boolean;
  }

  export interface EvacuationWaypoint {
    lat: number;
    lng: number;
    instruction: string;
  }
}

/**
 * SOS API types
 */
export namespace SosApi {
  export interface CreateSOSRequest {
    lat: number;
    lng: number;
    emergencyType: EmergencyType;
    description?: string;
  }

  export interface CreateSOSResponse extends ApiResponse<SOSRequestWithContext> {}

  export interface GetSOSRequest {
    sosId: string;
  }

  export interface GetSOSResponse extends ApiResponse<SOSRequestWithContext | null> {}

  export interface ListSOSRequestsRequest {
    familyId?: string;
    status?: SOSStatus;
    limit?: number;
    offset?: number;
  }

  export interface ListSOSRequestsResponse extends PaginatedResponse<SOSRequestWithContext> {}

  export interface UpdateSOSStatusRequest {
    sosId: string;
    status: SOSStatus;
    responseNotes?: string;
  }

  export interface UpdateSOSStatusResponse extends ApiResponse<SOSRequest> {}

  export interface CancelSOSRequest {
    sosId: string;
  }

  export interface CancelSOSResponse extends ApiResponse<SOSRequest> {}

  export interface SOSRequestWithContext extends SOSRequest {
    profile: Pick<Profile, 'id' | 'phone' | 'language'>;
    family?: Pick<Family, 'id' | 'address' | 'lat' | 'lng' | 'ward'>;
    nearestShelter?: ShelterApi.ShelterWithDistance;
    estimatedResponseTimeMin?: number;
  }
}

/**
 * Community Reports API types
 */
export namespace ReportApi {
  export interface CreateReportRequest {
    lat: number;
    lng: number;
    reportType: CommunityReportType;
    severity: CommunityReportSeverity;
    description?: string;
    photoBase64?: string;
  }

  export interface CreateReportResponse extends ApiResponse<CommunityReport> {}

  export interface ListReportsRequest {
    type?: CommunityReportType;
    severity?: CommunityReportSeverity;
    verificationStatus?: VerificationStatus;
    lat?: number;
    lng?: number;
    radiusKm?: number;
    district?: string;
    ward?: string;
    limit?: number;
    offset?: number;
    sortBy?: 'created_at' | 'severity' | 'upvotes';
    sortOrder?: 'asc' | 'desc';
  }

  export interface ListReportsResponse extends PaginatedResponse<CommunityReportWithContext> {}

  export interface UpvoteReportRequest {
    reportId: string;
  }

  export interface UpvoteReportResponse extends ApiResponse<CommunityReport> {}

  export interface VerifyReportRequest {
    reportId: string;
    status: VerificationStatus;
    verifierNotes?: string;
  }

  export interface VerifyReportResponse extends ApiResponse<CommunityReport> {}

  export interface CommunityReportWithContext extends CommunityReport {
    reporter: Pick<Profile, 'id' | 'phone'> & { credibilityScore: number };
    verification: {
      verifiedBy?: string;
      verifiedAt?: string;
      notes?: string;
    } | null;
    nearbyReports: Pick<CommunityReport, 'id' | 'report_type' | 'severity' | 'lat' | 'lng' | 'created_at'>[];
  }
}

/**
 * Risk Score API types
 */
export namespace RiskApi {
  export interface GetCurrentRiskRequest {
    familyId: string;
  }

  export interface GetCurrentRiskResponse extends ApiResponse<RiskScoreWithFactors> {}

  export interface GetRiskHistoryRequest {
    familyId: string;
    days?: number;
    limit?: number;
  }

  export interface GetRiskHistoryResponse extends ApiResponse<RiskScoreHistory[]> {}

  export interface RiskScoreWithFactors {
    score: number;
    level: 'low' | 'moderate' | 'high' | 'critical';
    factors: RiskScoreFactors;
    contributingAlerts: WeatherAlert[];
    lastCalculated: string;
    trend: 'improving' | 'stable' | 'worsening';
    trendChange: number; // percentage change
  }

  export interface RiskScoreFactors {
    weather: number;
    vulnerability: number;
    preparedness: number;
    housing: number;
  }
}

/**
 * Offline Cache API types
 */
export namespace OfflineApi {
  export interface GetManifestRequest {
    deviceId: string;
  }

  export interface GetManifestResponse extends ApiResponse<OfflineCacheManifest | null> {}

  export interface SyncManifestRequest {
    deviceId: string;
    checklistItems?: ChecklistItem[];
    evacuationRoutes?: EvacuationRoute[];
    shelters?: Shelter[];
    emergencyContacts?: EmergencyContact[];
    pendingActions?: PendingOfflineAction[];
  }

  export interface SyncManifestResponse extends ApiResponse<OfflineCacheManifest> {}

  export interface EmergencyContact {
    name: string;
    phone: string;
    type: 'police' | 'fire' | 'ambulance' | 'disaster_management' | 'family' | 'other';
  }

  export interface PendingOfflineAction {
    id: string;
    type: 'checklist_complete' | 'sos_request' | 'community_report' | 'plan_generation';
    payload: unknown;
    createdAt: string;
    retryCount: number;
  }
}

/**
 * GenAI API types
 */
export namespace GenAiApi {
  export interface GeneratePlanRequest {
    familyId: string;
    phase: PreparednessPhase;
    language: string;
    context?: Record<string, unknown>;
  }

  export interface GeneratePlanResponse extends ApiResponse<PlanGenerationOutput> {}

  export interface LocalizeAlertRequest {
    weatherAlertId: string;
    familyId: string;
    language: string;
  }

  export interface LocalizeAlertResponse extends ApiResponse<AlertLocalizationOutput> {}

  export interface AskQuestionRequest {
    question: string;
    language: string;
    context?: {
      familyId?: string;
      phase?: PreparednessPhase;
      currentAlerts?: WeatherAlert[];
    };
    conversationHistory?: QAInput[];
  }

  export interface AskQuestionResponse extends ApiResponse<QAOutput> {}

  export interface ExplainRiskRequest {
    familyId: string;
    language: string;
    detailLevel: 'summary' | 'detailed' | 'technical';
  }

  export interface ExplainRiskResponse extends ApiResponse<RiskExplanationOutput> {}

  export interface AnalyzeImageRequest {
    imageBase64: string;
    mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
    context: {
      lat: number;
      lng: number;
      timestamp: string;
      reporterNotes?: string;
    };
    analysisType: 'waterlogging_severity' | 'road_condition' | 'shelter_status' | 'damage_assessment';
    language: string;
  }

  export interface AnalyzeImageResponse extends ApiResponse<ImageAnalysisOutput> {}

  export interface VoiceInteractionRequest {
    audioBase64: string;
    mimeType: 'audio/webm' | 'audio/mp4' | 'audio/wav';
    language: string;
    context: QAInput['context'];
  }

  export interface VoiceInteractionResponse extends ApiResponse<VoiceInteractionOutput> {}
}

/**
 * Webhook payloads for external integrations
 */
export interface WebhookPayload {
  event: WebhookEventType;
  timestamp: string;
  data: unknown;
  signature: string;
}

export type WebhookEventType =
  | 'weather_alert.created'
  | 'weather_alert.updated'
  | 'weather_alert.expired'
  | 'localized_alert.generated'
  | 'sos_request.created'
  | 'sos_request.updated'
  | 'sos_request.resolved'
  | 'community_report.created'
  | 'community_report.verified'
  | 'risk_score.updated'
  | 'plan.generated'
  | 'checklist_item.completed'
  | 'family.created'
  | 'family.updated'
  | 'member.added'
  | 'member.removed'
  | 'offline_cache.synced';

export interface WeatherAlertWebhookData {
  alert: WeatherAlert;
  affectedFamilies: number;
}

export interface SOSRequestWebhookData {
  sos: SOSRequestWithContext;
  nearestResponders: string[];
}

export interface CommunityReportWebhookData {
  report: CommunityReportWithContext;
  nearbyReports: number;
}

/**
 * Health check response
 */
export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  checks: HealthCheck[];
}

export interface HealthCheck {
  name: string;
  status: 'pass' | 'warn' | 'fail';
  latencyMs?: number;
  details?: Record<string, unknown>;
}

/**
 * Version info
 */
export interface VersionInfo {
  version: string;
  commit: string;
  buildTime: string;
  environment: 'development' | 'staging' | 'production';
}

/**
 * Utility type for extracting request/response types
 */
export type ExtractRequest<T> = T extends { Request: infer R } ? R : never;
export type ExtractResponse<T> = T extends { Response: infer R } ? R : never;

/**
 * API route handler types
 */
export interface ApiRouteHandler<TRequest, TResponse> {
  (request: TRequest, context: RequestContext): Promise<ApiResponse<TResponse> | ErrorResponse>;
}

/**
 * Middleware types
 */
export interface MiddlewareContext {
  request: Request;
  context: RequestContext;
  next: () => Promise<Response>;
}

export type MiddlewareHandler = (ctx: MiddlewareContext) => Promise<Response>;