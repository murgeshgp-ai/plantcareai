import { PlantCategory } from '../data/plantDatabase';

export type IndianSeasonId = 'summer' | 'monsoon' | 'post-monsoon' | 'winter';

export type KarnatakaClimateZoneId =
  | 'general-karnataka'
  | 'bengaluru-south-interior'
  | 'coastal-malnad'
  | 'north-interior';

export interface ClimateZoneInfo {
  id: KarnatakaClimateZoneId;
  label: string;
  shortLabel: string;
  regions: string;
  description: string;
}

export interface IndianSeasonMeta {
  id: IndianSeasonId;
  name: string;
  kannadaName: string;
  monthsLabel: string;
  months: number[]; // 1-12 (Jan = 1)
  tagline: string;
  overview: string;
  generalTips: string[];
  recommendedActivities: string[];
  regionalNotes: Record<KarnatakaClimateZoneId, string>;
}

export interface SeasonalCareGuidanceFields {
  watering: string;
  sunlight: string;
  soilMoisture: string;
  fertilizer: string;
  pruning: string;
  pestAndDisease: string;
  heatAndRainProtection: string;
}

export interface PlantSeasonalOverride {
  attentionBySeason?: Partial<Record<IndianSeasonId, 'high' | 'moderate' | 'low'>>;
  attentionReasonBySeason?: Partial<Record<IndianSeasonId, string>>;
  seasons: Partial<Record<IndianSeasonId, Partial<SeasonalCareGuidanceFields>>>;
}

export interface PlantSeasonalCareAdvice extends SeasonalCareGuidanceFields {
  plantId: string;
  plantName: string;
  kannadaName?: string;
  category: PlantCategory;
  isOutdoorLocation: boolean;
  season: IndianSeasonId;
  climateZone: KarnatakaClimateZoneId;
  attentionLevel: 'high' | 'moderate' | 'low';
  attentionReason: string;
  quickChecklist: string[];
}

export interface SeasonalReminderSuggestion {
  id: string;
  plantId: string;
  plantName: string;
  plantRoom: string;
  season: IndianSeasonId;
  careFocus: 'watering' | 'protection' | 'pest' | 'pruning' | 'fertilizer';
  title: string;
  suggestion: string;
  priority: 'high' | 'medium';
}
