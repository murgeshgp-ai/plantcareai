export type AchievementCategory = 'collection' | 'care' | 'growth' | 'gardening';

export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'emerald';

export interface AchievementDefinition {
  id: string;
  title: string;
  description: string;
  category: AchievementCategory;
  tier: AchievementTier;
  targetValue: number;
  icon: string;
}

export interface UnlockedAchievement {
  id: string;
  unlockedAt: string; // ISO 8601 timestamp string
}

export interface AchievementWithProgress extends AchievementDefinition {
  isUnlocked: boolean;
  unlockedAt?: string;
  currentValue: number;
  progressPercentage: number; // 0 to 100
}

export interface UserActivityStats {
  // Cumulative care actions recorded by the user in the app
  totalWaterings: number;
  totalFertilizings: number;
  totalPrunings: number;
  totalCareActions: number;

  // Distinct calendar dates (YYYY-MM-DD) on which the user completed care activities
  activeCareDates: string[];

  // User-created plant IDs (excluding default sample plants)
  userPlantIds: string[];

  // User-created growth record IDs (excluding initial sample records)
  userGrowthRecordIds: string[];

  // User-created growth records that have a milestone photo
  growthRecordsWithPhotoCount: number;

  // Number of times Vacation Mode was activated
  vacationModeActivations: number;

  // Last update timestamp
  lastUpdated?: string;
}

export interface EvaluationResult {
  achievementsWithProgress: AchievementWithProgress[];
  newlyUnlocked: AchievementWithProgress[];
  updatedUnlocked: Record<string, UnlockedAchievement>;
}
