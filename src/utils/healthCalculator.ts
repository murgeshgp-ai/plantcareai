import { Plant } from '../types/plant';
import { GrowthRecord } from '../types/growth';
import { 
  HealthAssessment, 
  HealthScoreBreakdown, 
  HealthLabel, 
  LeafCondition, 
  PestCondition, 
  SoilCondition, 
  OverallAppearance,
  FactorBreakdown
} from '../types/health';
import { addDays, getDaysDifference, getTodayString } from './dateUtils';
import { getGrowthRecordsForPlant } from './growthStorage';
import { getLatestAssessmentForPlant, getPreviousAssessmentForPlant } from './healthStorage';

export function getHealthLabel(score: number): HealthLabel {
  if (score >= 90) return 'Excellent';
  if (score >= 75) return 'Good';
  if (score >= 50) return 'Fair';
  return 'Needs Attention';
}

export function getHealthBadgeColors(score: number): {
  stroke: string;
  fill: string;
  text: string;
  bgLight: string;
  borderLight: string;
} {
  if (score >= 90) {
    return {
      stroke: '#059669', // emerald-600
      fill: '#ecfdf5',
      text: 'text-emerald-800',
      bgLight: 'bg-emerald-50',
      borderLight: 'border-emerald-200',
    };
  }
  if (score >= 75) {
    return {
      stroke: '#0d9488', // teal-600
      fill: '#f0fdfa',
      text: 'text-teal-800',
      bgLight: 'bg-teal-50',
      borderLight: 'border-teal-200',
    };
  }
  if (score >= 50) {
    return {
      stroke: '#d97706', // amber-600
      fill: '#fffbeb',
      text: 'text-amber-800',
      bgLight: 'bg-amber-50',
      borderLight: 'border-amber-200',
    };
  }
  return {
    stroke: '#e11d48', // rose-600
    fill: '#fff1f2',
    text: 'text-rose-800',
    bgLight: 'bg-rose-50',
    borderLight: 'border-rose-200',
  };
}

/**
 * Calculates condition score (0-100) from manual observation variables.
 */
export function calculateConditionScore(
  leaf: LeafCondition,
  pest: PestCondition,
  soil: SoilCondition,
  overall: OverallAppearance
): number {
  const leafMap: Record<LeafCondition, number> = {
    healthy: 100,
    yellowing: 55,
    'brown-spots': 45,
    wilting: 25,
  };

  const pestMap: Record<PestCondition, number> = {
    'no-pests': 100,
    'possible-pests': 50,
    'visible-pests': 15,
  };

  const soilMap: Record<SoilCondition, number> = {
    normal: 100,
    moist: 80,
    'too-dry': 40,
  };

  const appearanceMap: Record<OverallAppearance, number> = {
    healthy: 100,
    average: 65,
    poor: 25,
  };

  const leafScore = leafMap[leaf] ?? 100;
  const pestScore = pestMap[pest] ?? 100;
  const soilScore = soilMap[soil] ?? 100;
  const appearanceScore = appearanceMap[overall] ?? 100;

  // 4 components equally weighted at 25% each
  return Math.round(leafScore * 0.25 + pestScore * 0.25 + soilScore * 0.25 + appearanceScore * 0.25);
}

/**
 * Calculates Care Routine Consistency score (0-100).
 * CRITICAL: Respects snoozed dates! If a task is snoozed to today or a future date,
 * it is considered fully on schedule and receives 100 points.
 */
export function calculateCareConsistencyScore(plant: Plant, today = getTodayString()): {
  score: number;
  waterStatus: { score: number; label: string; overdueDays: number };
  fertStatus: { score: number; label: string; overdueDays: number };
  pruneStatus: { score: number; label: string; overdueDays: number };
} {
  // 1. Water Routine (60% of care weight)
  const nextWater = plant.snoozedWaterUntil || addDays(plant.lastWatered, plant.wateringFrequencyDays);
  const waterDiff = getDaysDifference(nextWater, today);
  let waterScore = 100;
  let waterLabel = 'Watering on schedule';
  const waterOverdueDays = waterDiff < 0 ? Math.abs(waterDiff) : 0;

  if (waterDiff < 0) {
    if (waterDiff === -1) {
      waterScore = 80;
      waterLabel = 'Watering overdue by 1 day';
    } else if (waterDiff === -2) {
      waterScore = 60;
      waterLabel = 'Watering overdue by 2 days';
    } else if (waterDiff === -3) {
      waterScore = 40;
      waterLabel = 'Watering overdue by 3 days';
    } else {
      waterScore = 20;
      waterLabel = `Watering overdue by ${Math.abs(waterDiff)} days`;
    }
  } else if (plant.snoozedWaterUntil) {
    waterLabel = 'Watering snoozed (on schedule)';
  }

  // 2. Fertilize Routine (25% of care weight)
  const nextFertilize = plant.snoozedFertilizeUntil || addDays(plant.lastFertilized, plant.fertilizingFrequencyDays);
  const fertDiff = getDaysDifference(nextFertilize, today);
  let fertScore = 100;
  let fertLabel = 'Fertilizing on schedule';
  const fertOverdueDays = fertDiff < 0 ? Math.abs(fertDiff) : 0;

  if (fertDiff < 0) {
    const overdue = Math.abs(fertDiff);
    if (overdue <= 3) {
      fertScore = 85;
      fertLabel = `Fertilizing overdue by ${overdue}d`;
    } else if (overdue <= 7) {
      fertScore = 70;
      fertLabel = `Fertilizing overdue by ${overdue}d`;
    } else {
      fertScore = 50;
      fertLabel = `Fertilizing overdue by ${overdue}d`;
    }
  } else if (plant.snoozedFertilizeUntil) {
    fertLabel = 'Fertilizing snoozed (on schedule)';
  }

  // 3. Pruning Routine (15% of care weight)
  const nextPrune = plant.snoozedPruneUntil || addDays(plant.lastPruned, plant.pruningFrequencyDays);
  const pruneDiff = getDaysDifference(nextPrune, today);
  let pruneScore = 100;
  let pruneLabel = 'Pruning on schedule';
  const pruneOverdueDays = pruneDiff < 0 ? Math.abs(pruneDiff) : 0;

  if (pruneDiff < 0) {
    const overdue = Math.abs(pruneDiff);
    if (overdue <= 7) {
      pruneScore = 90;
      pruneLabel = `Pruning overdue by ${overdue}d`;
    } else {
      pruneScore = 70;
      pruneLabel = `Pruning overdue by ${overdue}d`;
    }
  } else if (plant.snoozedPruneUntil) {
    pruneLabel = 'Pruning snoozed (on schedule)';
  }

  const weightedCareScore = Math.round(waterScore * 0.60 + fertScore * 0.25 + pruneScore * 0.15);

  return {
    score: Math.max(10, Math.min(100, weightedCareScore)),
    waterStatus: { score: waterScore, label: waterLabel, overdueDays: waterOverdueDays },
    fertStatus: { score: fertScore, label: fertLabel, overdueDays: fertOverdueDays },
    pruneStatus: { score: pruneScore, label: pruneLabel, overdueDays: pruneOverdueDays },
  };
}

/**
 * Calculates Growth Progress score (0-100) from chronological records.
 * Returns null if no records are recorded yet.
 */
export function calculateGrowthProgressScore(records: GrowthRecord[]): {
  score: number | null;
  detail: string;
} {
  if (!records || records.length === 0) {
    return { score: null, detail: 'No growth measurements logged yet' };
  }

  if (records.length === 1) {
    return { score: 90, detail: 'Initial growth baseline recorded' };
  }

  const baseline = records[0];
  const current = records[records.length - 1];
  const heightGain = current.heightCm - baseline.heightCm;
  const leafGain = current.leafCount - baseline.leafCount;

  let score = 88;

  if (heightGain > 0 && leafGain >= 0) {
    score = 98;
  } else if (heightGain >= 0 && leafGain >= 0) {
    score = 92;
  } else if (leafGain < 0) {
    // Leaf loss
    const lostCount = Math.abs(leafGain);
    if (lostCount <= 1) score = 80;
    else if (lostCount <= 3) score = 70;
    else score = 55;
  } else if (heightGain < 0) {
    score = 75; // Pruned or bent
  }

  return {
    score: Math.max(20, Math.min(100, score)),
    detail: `${heightGain >= 0 ? `+${heightGain.toFixed(1)}cm` : `${heightGain.toFixed(1)}cm`} height, ${leafGain >= 0 ? `+${leafGain}` : leafGain} leaves since baseline`,
  };
}

/**
 * Generates non-generic, realistic recommendations based on recorded observations and routines.
 */
export function generateRecommendations(
  plant: Plant,
  assessment: HealthAssessment | null,
  waterOverdueDays: number,
  fertOverdueDays: number
): string[] {
  const recommendations: string[] = [];

  // Observation-driven recommendations
  if (assessment) {
    // 1. Leaf condition
    if (assessment.leafCondition === 'yellowing') {
      recommendations.push(
        'Yellowing foliage: Allow the top 3–5 cm of soil to dry before watering again. Check for pot drainage blockages or sudden temperature drafts.'
      );
    } else if (assessment.leafCondition === 'brown-spots') {
      recommendations.push(
        'Brown leaf spots or edges: Increase ambient humidity or switch from chlorinated tap water to filtered/rain water to prevent tip burn.'
      );
    } else if (assessment.leafCondition === 'wilting') {
      recommendations.push(
        'Wilting foliage: Test soil moisture deep near roots immediately. If parched, bottom-water thoroughly; if waterlogged, check for root distress.'
      );
    }

    // 2. Pest condition
    if (assessment.pestCondition === 'visible-pests') {
      recommendations.push(
        'Active pests identified: Isolate plant immediately from others. Wipe leaves with diluted insecticidal soap or neem oil spray, focusing on undersides.'
      );
    } else if (assessment.pestCondition === 'possible-pests') {
      recommendations.push(
        'Possible pests: Use a magnifying flashlight to inspect leaf nodes and undersides for fine webbing or sticky residue.'
      );
    }

    // 3. Soil condition
    if (assessment.soilCondition === 'too-dry') {
      recommendations.push(
        'Hydrophobic or severely dry soil: Provide a gentle 20-minute bottom-soak in room-temperature water until topsoil feels evenly damp.'
      );
    } else if (assessment.soilCondition === 'moist' && waterOverdueDays > 0) {
      recommendations.push(
        'Soil remains wet despite watering interval: Verify drainage hole is not clogged and allow extra drying days before adding water.'
      );
    }

    // 4. Overall appearance
    if (assessment.overallAppearance === 'poor') {
      recommendations.push(
        `Review location light: ${plant.name} prefers "${plant.light}". Gently trim dead or heavily damaged stems with clean shears.`
      );
    }
  }

  // Routine-driven recommendations
  if (waterOverdueDays > 0 && (!assessment || assessment.soilCondition !== 'moist')) {
    recommendations.push(
      `Watering is overdue by ${waterOverdueDays} ${waterOverdueDays === 1 ? 'day' : 'days'}. Give a measured soak to maintain cellular turgor.`
    );
  }

  if (fertOverdueDays > 5) {
    recommendations.push(
      'Due for gentle organic fertilizer to replenish essential micronutrients (nitrogen, potassium) for vigorous foliage.'
    );
  }

  // Fallback healthy recommendations if all conditions are pristine
  if (recommendations.length === 0) {
    recommendations.push(
      'Your care routine is right on track! Gently wipe leaves with a damp cloth monthly to clear dust and maximize photosynthesis.'
    );
    recommendations.push(
      `Maintain consistent indirect placement in ${plant.room} and keep observing new growth buds.`
    );
  }

  return recommendations;
}

/**
 * Calculates complete, transparent health breakdown for a plant.
 * Normalizes weights dynamically when observations or growth records are missing.
 */
export function calculatePlantHealthScore(
  plant: Plant,
  allAssessments: HealthAssessment[],
  allGrowthRecords: GrowthRecord[],
  today = getTodayString()
): HealthScoreBreakdown {
  const latestAssessment = getLatestAssessmentForPlant(allAssessments, plant.id);
  const previousAssessment = getPreviousAssessmentForPlant(allAssessments, plant.id);
  const plantGrowthRecords = getGrowthRecordsForPlant(allGrowthRecords, plant.id);

  // 1. Care routine consistency
  const careResult = calculateCareConsistencyScore(plant, today);
  const careScore = careResult.score;

  // 2. Condition assessment score
  const conditionScore = latestAssessment
    ? calculateConditionScore(
        latestAssessment.leafCondition,
        latestAssessment.pestCondition,
        latestAssessment.soilCondition,
        latestAssessment.overallAppearance
      )
    : null;

  // 3. Growth progress score
  const growthResult = calculateGrowthProgressScore(plantGrowthRecords);
  const growthScore = growthResult.score;

  // Dynamic weight re-normalization:
  // Base weights: Care 40%, Assessment 40%, Growth 20%
  let careWeight = 40;
  let conditionWeight = 40;
  let growthWeight = 20;

  if (conditionScore !== null && growthScore !== null) {
    careWeight = 40;
    conditionWeight = 40;
    growthWeight = 20;
  } else if (conditionScore !== null && growthScore === null) {
    // No growth records yet -> 50% care, 50% assessment
    careWeight = 50;
    conditionWeight = 50;
    growthWeight = 0;
  } else if (conditionScore === null && growthScore !== null) {
    // No assessment yet -> 70% care, 30% growth
    careWeight = 70;
    conditionWeight = 0;
    growthWeight = 30;
  } else {
    // Neither yet -> 100% care routine
    careWeight = 100;
    conditionWeight = 0;
    growthWeight = 0;
  }

  // Calculate weighted total score (0 - 100)
  const weightedSum =
    careScore * (careWeight / 100) +
    (conditionScore ?? 0) * (conditionWeight / 100) +
    (growthScore ?? 0) * (growthWeight / 100);

  const totalScore = Math.max(5, Math.min(100, Math.round(weightedSum)));
  const label = getHealthLabel(totalScore);

  // Build factor breakdowns for transparent explanation
  const factors: FactorBreakdown[] = [
    {
      name: 'Care Routine Consistency',
      score: careScore,
      weight: careWeight,
      status: careScore >= 80 ? 'good' : careScore >= 50 ? 'warning' : 'alert',
      detail: `${careResult.waterStatus.label}. ${careResult.fertStatus.label}.`,
    },
  ];

  if (conditionScore !== null) {
    factors.push({
      name: 'Plant Condition Assessment',
      score: conditionScore,
      weight: conditionWeight,
      status: conditionScore >= 80 ? 'good' : conditionScore >= 50 ? 'warning' : 'alert',
      detail: `Leaves: ${latestAssessment!.leafCondition}, Pests: ${latestAssessment!.pestCondition}, Soil: ${latestAssessment!.soilCondition}.`,
    });
  } else {
    factors.push({
      name: 'Plant Condition Assessment',
      score: 0,
      weight: 0,
      status: 'warning',
      detail: 'No physical observation logged yet. Tap "Assess Health" to record leaf, pest, and soil conditions.',
    });
  }

  if (growthScore !== null) {
    factors.push({
      name: 'Growth Progress',
      score: growthScore,
      weight: growthWeight,
      status: growthScore >= 80 ? 'good' : growthScore >= 50 ? 'warning' : 'alert',
      detail: growthResult.detail,
    });
  } else {
    factors.push({
      name: 'Growth Progress',
      score: 0,
      weight: 0,
      status: 'warning',
      detail: 'No height or leaf measurements logged yet.',
    });
  }

  // Explanation string
  const explanation =
    conditionScore !== null && growthScore !== null
      ? `Calculated from Care Consistency (${careWeight}%), Condition Assessment (${conditionWeight}%), and Growth Trends (${growthWeight}%).`
      : conditionScore !== null
      ? `Calculated from Care Consistency (${careWeight}%) and Condition Assessment (${conditionWeight}%). Dynamic re-normalization applied.`
      : growthScore !== null
      ? `Calculated from Care Consistency (${careWeight}%) and Growth Trends (${growthWeight}%). Log a physical assessment for 40% condition weighting.`
      : `Based currently on Care Consistency (100%). Log a manual assessment to factor in physical leaf, pest, and soil conditions.`;

  // Recommendations
  const recommendations = generateRecommendations(
    plant,
    latestAssessment,
    careResult.waterStatus.overdueDays,
    careResult.fertStatus.overdueDays
  );

  // Historical comparison
  const previousScore = previousAssessment?.score ?? null;
  const scoreDelta = previousScore !== null ? totalScore - previousScore : null;

  return {
    totalScore,
    label,
    careConsistencyScore: careScore,
    conditionScore,
    growthScore,
    weights: {
      care: careWeight,
      condition: conditionWeight,
      growth: growthWeight,
    },
    factors,
    explanation,
    recommendations,
    previousScore,
    scoreDelta,
    lastAssessedAt: latestAssessment?.assessedAt ?? null,
    latestAssessment,
  };
}
