// ============================================================
// Session & State Machine
// ============================================================

export const SESSION_STATUSES = [
  'uploading',
  'onboarding',
  'annotating',
  'analyzing',
  'reviewing',
  'round_1_questionnaire',
  'round_1_probes',
  'round_1_compare',
  'round_2_questionnaire',
  'round_2_probes',
  'round_2_compare',
  'round_3_questionnaire',
  'round_3_probes',
  'round_3_compare',
  'compiling',
  'complete',
] as const;

export type SessionStatus = (typeof SESSION_STATUSES)[number];

// ============================================================
// V2: Onboarding Data
// ============================================================

export interface OnboardingData {
  useCase: string; // 'saas_dashboard' | 'landing_page' | 'mobile_app' | 'portfolio' | 'ecommerce' | 'other'
  useCaseOther?: string;
  experienceLevel: string; // 'none' | 'some' | 'professional' | 'design_lead'
  tasteAnchors: string[]; // brand IDs like 'apple', 'linear', 'notion', etc.
  visionPrompt?: string; // free-text description of their vision
  visionFileUrl?: string; // optional uploaded file
}

// ============================================================
// V2: Reference Source & Classification
// ============================================================

export type ReferenceSource = 'screenshot' | 'url' | 'pinterest';
export type SurfaceType = 'marketing_landing' | 'product_web_app' | 'mobile_app' | 'editorial' | 'visual_brand' | 'unknown';
export type ReferenceRole = 'anchor' | 'peripheral' | 'outlier' | 'unclassified';

// ============================================================
// V2: Clustering
// ============================================================

export interface TasteCluster {
  id: string;
  name: string;
  description: string;
  memberRefIds: string[];
  dominanceScore: number; // 0-1
  surfaceTypes: SurfaceType[];
}

export interface ClusteringResult {
  clusters: TasteCluster[];
  outlierRefIds: string[];
  contradictions: {
    clusterA: string;
    clusterB: string;
    description: string;
    severity: 'high' | 'medium' | 'low';
  }[];
}

// ============================================================
// V2: Convergence
// ============================================================

export interface ConvergenceDecision {
  shouldContinue: boolean;
  reason: string;
  overallConfidence: number; // 0-1
  lockedAxes: string[]; // axis IDs that are settled
  uncertainAxes: string[]; // axis IDs still needing work
  nextRoundDepth: 'light' | 'standard' | 'deep';
  recommendedQuestionCount: number;
  recommendedProbeCount: number;
}

// ============================================================
// Taste Axes
// ============================================================

export type TasteCategory =
  | 'structure'
  | 'typography'
  | 'surface'
  | 'color'
  | 'ui_personality';

export interface TasteAxisDefinition {
  id: string;
  category: TasteCategory;
  label: string;
  leftPole: string;
  rightPole: string;
  highDivergence: boolean;
}

export interface TasteAxisPosition {
  axisId: string;
  category: TasteCategory;
  label: string;
  position: number; // 0-100
  confidence: number; // 0-1
  evidence: string[];
  signalStrength: 'strong' | 'moderate' | 'weak';
  locked?: boolean; // V2: axis is settled, stop questioning
}

export type TasteMap = Record<string, TasteAxisPosition>;

// ============================================================
// Reference Analysis (Module 1 output)
// ============================================================

export interface ReferenceAnalysis {
  layoutStyle: string;
  gridBehavior: string;
  spacingRhythm: string;
  breathingRoom: string;
  typeHierarchy: {
    levels: number;
    weightContrast: string;
    style: string;
    behavior: string;
  };
  density: {
    score: number;
    characterization: string;
  };
  colorSystem: {
    paletteType: string;
    dominantTemperature: string;
    contrastLevel: string;
    accentRole: string;
  };
  surfaceTreatment: {
    depth: string;
    borders: string;
    shadows: string;
    radius: string;
    material: string;
  };
  navBehavior: string;
  cardBehavior: string;
  iconStyle: string;
  imageryRole: string;
  motionCues: string;
  overallEnergy: string;
  designFamilyGuess: string;
  repeatedMotifs: string[];
  conflictingSignals: string[];
  likelyOutlier: boolean;
  outlierReason: string | null;
  // V2 additions
  detectedFonts?: string[];
  detectedColors?: string[];
  surfaceClassification?: SurfaceType;
}

export interface ReferenceAnnotations {
  tags: string[];
  note: string;
}

// ============================================================
// Internal Critic (Module 3 output)
// ============================================================

export interface CriticOutput {
  strongHypotheses: {
    axis: string;
    claim: string;
    whyStrong: string;
  }[];
  weakHypotheses: {
    axis: string;
    claim: string;
    whyWeak: string;
  }[];
  contradictions: {
    axes: string[];
    description: string;
    severity: 'high' | 'medium' | 'low';
  }[];
  uncertainties: {
    dimension: string;
    question: string;
  }[];
  clarificationNeeded: string[];
}

// ============================================================
// Questionnaire (Module 4)
// ============================================================

export interface QuestionOption {
  id: string;
  text: string;
  implies: string[];
}

export interface Question {
  id: string;
  text: string;
  category: TasteCategory;
  axisTargets: string[];
  options: QuestionOption[];
  type: 'tradeoff' | 'elimination' | 'ranking';
  targeting: 'high_divergence' | 'weak_hypothesis' | 'contradiction' | 'uncertainty' | 'confirmation';
  whyAsking: string;
  surface?: 'core' | 'web' | 'app'; // V2: which surface this targets
}

export interface QuestionAnswer {
  questionId: string;
  selectedOptionIds: string[];
  freeText?: string;
}

// ============================================================
// Probes (Module 5)
// ============================================================

export type ProbeType = 'landing_hero' | 'dashboard' | 'settings' | 'card_list';
export type ProbeContentType = 'ai_image' | 'html_css' | 'screenshot'; // V2: added screenshot

export type ProbeRatingType =
  | 'closest'
  | 'like_it'
  | 'too_cold'
  | 'too_generic'
  | 'too_ornamental'
  | 'dont_like_it'
  | 'best_part'
  | 'wrong_part';

export interface ProbeDesignTokens {
  colorBg: string;
  colorSurface: string;
  colorText: string;
  colorTextSecondary: string;
  colorAccent: string;
  colorBorder: string;
  fontFamily: string;
  fontSizeBase: string;
  fontSizeH1: string;
  fontSizeH2: string;
  fontSizeSmall: string;
  fontWeightHeading: string;
  lineHeight: string;
  letterSpacing: string;
  spacingUnit: string;
  containerMaxWidth: string;
  sectionPadding: string;
  borderRadius: string;
  shadowSmall: string;
  shadowMedium: string;
  borderWidth: string;
  gridColumns: number;
  gridGap: string;
  navStyle: 'sidebar' | 'topbar' | 'minimal';
  density: 'compact' | 'comfortable' | 'spacious';
}

// ============================================================
// Preference Delta (Module 6 output)
// ============================================================

export interface PreferenceDelta {
  axisId: string;
  direction: string;
  magnitude: number;
  confidence: number;
  evidence: string;
}

export interface PreferenceDeltaResult {
  deltas: PreferenceDelta[];
  tasteMapUpdates: {
    axisId: string;
    oldPosition: number;
    newPosition: number;
    reason: string;
  }[];
  resolvedContradictions: string[];
  newUncertainties: string[];
}

// ============================================================
// AI Provider Types
// ============================================================

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;
}

export type AIProviderType = 'claude' | 'gemini' | 'openai';
export type AICapability = 'text' | 'vision' | 'image_generation';
