/**
 * Main types barrel export
 * Re-exports all type definitions for the monsoon assistant project
 */

// Database types (Supabase-generated + domain-specific)
export type {
  Profile,
  Family,
  FamilyMember,
  PreparednessPlan,
  PreparednessPlanInsert,
  PreparednessPlanUpdate,
  ChecklistItem,
  ChecklistItemInsert,
  ChecklistItemUpdate,
  WeatherAlert,
  WeatherAlertInsert,
  WeatherAlertUpdate,
  LocalizedAlert,
  LocalizedAlertInsert,
  LocalizedAlertUpdate,
  Shelter,
  ShelterInsert,
  ShelterUpdate,
  EvacuationRoute,
  EvacuationRouteInsert,
  EvacuationRouteUpdate,
  SOSRequest,
  SOSRequestInsert,
  SOSRequestUpdate,
  CommunityReport,
  CommunityReportInsert,
  CommunityReportUpdate,
  OfflineCacheManifest,
  OfflineCacheManifestInsert,
  OfflineCacheManifestUpdate,
  RiskScoreHistory,
  RiskScoreHistoryInsert,
  RiskScoreHistoryUpdate,
  ProfileInsert,
  FamilyInsert,
  FamilyMemberInsert,
  ProfileUpdate,
  FamilyUpdate,
  FamilyMemberUpdate,
  // Enums
  PreparednessPhase,
  ChecklistPriority,
  AlertSeverity,
  EmergencyType,
  SOSStatus,
  CommunityReportType,
  CommunityReportSeverity,
  VerificationStatus,
  RoadCondition,
  SuitableFor,
  // Utilities
  Json,
  LanguageCode,
  ChecklistCategory,
  SupportedLanguage,
} from './database';

// Domain types (enriched/computed types)
export type {
  FamilyWithMembers,
  FamilyMemberWithProfile,
  FamilyRiskScore,
  RiskScoreFactors,
  RiskFactorBreakdown,
  AlertWithLocalization,
  LocalizedAlertWithFamilyContext,
  ShelterWithDistance,
  EvacuationRouteWithWaypoints,
  EvacuationWaypointWithInstruction,
  SOSRequestWithContext,
  CommunityReportWithContext,
  PlanWithChecklist,
  OfflineCacheStatus,
  UserSession,
} from './domain';

// GenAI types (LLM inputs/outputs)
export * from './genai';

// UI state types (frontend-only)
export * from './ui';

// API types (route handlers)
export * from './api';

// Re-export GenAI types explicitly
export type {
  PlanGenerationInput,
  PlanGenerationOutput,
  AlertLocalizationInput,
  AlertLocalizationOutput,
  QAInput,
  QAOutput,
  RiskExplanationInput,
  RiskExplanationOutput,
  ImageAnalysisInput,
  ImageAnalysisOutput,
  VoiceInteractionInput,
  VoiceInteractionOutput,
} from './genai';

export type {
  MobileNavState,
  ChecklistFilterState,
  AlertFilterState,
  LanguageSelectorState,
  OfflineStatus,
  PWAInstallPromptState,
  ToastState,
  ModalState,
  FormState,
  AsyncState,
  AppState,
} from './ui';

export type {
  ApiResponse,
  PaginatedResponse,
  ErrorResponse,
  ApiError,
  ApiErrorCode,
  RequestContext,
} from './api';