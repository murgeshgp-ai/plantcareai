import { Plant } from '../types/plant';
import { GrowthRecord } from '../types/growth';
import { HealthAssessment } from '../types/health';
import { PlantContextData, CollectionPlantSummary } from '../types/assistant';
import { addDays, getDaysDifference, formatDueDateLabel } from './dateUtils';
import { calculatePlantHealthScore } from './healthCalculator';
import { getGrowthRecordsForPlant, calculateGrowthStatistics } from './growthStorage';

export function buildSelectedPlantContext(
  plant: Plant,
  allAssessments: HealthAssessment[],
  allGrowthRecords: GrowthRecord[]
): PlantContextData {
  // Care status labels
  const nextWater = plant.snoozedWaterUntil || addDays(plant.lastWatered, plant.wateringFrequencyDays);
  const waterDiff = getDaysDifference(nextWater);
  const waterInfo = formatDueDateLabel(waterDiff);

  const nextFert = plant.snoozedFertilizeUntil || addDays(plant.lastFertilized, plant.fertilizingFrequencyDays);
  const fertDiff = getDaysDifference(nextFert);
  const fertInfo = formatDueDateLabel(fertDiff);

  const nextPrune = plant.snoozedPruneUntil || addDays(plant.lastPruned, plant.pruningFrequencyDays);
  const pruneDiff = getDaysDifference(nextPrune);
  const pruneInfo = formatDueDateLabel(pruneDiff);

  // Health Breakdown
  const healthBreakdown = calculatePlantHealthScore(plant, allAssessments, allGrowthRecords);
  const latestAssessment = healthBreakdown.latestAssessment;

  // Growth Stats
  const plantGrowthRecords = getGrowthRecordsForPlant(allGrowthRecords, plant.id);
  const growthStats = calculateGrowthStatistics(plantGrowthRecords);

  return {
    id: plant.id,
    name: plant.name,
    species: plant.species,
    room: plant.room,
    light: plant.light,
    difficulty: plant.difficulty,
    wateringFrequencyDays: plant.wateringFrequencyDays,
    fertilizingFrequencyDays: plant.fertilizingFrequencyDays,
    pruningFrequencyDays: plant.pruningFrequencyDays,
    lastWatered: plant.lastWatered,
    lastFertilized: plant.lastFertilized,
    lastPruned: plant.lastPruned,
    snoozedWaterUntil: plant.snoozedWaterUntil,
    snoozedFertilizeUntil: plant.snoozedFertilizeUntil,
    snoozedPruneUntil: plant.snoozedPruneUntil,
    health: plant.health,
    notes: plant.notes,
    waterStatusLabel: waterInfo.label,
    fertStatusLabel: fertInfo.label,
    pruneStatusLabel: pruneInfo.label,
    healthScore: healthBreakdown.totalScore,
    healthLabel: healthBreakdown.label,
    leafCondition: latestAssessment?.leafCondition,
    pestCondition: latestAssessment?.pestCondition,
    soilCondition: latestAssessment?.soilCondition,
    overallAppearance: latestAssessment?.overallAppearance,
    assessmentNotes: latestAssessment?.notes,
    lastAssessedAt: healthBreakdown.lastAssessedAt || undefined,
    currentHeight: growthStats.currentHeight,
    heightIncrease: growthStats.totalHeightIncrease,
    currentLeafCount: growthStats.currentLeafCount,
    leafCountChange: growthStats.totalLeafCountChange,
    totalGrowthRecords: plantGrowthRecords.length,
  };
}

export function buildAllPlantsSummary(
  plants: Plant[],
  allAssessments: HealthAssessment[],
  allGrowthRecords: GrowthRecord[]
): CollectionPlantSummary[] {
  return plants.map((plant) => {
    const nextWater = plant.snoozedWaterUntil || addDays(plant.lastWatered, plant.wateringFrequencyDays);
    const waterDiff = getDaysDifference(nextWater);
    const waterInfo = formatDueDateLabel(waterDiff);

    const nextFert = plant.snoozedFertilizeUntil || addDays(plant.lastFertilized, plant.fertilizingFrequencyDays);
    const fertDiff = getDaysDifference(nextFert);
    const fertInfo = formatDueDateLabel(fertDiff);

    const healthBreakdown = calculatePlantHealthScore(plant, allAssessments, allGrowthRecords);
    const plantGrowthRecords = getGrowthRecordsForPlant(allGrowthRecords, plant.id);
    const growthStats = calculateGrowthStatistics(plantGrowthRecords);

    let growthSummary: string | undefined;
    if (growthStats.hasEnoughData) {
      growthSummary = `${growthStats.currentHeight}cm (${growthStats.totalHeightIncrease && growthStats.totalHeightIncrease >= 0 ? `+${growthStats.totalHeightIncrease}cm` : `${growthStats.totalHeightIncrease}cm`}), ${growthStats.currentLeafCount} leaves`;
    } else if (growthStats.currentHeight !== null) {
      growthSummary = `${growthStats.currentHeight}cm, ${growthStats.currentLeafCount} leaves (baseline)`;
    }

    return {
      id: plant.id,
      name: plant.name,
      species: plant.species,
      room: plant.room,
      light: plant.light,
      health: plant.health,
      healthScore: healthBreakdown.totalScore,
      healthLabel: healthBreakdown.label,
      waterStatus: waterInfo.label,
      fertStatus: fertInfo.label,
      growthSummary,
    };
  });
}
