export function getTodayString(): string {
  const d = new Date();
  return d.toISOString().split('T')[0];
}

export function isValidDateString(dateStr: unknown): boolean {
  if (typeof dateStr !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return false;
  }
  const date = new Date(dateStr + 'T00:00:00');
  return !isNaN(date.getTime());
}

export function addDays(dateStr: string, days: number): string {
  const safeDays = typeof days === 'number' && !isNaN(days) ? days : 0;
  try {
    let cleanDateStr = dateStr;
    if (!cleanDateStr || typeof cleanDateStr !== 'string') {
      cleanDateStr = getTodayString();
    } else if (cleanDateStr.includes('T')) {
      cleanDateStr = cleanDateStr.split('T')[0];
    }

    const date = new Date(cleanDateStr + 'T00:00:00');
    if (isNaN(date.getTime())) {
      const fallback = new Date();
      fallback.setDate(fallback.getDate() + safeDays);
      return fallback.toISOString().split('T')[0];
    }

    date.setDate(date.getDate() + safeDays);
    return date.toISOString().split('T')[0];
  } catch {
    const fallback = new Date();
    fallback.setDate(fallback.getDate() + safeDays);
    return fallback.toISOString().split('T')[0];
  }
}

export function getDaysDifference(targetDateStr: string, fromDateStr = getTodayString()): number {
  if (!targetDateStr) return 0;
  try {
    const cleanTarget = targetDateStr.includes('T') ? targetDateStr.split('T')[0] : targetDateStr;
    const cleanFrom = (fromDateStr || getTodayString()).includes('T') ? (fromDateStr || '').split('T')[0] : (fromDateStr || getTodayString());

    const target = new Date(cleanTarget + 'T00:00:00');
    const from = new Date(cleanFrom + 'T00:00:00');
    if (isNaN(target.getTime()) || isNaN(from.getTime())) return 0;

    const diffTime = target.getTime() - from.getTime();
    return Math.round(diffTime / (1000 * 60 * 60 * 24));
  } catch {
    return 0;
  }
}

export function formatDueDateLabel(daysDiff: number): { label: string; urgency: 'overdue' | 'today' | 'upcoming' } {
  if (daysDiff < 0) {
    const days = Math.abs(daysDiff);
    return {
      label: days === 1 ? 'Overdue by 1 day' : `Overdue by ${days} days`,
      urgency: 'overdue',
    };
  }
  if (daysDiff === 0) {
    return {
      label: 'Due today',
      urgency: 'today',
    };
  }
  if (daysDiff === 1) {
    return {
      label: 'Due tomorrow',
      urgency: 'upcoming',
    };
  }
  return {
    label: `Due in ${daysDiff} days`,
    urgency: 'upcoming',
  };
}

export function formatDatePretty(dateStr: string): string {
  if (!dateStr || typeof dateStr !== 'string') return '';
  try {
    const cleanStr = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
    const parts = cleanStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      if (isNaN(year) || isNaN(month) || isNaN(day)) return dateStr;
      const d = new Date(year, month, day);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    return dateStr;
  } catch {
    return dateStr || '';
  }
}

export function getNextCareDate(
  plant: {
    lastWatered: string;
    lastFertilized: string;
    lastPruned: string;
    wateringFrequencyDays: number;
    fertilizingFrequencyDays: number;
    pruningFrequencyDays: number;
    snoozedWaterDate?: string;
    snoozedFertilizeDate?: string;
    snoozedPruneDate?: string;
  },
  careType: 'water' | 'fertilize' | 'prune'
): string {
  if (careType === 'water') {
    return plant.snoozedWaterDate || addDays(plant.lastWatered, plant.wateringFrequencyDays);
  }
  if (careType === 'fertilize') {
    return plant.snoozedFertilizeDate || addDays(plant.lastFertilized, plant.fertilizingFrequencyDays);
  }
  return plant.snoozedPruneDate || addDays(plant.lastPruned, plant.pruningFrequencyDays);
}
