import { HealthAssessment } from '../types/health';

export const HEALTH_STORAGE_KEY = 'sproutcare_health_assessments_v1';

export function loadAllHealthAssessments(): HealthAssessment[] {
  try {
    const raw = localStorage.getItem(HEALTH_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to load health assessments from localStorage', err);
  }
  return [];
}

export function saveAllHealthAssessments(assessments: HealthAssessment[]): void {
  try {
    localStorage.setItem(HEALTH_STORAGE_KEY, JSON.stringify(assessments));
  } catch (err) {
    console.error('Failed to save health assessments to localStorage', err);
  }
}

/**
 * Returns all assessments for a specific plant, ordered newest to oldest by assessedAt date.
 */
export function getAssessmentsForPlant(all: HealthAssessment[], plantId: string): HealthAssessment[] {
  return all
    .filter((a) => a.plantId === plantId)
    .sort((a, b) => {
      const dateDiff = new Date(b.assessedAt).getTime() - new Date(a.assessedAt).getTime();
      if (dateDiff !== 0) return dateDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
}

/**
 * Gets the most recent assessment for a specific plant.
 */
export function getLatestAssessmentForPlant(all: HealthAssessment[], plantId: string): HealthAssessment | null {
  const sorted = getAssessmentsForPlant(all, plantId);
  return sorted.length > 0 ? sorted[0] : null;
}

/**
 * Gets the second most recent assessment for a specific plant (to compare score evolution).
 */
export function getPreviousAssessmentForPlant(all: HealthAssessment[], plantId: string): HealthAssessment | null {
  const sorted = getAssessmentsForPlant(all, plantId);
  return sorted.length > 1 ? sorted[1] : null;
}
