import { 
  AchievementWithProgress, 
  EvaluationResult, 
  UnlockedAchievement, 
  UserActivityStats 
} from '../types/achievement';
import { ACHIEVEMENT_CATALOG } from '../data/achievementCatalog';
import { Plant, CareType } from '../types/plant';
import { GrowthRecord } from '../types/growth';
import { INITIAL_GROWTH_RECORDS } from '../data/sampleGrowthRecords';

/**
 * Hardcoded sample plant IDs from samplePlants.ts that must never count as custom user plants.
 */
export const SAMPLE_PLANT_IDS = new Set<string>([
  'plant-1',
  'plant-2',
  'plant-3',
  'plant-4',
  'plant-5',
  'plant-6',
  'plant-7',
]);

/**
 * Preloaded sample growth record IDs from sampleGrowthRecords.ts.
 */
export const SAMPLE_GROWTH_RECORD_IDS = new Set<string>(
  INITIAL_GROWTH_RECORDS.map((r) => r.id)
);

/**
 * Checks whether a given plant ID belongs to the initial sample collection.
 */
export function isSamplePlantId(plantId: string): boolean {
  return SAMPLE_PLANT_IDS.has(plantId);
}

/**
 * Checks whether a given growth record ID belongs to the initial preloaded sample records.
 */
export function isSampleGrowthRecordId(recordId: string): boolean {
  if (SAMPLE_GROWTH_RECORD_IDS.has(recordId)) return true;
  // Sample IDs use format growth-m1, growth-f1, growth-s1, etc.
  return /^growth-[a-z]\d+$/i.test(recordId);
}

/**
 * Pure helper to record a genuine user care action into stats.
 * Increments care counters and registers the date if it's a new active care day.
 */
export function recordCareAction(
  stats: UserActivityStats,
  careType: CareType,
  dateStr: string
): UserActivityStats {
  const updatedCareDates = stats.activeCareDates.includes(dateStr)
    ? stats.activeCareDates
    : [...stats.activeCareDates, dateStr];

  return {
    ...stats,
    totalWaterings: stats.totalWaterings + (careType === 'water' ? 1 : 0),
    totalFertilizings: stats.totalFertilizings + (careType === 'fertilize' ? 1 : 0),
    totalPrunings: stats.totalPrunings + (careType === 'prune' ? 1 : 0),
    totalCareActions: stats.totalCareActions + 1,
    activeCareDates: updatedCareDates,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Pure helper to record a custom plant creation by the user.
 * Ignores sample plant IDs.
 */
export function recordPlantAdded(
  stats: UserActivityStats,
  plantId: string
): UserActivityStats {
  if (isSamplePlantId(plantId) || stats.userPlantIds.includes(plantId)) {
    return stats;
  }
  return {
    ...stats,
    userPlantIds: [...stats.userPlantIds, plantId],
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Pure helper to record a user-created growth measurement record.
 * Ignores sample growth record IDs.
 */
export function recordGrowthRecordAdded(
  stats: UserActivityStats,
  recordId: string,
  hasPhoto: boolean
): UserActivityStats {
  if (isSampleGrowthRecordId(recordId) || stats.userGrowthRecordIds.includes(recordId)) {
    return stats;
  }
  return {
    ...stats,
    userGrowthRecordIds: [...stats.userGrowthRecordIds, recordId],
    growthRecordsWithPhotoCount: stats.growthRecordsWithPhotoCount + (hasPhoto ? 1 : 0),
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Pure helper to record Vacation Mode activation.
 */
export function recordVacationActivated(stats: UserActivityStats): UserActivityStats {
  return {
    ...stats,
    vacationModeActivations: stats.vacationModeActivations + 1,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Calculates user-created growth record counts grouped by plantId.
 */
export function getMaxUserGrowthRecordsPerPlant(
  growthRecords: GrowthRecord[],
  userGrowthRecordIds: string[]
): number {
  const userRecordSet = new Set(userGrowthRecordIds);
  const plantCounts: Record<string, number> = {};

  for (const record of growthRecords) {
    // Only count genuine user records (either in userGrowthRecordIds or not a sample record)
    if (userRecordSet.has(record.id) || !isSampleGrowthRecordId(record.id)) {
      plantCounts[record.plantId] = (plantCounts[record.plantId] || 0) + 1;
    }
  }

  const counts = Object.values(plantCounts);
  return counts.length > 0 ? Math.max(...counts) : 0;
}

/**
 * Pure evaluation function that calculates progress for all 16 achievements,
 * detects newly unlocked badges without duplicate unlocks, and preserves timestamps.
 */
export function evaluateAchievements(
  stats: UserActivityStats,
  plants: Plant[],
  growthRecords: GrowthRecord[],
  currentUnlocked: Record<string, UnlockedAchievement>
): EvaluationResult {
  const nowIso = new Date().toISOString();
  const updatedUnlocked: Record<string, UnlockedAchievement> = { ...currentUnlocked };
  const newlyUnlocked: AchievementWithProgress[] = [];
  const achievementsWithProgress: AchievementWithProgress[] = [];

  // Compute live contextual metrics
  // 1. Distinct rooms represented among user-added custom plants (excluding sample plants)
  const userCustomPlants = plants.filter(
    (p) => stats.userPlantIds.includes(p.id) || !isSamplePlantId(p.id)
  );
  const distinctRoomsCount = new Set(
    userCustomPlants.map((p) => p.room.trim().toLowerCase())
  ).size;

  // 2. Maximum user-added growth entries on a single plant
  const maxUserGrowthOnOnePlant = getMaxUserGrowthRecordsPerPlant(
    growthRecords,
    stats.userGrowthRecordIds
  );

  // Evaluate each achievement definition
  for (const def of ACHIEVEMENT_CATALOG) {
    let currentValue = 0;

    switch (def.id) {
      // Category 1: Collection
      case 'col-first-plant':
      case 'col-trio':
      case 'col-sanctuary':
        currentValue = stats.userPlantIds.length;
        break;
      case 'col-diversity':
        currentValue = distinctRoomsCount;
        break;

      // Category 2: Care
      case 'care-first-drop':
        currentValue = stats.totalWaterings;
        break;
      case 'care-hydro-10':
        currentValue = stats.totalWaterings;
        break;
      case 'care-fertilize-5':
        currentValue = stats.totalFertilizings;
        break;
      case 'care-prune-3':
        currentValue = stats.totalPrunings;
        break;
      case 'care-dedication-25':
        currentValue = stats.totalCareActions;
        break;

      // Category 3: Growth
      case 'growth-first-log':
      case 'growth-records-5':
        currentValue = stats.userGrowthRecordIds.length;
        break;
      case 'growth-photo':
        currentValue = stats.growthRecordsWithPhotoCount;
        break;
      case 'growth-biographer':
        currentValue = maxUserGrowthOnOnePlant;
        break;

      // Category 4: Gardening & Consistency
      case 'mast-active-3d':
      case 'mast-active-7d':
        currentValue = stats.activeCareDates.length;
        break;
      case 'mast-vacation':
        currentValue = stats.vacationModeActivations;
        break;

      default:
        currentValue = 0;
    }

    const previouslyUnlocked = Boolean(currentUnlocked[def.id]);
    const meetsCriteria = currentValue >= def.targetValue;
    const isUnlocked = previouslyUnlocked || meetsCriteria;

    // Preserve existing unlock date or assign new timestamp if freshly unlocked
    let unlockedAt: string | undefined = undefined;
    if (previouslyUnlocked) {
      unlockedAt = currentUnlocked[def.id].unlockedAt;
    } else if (meetsCriteria) {
      unlockedAt = nowIso;
      updatedUnlocked[def.id] = {
        id: def.id,
        unlockedAt: nowIso,
      };
    }

    // Progress percentage (0 to 100)
    const progressPercentage = Math.min(100, Math.round((currentValue / def.targetValue) * 100));

    // Cap progress value to targetValue so that progress never exceeds the achievement target (e.g. 1/1 instead of 2/1)
    const cappedProgressValue = Math.min(currentValue, def.targetValue);

    const evaluatedAchievement: AchievementWithProgress = {
      ...def,
      isUnlocked,
      unlockedAt,
      currentValue: cappedProgressValue,
      progressPercentage,
    };

    achievementsWithProgress.push(evaluatedAchievement);

    // If this badge unlocked for the very first time in this evaluation cycle
    if (!previouslyUnlocked && meetsCriteria) {
      newlyUnlocked.push(evaluatedAchievement);
    }
  }

  return {
    achievementsWithProgress,
    newlyUnlocked,
    updatedUnlocked,
  };
}
