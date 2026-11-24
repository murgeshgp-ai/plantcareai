import { GrowthRecord, GrowthStatistics } from '../types/growth';
import { INITIAL_GROWTH_RECORDS } from '../data/sampleGrowthRecords';

export const GROWTH_STORAGE_KEY = 'sproutcare_growth_records_v1';

export function loadAllGrowthRecords(): GrowthRecord[] {
  try {
    const raw = localStorage.getItem(GROWTH_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to load growth records from localStorage', err);
  }
  return INITIAL_GROWTH_RECORDS;
}

export function saveAllGrowthRecords(records: GrowthRecord[]): void {
  try {
    localStorage.setItem(GROWTH_STORAGE_KEY, JSON.stringify(records));
  } catch (err) {
    console.error('Failed to save growth records to localStorage', err);
  }
}

/**
 * Returns growth records for a specific plant sorted chronologically (oldest to newest date).
 */
export function getGrowthRecordsForPlant(allRecords: GrowthRecord[], plantId: string): GrowthRecord[] {
  return allRecords
    .filter((r) => r.plantId === plantId)
    .sort((a, b) => {
      const dateDiff = new Date(a.date).getTime() - new Date(b.date).getTime();
      if (dateDiff !== 0) return dateDiff;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
}

/**
 * Calculates statistics based on chronological records.
 */
export function calculateGrowthStatistics(chronologicalRecords: GrowthRecord[]): GrowthStatistics {
  if (!chronologicalRecords || chronologicalRecords.length === 0) {
    return {
      currentHeight: null,
      previousHeight: null,
      totalHeightIncrease: null,
      currentLeafCount: null,
      totalLeafCountChange: null,
      hasEnoughData: false,
      message: 'No growth records found yet. Record your first measurement to begin tracking.',
    };
  }

  const count = chronologicalRecords.length;
  const current = chronologicalRecords[count - 1];

  if (count === 1) {
    return {
      currentHeight: current.heightCm,
      previousHeight: null,
      totalHeightIncrease: null,
      currentLeafCount: current.leafCount,
      totalLeafCountChange: null,
      hasEnoughData: false,
      message: 'Record at least 2 measurements to view growth trends and historical comparison.',
    };
  }

  const baseline = chronologicalRecords[0];
  const previous = chronologicalRecords[count - 2];
  const heightIncrease = Number((current.heightCm - baseline.heightCm).toFixed(1));
  const leafChange = current.leafCount - baseline.leafCount;

  return {
    currentHeight: current.heightCm,
    previousHeight: previous.heightCm,
    totalHeightIncrease: heightIncrease,
    currentLeafCount: current.leafCount,
    totalLeafCountChange: leafChange,
    hasEnoughData: true,
  };
}
