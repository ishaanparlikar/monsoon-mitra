/**
 * UI state types for the PWA frontend.
 * Framework-agnostic TypeScript types for state management.
 */

import type {
  PreparednessPhase,
  ChecklistPriority,
  ChecklistCategory,
  AlertSeverity,
  EmergencyType,
  SOSStatus,
  CommunityReportType,
  CommunityReportSeverity,
  VerificationStatus,
  LanguageCode,
  ChecklistItem,
} from './database';

import type { PreparednessPlan } from './domain';

import type {
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
  OfflineCacheStatus,
  UserSession,
} from './domain';

/**
 * Mobile bottom navigation
 */
export interface MobileNavState {
  activeTab: MobileNavTab;
  previousTab: MobileNavTab | null;
  isAnimating: boolean;
}

export type MobileNavTab = 'home' | 'plan' | 'alerts' | 'shelters' | 'sos' | 'profile';

export const MOBILE_NAV_TABS: readonly MobileNavTab[] = [
  'home',
  'plan',
  'alerts',
  'shelters',
  'sos',
  'profile',
] as const;

export const MOBILE_NAV_TAB_LABELS: Record<MobileNavTab, string> = {
  home: 'Home',
  plan: 'My Plan',
  alerts: 'Alerts',
  shelters: 'Shelters',
  sos: 'SOS',
  profile: 'Profile',
};

export const MOBILE_NAV_TAB_ICONS: Record<MobileNavTab, string> = {
  home: 'home',
  plan: 'checklist',
  alerts: 'alert-triangle',
  shelters: 'building',
  sos: 'alert-circle',
  profile: 'user',
};

/**
 * Checklist filtering and sorting
 */
export interface ChecklistFilterState {
  priorities: ChecklistPriority[];
  categories: ChecklistCategory[];
  phases: PreparednessPhase[];
  showCompleted: boolean;
  searchQuery: string;
  sortBy: ChecklistSortOption;
  sortOrder: 'asc' | 'desc';
}

export type ChecklistSortOption = 'priority' | 'category' | 'phase' | 'order' | 'completion';

export const DEFAULT_CHECKLIST_FILTER: ChecklistFilterState = {
  priorities: ['critical', 'high', 'medium', 'low'],
  categories: [
    'home_prep',
    'documents',
    'emergency_kit',
    'evacuation',
    'health',
    'communication',
  ],
  phases: ['pre_monsoon', 'active_monsoon', 'post_monsoon'],
  showCompleted: true,
  searchQuery: '',
  sortBy: 'priority',
  sortOrder: 'asc',
};

/**
 * Alert filtering
 */
export interface AlertFilterState {
  severities: AlertSeverity[];
  types: string[];
  readStatus: 'all' | 'read' | 'unread';
  dateFrom: Date | null;
  dateTo: Date | null;
  searchQuery: string;
}

export const DEFAULT_ALERT_FILTER: AlertFilterState = {
  severities: ['watch', 'alert', 'warning'],
  types: [],
  readStatus: 'all',
  dateFrom: null,
  dateTo: null,
  searchQuery: '',
};

/**
 * Language selector
 */
export interface LanguageSelectorState {
  isOpen: boolean;
  selectedLanguage: LanguageCode;
  searchQuery: string;
  recentLanguages: LanguageCode[];
}

const SUPPORTED_LANGUAGES: readonly LanguageCode[] = [
  'en',
  'hi',
  'mr',
  'gu',
  'bn',
  'ta',
  'te',
  'kn',
  'ml',
  'or',
  'pa',
  'as',
] as const;

export const LANGUAGE_META: Record<LanguageCode, { name: string; nativeName: string }> = {
  en: { name: 'English', nativeName: 'English' },
  hi: { name: 'Hindi', nativeName: 'हिन्दी' },
  mr: { name: 'Marathi', nativeName: 'मराठी' },
  gu: { name: 'Gujarati', nativeName: 'ગુજરાતી' },
  bn: { name: 'Bengali', nativeName: 'বাংলা' },
  ta: { name: 'Tamil', nativeName: 'தமிழ்' },
  te: { name: 'Telugu', nativeName: 'తెలుగు' },
  kn: { name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  ml: { name: 'Malayalam', nativeName: 'മലയാളം' },
  or: { name: 'Odia', nativeName: 'ଓଡ଼ିଆ' },
  pa: { name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
  as: { name: 'Assamese', nativeName: 'অসমীয়া' },
};

/**
 * Offline/PWA status
 */
export interface OfflineStatus {
  isOnline: boolean;
  wasOffline: boolean;
  lastOnlineAt: Date | null;
  lastSyncAt: Date | null;
  pendingActions: PendingOfflineAction[];
  cacheStatus: OfflineCacheStatus;
}

export interface PendingOfflineAction {
  id: string;
  type: 'checklist_complete' | 'sos_request' | 'community_report' | 'plan_generation';
  payload: unknown;
  createdAt: Date;
  retryCount: number;
  maxRetries: number;
}



/**
 * PWA Install prompt state
 */
export interface PWAInstallPromptState {
  isSupported: boolean;
  isPromptAvailable: boolean;
  hasDismissed: boolean;
  hasInstalled: boolean;
  platform: 'android' | 'ios' | 'desktop' | 'unknown';
  userAgent: string;
  beforeInstallPromptEvent: BeforeInstallPromptEvent | null;
}

export interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * Toast notifications
 */
export interface ToastState {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  action?: ToastAction;
  createdAt: Date;
  isVisible: boolean;
}

export interface ToastAction {
  label: string;
  onClick: () => void;
}

/**
 * Modal/dialog state
 */
export interface ModalState<T = unknown> {
  isOpen: boolean;
  type: ModalType;
  data?: T;
  onClose?: () => void;
  onConfirm?: (data: T) => void | Promise<void>;
}

export type ModalType =
  | 'confirm'
  | 'alert'
  | 'prompt'
  | 'language_select'
  | 'filter'
  | 'share'
  | 'emergency_contacts'
  | 'sos_confirm'
  | 'report_submit'
  | 'offline_banner'
  | 'plan_generation'
  | 'image_capture'
  | 'voice_recording';

/**
 * Form validation
 */
export interface FormFieldState<T = string> {
  value: T;
  error?: string;
  touched: boolean;
  dirty: boolean;
}

export interface FormState<T extends Record<string, unknown>> {
  fields: { [K in keyof T]: FormFieldState<T[K]> };
  isSubmitting: boolean;
  isValid: boolean;
  submitCount: number;
  errors: Partial<Record<keyof T, string>>;
}

/**
 * Async operation states
 */
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T> {
  status: LoadingState;
  data?: T;
  error?: string;
  lastUpdated?: Date;
}

export function createAsyncState<T>(): AsyncState<T> {
  return { status: 'idle' };
}

export function setAsyncLoading<T>(state: AsyncState<T>): AsyncState<T> {
  return { ...state, status: 'loading', error: undefined };
}

export function setAsyncSuccess<T>(state: AsyncState<T>, data: T): AsyncState<T> {
  return { ...state, status: 'success', data, lastUpdated: new Date(), error: undefined };
}

export function setAsyncError<T>(state: AsyncState<T>, error: string): AsyncState<T> {
  return { ...state, status: 'error', error };
}

/**
 * Pagination
 */
export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
}

export const DEFAULT_PAGINATION: PaginationState = {
  page: 1,
  pageSize: 20,
  total: 0,
  hasMore: false,
};

/**
 * Map/location state
 */
export interface MapState {
  center: { lat: number; lng: number };
  zoom: number;
  selectedLocation?: { lat: number; lng: number; label: string };
  markers: MapMarker[];
  userLocation?: { lat: number; lng: number; accuracy: number };
  isLocating: boolean;
  locationError?: string;
}

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  type: 'shelter' | 'family' | 'sos' | 'report' | 'route_start' | 'route_end';
  label: string;
  data?: unknown;
}

/**
 * SOS button press-and-hold state
 */
export interface SOSButtonState {
  isPressing: boolean;
  pressProgress: number;
  requiredHoldMs: number;
  hasTriggered: boolean;
  countdownMs: number;
}

/**
 * Onboarding flow state
 */
export interface OnboardingState {
  currentStep: number;
  totalSteps: number;
  completedSteps: number[];
  isComplete: boolean;
  skippedSteps: number[];
  userData: Partial<OnboardingData>;
}

export interface OnboardingData {
  phone?: string;
  otp?: string;
  language?: LanguageCode;
  familyId?: string;
  isPrimaryMember?: boolean;
  address?: string;
  lat?: number;
  lng?: number;
  housingType?: string;
  members?: OnboardingMember[];
}

export interface OnboardingMember {
  relation: string;
  age?: number;
  medicalConditions?: string[];
}

/**
 * Theme/appearance
 */
export interface ThemeState {
  mode: 'light' | 'dark' | 'system';
  systemPreference: 'light' | 'dark';
  effectiveMode: 'light' | 'dark';
  highContrast: boolean;
  reducedMotion: boolean;
}

/**
 * Accessibility
 */
export interface AccessibilityState {
  screenReaderActive: boolean;
  highContrast: boolean;
  largeText: boolean;
  reducedMotion: boolean;
  voiceOverEnabled: boolean;
  talkBackEnabled: boolean;
}

/**
 * Feature flags
 */
export interface FeatureFlags {
  offlineMode: boolean;
  voiceInteraction: boolean;
  imageAnalysis: boolean;
  communityReports: boolean;
  riskScoreTrends: boolean;
  multiLanguage: boolean;
  pwaInstallPrompt: boolean;
  analytics: boolean;
}

/**
 * Global app state shape
 */
export interface AppState {
  auth: AuthState;
  family: FamilyState;
  plan: PlanState;
  alerts: AlertsState;
  shelters: SheltersState;
  sos: SOSState;
  reports: ReportsState;
  offline: OfflineStatus;
  pwa: PWAInstallPromptState;
  ui: UIState;
  accessibility: AccessibilityState;
  features: FeatureFlags;
}

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  profile: UserProfile | null;
  session: UserSession | null;
  error?: string;
}

export interface UserProfile {
  id: string;
  phone: string;
  language: LanguageCode;
  dialect?: string | null;
}



export interface FamilyState {
  currentFamily: FamilyWithMembers | null;
  families: FamilyWithMembers[];
  isLoading: boolean;
  error?: string;
}

export interface PlanState {
  currentPlan: PreparednessPlan | null;
  plans: PreparednessPlan[];
  isLoading: boolean;
  error?: string;
}

export interface AlertsState {
  items: AlertWithLocalization[];
  filter: AlertFilterState;
  unreadCount: number;
  isLoading: boolean;
  error?: string;
}



export interface SheltersState {
  items: ShelterWithDistance[];
  filter: ShelterFilterState;
  selectedShelter?: ShelterWithDistance;
  isLoading: boolean;
  error?: string;
}



export interface ShelterFacilities {
  water: boolean;
  toilets: boolean;
  medical: boolean;
  food: boolean;
}

export interface ShelterFilterState {
  hasFacility?: ('water' | 'toilets' | 'medical' | 'food')[];
  maxDistanceKm?: number;
  minAvailableCapacity?: number;
  isActive?: boolean;
}



export interface SOSState {
  activeRequests: SOSRequestWithContext[];
  buttonState: SOSButtonState;
  isLoading: boolean;
  error?: string;
}



export interface ReportsState {
  items: CommunityReportWithContext[];
  filter: ReportFilterState;
  isLoading: boolean;
  error?: string;
}



export interface ReportFilterState {
  type?: CommunityReportType[];
  severity?: CommunityReportSeverity[];
  verificationStatus?: VerificationStatus[];
  dateFrom?: Date;
  dateTo?: Date;
  bounds?: { lat: number; lng: number; radiusKm: number };
}

export interface UIState {
  mobileNav: MobileNavState;
  checklists: { filter: ChecklistFilterState };
  alerts: { filter: AlertFilterState };
  language: LanguageSelectorState;
  toasts: ToastState[];
  modals: Record<string, ModalState>;
  map: MapState;
  onboarding: OnboardingState | null;
  theme: ThemeState;
}