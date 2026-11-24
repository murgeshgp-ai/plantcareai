export type LeafCondition = 'healthy' | 'yellowing' | 'brown-spots' | 'wilting';

export type PestCondition = 'no-pests' | 'possible-pests' | 'visible-pests';

export type SoilCondition = 'moist' | 'normal' | 'too-dry';

export type OverallAppearance = 'healthy' | 'average' | 'poor';

export type HealthLabel = 'Excellent' | 'Good' | 'Fair' | 'Needs Attention';

export interface HealthAssessment {
  id: string;
  plantId: string;
  assessedAt: string; // ISO date string YYYY-MM-DD
  leafCondition: LeafCondition;
  pestCondition: PestCondition;
  soilCondition: SoilCondition;
  overallAppearance: OverallAppearance;
  notes?: string;
  score: number; // 0 - 100 snapshot at assessment time
  createdAt: string;
}

export interface FactorBreakdown {
  name: string;
  score: number;
  weight: number; // Percentage, e.g. 40
  status: 'good' | 'warning' | 'alert';
  detail: string;
}

export interface HealthScoreBreakdown {
  totalScore: number; // 0 - 100
  label: HealthLabel;
  careConsistencyScore: number;
  conditionScore: number | null;
  growthScore: number | null;
  weights: {
    care: number;
    condition: number;
    growth: number;
  };
  factors: FactorBreakdown[];
  explanation: string;
  recommendations: string[];
  previousScore: number | null;
  scoreDelta: number | null;
  lastAssessedAt: string | null;
  latestAssessment: HealthAssessment | null;
}
