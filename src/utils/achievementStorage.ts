import { UnlockedAchievement, UserActivityStats } from '../types/achievement';

export const ACHIEVEMENTS_STORAGE_KEY = 'sproutcare_achievements_v1';
export const USER_STATS_STORAGE_KEY = 'sproutcare_user_stats_v1';

/**
 * Returns empty initial user activity stats tracking genuine actions only.
 */
export function getInitialUserStats(): UserActivityStats {
  return {
    totalWaterings: 0,
    totalFertilizings: 0,
    totalPrunings: 0,
    totalCareActions: 0,
    activeCareDates: [],
    userPlantIds: [],
    userGrowthRecordIds: [],
    growthRecordsWithPhotoCount: 0,
    vacationModeActivations: 0,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Loads unlocked achievements from localStorage with defensive error recovery.
 */
export function loadUnlockedAchievements(): Record<string, UnlockedAchievement> {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return {};
  try {
    const raw = localStorage.getItem(ACHIEVEMENTS_STORAGE_KEY);
    if (!raw) return {};

    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      const valid: Record<string, UnlockedAchievement> = {};
      for (const [id, val] of Object.entries(parsed)) {
        if (val && typeof val === 'object' && 'id' in val && 'unlockedAt' in val) {
          valid[id] = {
            id: String((val as UnlockedAchievement).id),
            unlockedAt: String((val as UnlockedAchievement).unlockedAt),
          };
        }
      }
      return valid;
    }
  } catch (err) {
    console.error('Failed to load achievements from localStorage', err);
  }
  return {};
}

/**
 * Persists unlocked achievements to localStorage.
 */
export function saveUnlockedAchievements(achievements: Record<string, UnlockedAchievement>): void {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(ACHIEVEMENTS_STORAGE_KEY, JSON.stringify(achievements));
  } catch (err) {
    console.error('Failed to save achievements to localStorage', err);
  }
}

/**
 * Loads user activity stats from localStorage with defensive error recovery.
 */
export function loadUserActivityStats(): UserActivityStats {
  const initial = getInitialUserStats();
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return initial;
  try {
    const raw = localStorage.getItem(USER_STATS_STORAGE_KEY);
    if (!raw) return initial;

    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return {
        totalWaterings: typeof parsed.totalWaterings === 'number' ? Math.max(0, parsed.totalWaterings) : 0,
        totalFertilizings: typeof parsed.totalFertilizings === 'number' ? Math.max(0, parsed.totalFertilizings) : 0,
        totalPrunings: typeof parsed.totalPrunings === 'number' ? Math.max(0, parsed.totalPrunings) : 0,
        totalCareActions: typeof parsed.totalCareActions === 'number' ? Math.max(0, parsed.totalCareActions) : 0,
        activeCareDates: Array.isArray(parsed.activeCareDates) ? parsed.activeCareDates.filter((d: unknown) => typeof d === 'string') : [],
        userPlantIds: Array.isArray(parsed.userPlantIds) ? parsed.userPlantIds.filter((id: unknown) => typeof id === 'string') : [],
        userGrowthRecordIds: Array.isArray(parsed.userGrowthRecordIds) ? parsed.userGrowthRecordIds.filter((id: unknown) => typeof id === 'string') : [],
        growthRecordsWithPhotoCount: typeof parsed.growthRecordsWithPhotoCount === 'number' ? Math.max(0, parsed.growthRecordsWithPhotoCount) : 0,
        vacationModeActivations: typeof parsed.vacationModeActivations === 'number' ? Math.max(0, parsed.vacationModeActivations) : 0,
        lastUpdated: typeof parsed.lastUpdated === 'string' ? parsed.lastUpdated : new Date().toISOString(),
      };
    }
  } catch (err) {
    console.error('Failed to load user activity stats from localStorage', err);
  }
  return initial;
}

/**
 * Persists user activity stats to localStorage.
 */
export function saveUserActivityStats(stats: UserActivityStats): void {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(USER_STATS_STORAGE_KEY, JSON.stringify(stats));
  } catch (err) {
    console.error('Failed to save user activity stats to localStorage', err);
  }
}
