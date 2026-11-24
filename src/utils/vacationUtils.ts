import { Plant, CareType } from '../types/plant';
import { 
  VacationConfig, 
  VacationSummary, 
  VacationTaskSummary, 
  VacationPrepItem, 
  PlantSurvivalCategory 
} from '../types/vacation';
import { addDays, getDaysDifference, getTodayString, formatDatePretty } from './dateUtils';

/**
 * Calculates the total number of days of the vacation period.
 * Returns 0 if dates are invalid or returnDate is before departureDate.
 */
export function calculateVacationDuration(departureDate: string, returnDate: string): number {
  if (!departureDate || !returnDate || typeof departureDate !== 'string' || typeof returnDate !== 'string') return 0;
  if (departureDate > returnDate) return 0;
  const diff = getDaysDifference(returnDate, departureDate);
  return Math.max(0, diff);
}

/**
 * Determines whether Vacation Mode is currently active and within valid dates.
 * Automatically marks as inactive if the current date is past the return date.
 */
export function isVacationActive(
  config: VacationConfig | null | undefined,
  todayStr = getTodayString()
): boolean {
  if (!config || !config.isActive) return false;
  if (!config.departureDate || !config.returnDate) return false;

  // Auto-expire once today is strictly past the return date
  if (todayStr > config.returnDate) {
    return false;
  }

  return true;
}

/**
 * Checks whether Vacation Mode has expired based on the return date.
 */
export function isVacationExpired(
  config: VacationConfig | null | undefined,
  todayStr = getTodayString()
): boolean {
  if (!config || !config.isActive) return false;
  if (!config.returnDate) return false;
  return todayStr > config.returnDate;
}

/**
 * Categorizes a plant into a survival vulnerability bracket based on its
 * botanical species, care intervals, and moisture characteristics.
 */
export function categorizePlantSurvival(plant: Plant): PlantSurvivalCategory {
  if (!plant) return 'moderate';

  const species = (plant.species || '').toLowerCase();
  const name = (plant.name || '').toLowerCase();
  const archetype = plant.illustrationType || 'generic';
  const waterInterval = typeof plant.wateringFrequencyDays === 'number' && !isNaN(plant.wateringFrequencyDays)
    ? plant.wateringFrequencyDays
    : 7;

  // 1. Drought-Tolerant: thick leaves, succulent tissue, or long watering intervals (14+ days)
  if (
    archetype === 'snake' ||
    archetype === 'succulent' ||
    species.includes('sansevieria') ||
    species.includes('succulent') ||
    species.includes('aloe') ||
    species.includes('cactus') ||
    species.includes('zamioculcas') ||
    name.includes('snake') ||
    name.includes('zz') ||
    waterInterval >= 14
  ) {
    return 'drought-tolerant';
  }

  // 2. Moisture-Sensitive: delicate foliage, high transpiration, or short watering intervals (<= 5 days)
  if (
    archetype === 'calathea' ||
    archetype === 'peacelily' ||
    species.includes('calathea') ||
    species.includes('goeppertia') ||
    species.includes('spathiphyllum') ||
    species.includes('maranta') ||
    species.includes('fern') ||
    species.includes('fittonia') ||
    name.includes('calathea') ||
    name.includes('peace lily') ||
    waterInterval <= 5
  ) {
    return 'moisture-sensitive';
  }

  // 3. Moderate: average indoor plants (Monstera, Pothos, Ficus, Philodendron)
  return 'moderate';
}

/**
 * Identifies all scheduled care events (watering, fertilizing, pruning) that
 * will fall due during the user's absence window (departureDate to returnDate).
 */
export function identifyTasksDuringAbsence(
  plants: Plant[],
  departureDate: string,
  returnDate: string
): VacationTaskSummary[] {
  if (!plants || !Array.isArray(plants) || plants.length === 0 || !departureDate || !returnDate) {
    return [];
  }
  if (departureDate > returnDate) {
    return [];
  }

  const tasks: VacationTaskSummary[] = [];

  plants.forEach((plant) => {
    if (!plant) return;

    const waterInterval = Number(plant.wateringFrequencyDays) || 7;
    const fertilizeInterval = Number(plant.fertilizingFrequencyDays) || 21;
    const pruneInterval = Number(plant.pruningFrequencyDays) || 60;
    const baseWater = plant.lastWatered || getTodayString();

    const routines: {
      careType: CareType;
      interval: number;
      lastDate: string;
      snoozeDate?: string;
    }[] = [
      {
        careType: 'water',
        interval: waterInterval,
        lastDate: baseWater,
        snoozeDate: plant.snoozedWaterUntil,
      },
      {
        careType: 'fertilize',
        interval: fertilizeInterval,
        lastDate: plant.lastFertilized || baseWater,
        snoozeDate: plant.snoozedFertilizeUntil,
      },
      {
        careType: 'prune',
        interval: pruneInterval,
        lastDate: plant.lastPruned || baseWater,
        snoozeDate: plant.snoozedPruneUntil,
      },
    ];

    routines.forEach(({ careType, interval, lastDate, snoozeDate }) => {
      if (interval <= 0 || isNaN(interval)) return;

      // 1. Calculate active immediate due date respecting snooze
      const immediateDue = snoozeDate || addDays(lastDate, interval);

      // Check if immediate due date falls within the vacation window
      const isDuringVacation = immediateDue >= departureDate && immediateDue <= returnDate;

      if (isDuringVacation) {
        tasks.push({
          id: `${plant.id}-${careType}-${immediateDue}`,
          plantId: plant.id,
          plantName: plant.name || 'Plant',
          plantSpecies: plant.species || '',
          plantRoom: plant.room || 'Indoor',
          careType,
          dueDate: immediateDue,
          daysIntoVacation: Math.max(1, getDaysDifference(immediateDue, departureDate) + 1),
          isSnoozed: Boolean(snoozeDate),
          isOverdueBeforeDeparture: false,
          isProjected: false,
        });
      }

      // 2. For longer trips, project subsequent recurring cycles within the absence window
      // Safety cap and strict forward progression check prevent any infinite loop
      let nextCycleDate = addDays(immediateDue, interval);
      let cycleCount = 0;
      while (nextCycleDate <= returnDate && cycleCount < 60) {
        cycleCount++;
        if (nextCycleDate >= departureDate && nextCycleDate !== immediateDue) {
          tasks.push({
            id: `${plant.id}-${careType}-${nextCycleDate}-projected`,
            plantId: plant.id,
            plantName: plant.name || 'Plant',
            plantSpecies: plant.species || '',
            plantRoom: plant.room || 'Indoor',
            careType,
            dueDate: nextCycleDate,
            daysIntoVacation: Math.max(1, getDaysDifference(nextCycleDate, departureDate) + 1),
            isSnoozed: false,
            isOverdueBeforeDeparture: false,
            isProjected: true,
          });
        }
        const advancedDate = addDays(nextCycleDate, interval);
        if (advancedDate <= nextCycleDate) {
          break; // Avoid infinite loop if date fails to advance
        }
        nextCycleDate = advancedDate;
      }
    });
  });

  // Sort tasks chronologically
  tasks.sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''));

  return tasks;
}

/**
 * Generates plant-specific pre-departure care recommendations.
 * Flags plants requiring thorough hydration, positioning adjustments, or prep.
 */
export function generatePreDepartureChecklist(
  plants: Plant[],
  departureDate: string,
  returnDate: string
): VacationPrepItem[] {
  if (!plants || !Array.isArray(plants) || plants.length === 0 || !departureDate || !returnDate) {
    return [];
  }
  if (departureDate > returnDate) {
    return [];
  }

  const duration = calculateVacationDuration(departureDate, returnDate);
  const checklist: VacationPrepItem[] = [];

  plants.forEach((plant) => {
    if (!plant) return;
    const survivalCategory = categorizePlantSurvival(plant);
    const waterInterval = Number(plant.wateringFrequencyDays) || 7;
    const lastWater = plant.lastWatered || getTodayString();
    const nextWater = plant.snoozedWaterUntil || addDays(lastWater, waterInterval);
    const daysUntilNextWater = getDaysDifference(nextWater, departureDate);

    // Determines if plant should be watered before departure:
    // 1. Water due on or before departure
    // 2. Water due during the absence window
    // 3. Moisture-sensitive plant where trip is >= 4 days
    const needsWatering =
      daysUntilNextWater <= 0 ||
      (nextWater >= departureDate && nextWater <= returnDate) ||
      (survivalCategory === 'moisture-sensitive' && duration >= 4);

    let priority: 'high' | 'medium' | 'low' = 'low';
    let recommendation = '';
    const suggestedActionDate = departureDate; // Default to departure day

    if (survivalCategory === 'moisture-sensitive') {
      if (duration <= 4) {
        priority = 'medium';
        recommendation = `Water thoroughly the morning of departure. Group near other plants in ${plant.room || 'the room'} to create a humid microclimate.`;
      } else if (duration <= 8) {
        priority = 'high';
        recommendation = `Water thoroughly right before leaving. Place a pebble humidity tray with water beneath the pot (ensuring pot base is elevated above water level).`;
      } else {
        priority = 'high';
        recommendation = `High moisture demand for a ${duration}-day trip. Water thoroughly before departure and set up a DIY cotton-rope wick reservoir or self-watering glass globe.`;
      }
    } else if (survivalCategory === 'drought-tolerant') {
      if (duration <= 14) {
        priority = 'low';
        recommendation = `Thrives on neglect. Only water if the soil is currently bone-dry to the touch. Do not overwater before departure.`;
      } else {
        priority = 'medium';
        recommendation = `Give a normal watering 1 day before departure. Keep in normal ambient lighting away from direct heat registers.`;
      }
    } else {
      // Moderate plants (Monstera, Pothos, Ficus)
      if (needsWatering) {
        priority = duration > 7 ? 'high' : 'medium';
        recommendation = `Give a thorough, deep watering 1 day prior to departure, allowing excess water to drain out completely. Move 2–3 feet away from harsh sunlit glass.`;
      } else {
        priority = 'low';
        recommendation = `Hydration levels should sustain the plant. Check topsoil moisture 1 day before departure and top up lightly if surface feels dry.`;
      }
    }

    const pruneInterval = Number(plant.pruningFrequencyDays) || 60;
    const lastPruned = plant.lastPruned || lastWater;
    const nextPruneDue = plant.snoozedPruneUntil || addDays(lastPruned, pruneInterval);
    const needsPruning = Boolean(nextPruneDue <= returnDate);

    checklist.push({
      plantId: plant.id,
      plantName: plant.name || 'Plant',
      plantSpecies: plant.species || '',
      plantRoom: plant.room || 'Indoor',
      survivalCategory,
      needsWateringBeforeDeparture: needsWatering,
      needsFertilizingPause: true, // Golden horticultural rule: never fertilize unattended plants
      needsPruningBeforeDeparture: needsPruning,
      prepPriority: priority,
      recommendation,
      suggestedActionDate,
    });
  });

  // Sort prep items: High priority first, then medium, then low
  const priorityWeight = { high: 0, medium: 1, low: 2 };
  checklist.sort((a, b) => priorityWeight[a.prepPriority] - priorityWeight[b.prepPriority]);

  return checklist;
}

/**
 * Builds the comprehensive VacationSummary object.
 */
export function calculateVacationSummary(
  plants: Plant[],
  config: VacationConfig | null | undefined,
  todayStr = getTodayString()
): VacationSummary {
  const safeConfig = config || { isActive: false, departureDate: '', returnDate: '' };
  const departureDate = safeConfig.departureDate || todayStr;
  const returnDate = safeConfig.returnDate || addDays(departureDate, 7);

  const durationDays = calculateVacationDuration(departureDate, returnDate);
  const daysUntilDeparture = getDaysDifference(departureDate, todayStr);

  const safePlants = Array.isArray(plants) ? plants : [];
  const tasksDuringAbsence = identifyTasksDuringAbsence(safePlants, departureDate, returnDate);
  const prepItems = generatePreDepartureChecklist(safePlants, departureDate, returnDate);

  const wateringTasksCount = tasksDuringAbsence.filter((t) => t.careType === 'water').length;
  const fertilizingTasksCount = tasksDuringAbsence.filter((t) => t.careType === 'fertilize').length;
  const pruningTasksCount = tasksDuringAbsence.filter((t) => t.careType === 'prune').length;

  const plantsNeedingWaterCount = prepItems.filter((p) => p.needsWateringBeforeDeparture).length;
  const droughtTolerantCount = prepItems.filter((p) => p.survivalCategory === 'drought-tolerant').length;
  const moistureSensitiveCount = prepItems.filter((p) => p.survivalCategory === 'moisture-sensitive').length;

  // General actionable guidelines tailored to trip length
  const generalTips: string[] = [
    'Pull back plants 2–3 feet from hot window glass to reduce heat stress and water transpiration.',
    'Group humidity-loving plants close together to form a collective moisture microclimate.',
    'Pause all fertilizing until you return—fertilizer forces new growth that requires attentive daily watering.',
    'Inspect for pests before leaving; isolate any plants exhibiting yellowing or blemish signs.',
  ];

  if (durationDays > 7) {
    generalTips.unshift('For trips exceeding a week, consider wick-watering cords or terracotta spikes for high-demand foliage.');
  }

  return {
    config: {
      ...safeConfig,
      departureDate,
      returnDate,
    },
    durationDays,
    daysUntilDeparture,
    tasksDuringAbsence,
    totalTasksCount: tasksDuringAbsence.length,
    wateringTasksCount,
    fertilizingTasksCount,
    pruningTasksCount,
    prepItems,
    plantsNeedingWaterCount,
    droughtTolerantCount,
    moistureSensitiveCount,
    generalTips,
  };
}
