import { PLANT_DATABASE, PlantCatalogItem, PlantCategory } from '../data/plantDatabase';
import {
  CATEGORY_SEASONAL_PROFILES,
  INDIAN_SEASONS,
  KARNATAKA_CLIMATE_ZONES,
  PLANT_SPECIFIC_SEASONAL_OVERRIDES,
} from '../data/indianSeasonalCare';
import { Plant } from '../types/plant';
import {
  IndianSeasonId,
  KarnatakaClimateZoneId,
  PlantSeasonalCareAdvice,
  SeasonalReminderSuggestion,
} from '../types/seasonal';

export const SEASONAL_ZONE_STORAGE_KEY = 'sproutcare_seasonal_zone_v1';

const OUTDOOR_ROOM_KEYWORDS = ['terrace', 'garden', 'courtyard', 'outdoor', 'patio', 'balcony'];

/**
 * Determines the approximate Indian season for a given Date.
 * - Summer: March–May (3, 4, 5)
 * - Monsoon: June–September (6, 7, 8, 9)
 * - Post-Monsoon: October–November (10, 11)
 * - Winter: December–February (12, 1, 2)
 */
export function getCurrentIndianSeason(date: Date = new Date()): IndianSeasonId {
  const month = date.getMonth() + 1; // 1..12
  if (month >= 3 && month <= 5) return 'summer';
  if (month >= 6 && month <= 9) return 'monsoon';
  if (month >= 10 && month <= 11) return 'post-monsoon';
  return 'winter';
}

export function loadSeasonalClimateZone(): KarnatakaClimateZoneId {
  try {
    if (typeof localStorage === 'undefined') return 'general-karnataka';
    const raw = localStorage.getItem(SEASONAL_ZONE_STORAGE_KEY) as KarnatakaClimateZoneId | null;
    if (raw && raw in KARNATAKA_CLIMATE_ZONES) {
      return raw;
    }
  } catch (err) {
    console.error('Failed to load seasonal climate zone preference', err);
  }
  return 'general-karnataka';
}

export function saveSeasonalClimateZone(zone: KarnatakaClimateZoneId): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(SEASONAL_ZONE_STORAGE_KEY, zone);
  } catch (err) {
    console.error('Failed to save seasonal climate zone preference', err);
  }
}

export function isOutdoorPlantLocation(room: string): boolean {
  const lower = (room || '').toLowerCase();
  return OUTDOOR_ROOM_KEYWORDS.some((kw) => lower.includes(kw));
}

/**
 * Matches a user's Plant record against the existing 69-plant catalog
 * without duplicating plant records. Supports English names, Kannada names,
 * aliases, and optional botanical species.
 */
export function matchPlantToCatalog(plant: Plant): PlantCatalogItem | null {
  const nameNorm = (plant.name || '').trim().toLowerCase();
  const speciesNorm = (plant.species || '').trim().toLowerCase();
  const notesNorm = (plant.notes || '').toLowerCase();

  // 1. Exact name or species match first
  for (const item of PLANT_DATABASE) {
    const itemName = item.name.toLowerCase();
    const itemSpecies = (item.species || '').toLowerCase();

    if (nameNorm && nameNorm === itemName) return item;
    if (speciesNorm && itemSpecies && speciesNorm.includes(itemSpecies)) return item;
    if (
      item.commonAliases?.some((alias) => alias.toLowerCase() === nameNorm) ||
      (item.kannadaName && nameNorm.includes(item.kannadaName.toLowerCase())) ||
      (item.kannadaTransliteration &&
        nameNorm.includes(item.kannadaTransliteration.toLowerCase()))
    ) {
      return item;
    }
  }

  // 2. Partial containment across name, aliases, Kannada names, or notes
  for (const item of PLANT_DATABASE) {
    const itemName = item.name.toLowerCase();
    const primaryToken = itemName.split('(')[0].trim();

    if (
      (primaryToken.length >= 4 && nameNorm.includes(primaryToken)) ||
      (nameNorm.length >= 4 && itemName.includes(nameNorm)) ||
      item.commonAliases?.some(
        (alias) => alias.length >= 4 && nameNorm.includes(alias.toLowerCase())
      ) ||
      (item.kannadaName && notesNorm.includes(item.kannadaName.toLowerCase()))
    ) {
      return item;
    }
  }

  return null;
}

/**
 * Infers a PlantCategory when a user manually adds a custom plant not in the catalog.
 */
function inferCategoryForCustomPlant(plant: Plant): PlantCategory {
  const text = `${plant.name} ${plant.species || ''} ${plant.notes || ''}`.toLowerCase();

  if (
    /(tulsi|tulasi|neem|bevu|mint|pudina|brahmi|ondelaga|ginger|shunti|turmeric|arishina|aloe|lolesara|doddapatre|ashwagandha|lemongrass|herb|medicinal)/.test(
      text
    )
  ) {
    return 'Medicinal & Traditional';
  }
  if (
    /(mango|guava|lemon|lime|nimbe|pomegranate|papaya|banana|sapota|chikoo|custard apple|fruit|orange|fig tree)/.test(
      text
    )
  ) {
    return 'Fruit';
  }
  if (
    /(tomato|chilli|chili|brinjal|eggplant|okra|bhindi|coriander|palak|spinach|curry leaf|karibevu|drumstick|moringa|vegetable)/.test(
      text
    )
  ) {
    return 'Vegetable';
  }
  if (
    /(hibiscus|dasavala|jasmine|mallige|rose|gulabi|marigold|chrysanthemum|bougainvillea|crossandra|kanakambara|periwinkle|champaca|parijata|tulip|orchid|flower|bloom)/.test(
      text
    )
  ) {
    return 'Flowering';
  }
  return 'Indoor';
}

function isSucculentOrDroughtTolerant(plant: Plant, catalogItem: PlantCatalogItem | null): boolean {
  const text = `${plant.name} ${plant.species || ''}`.toLowerCase();
  return (
    plant.illustrationType === 'succulent' ||
    plant.illustrationType === 'snake' ||
    plant.wateringFrequencyDays >= 12 ||
    catalogItem?.id === 'aloe-vera' ||
    catalogItem?.id === 'snake-plant' ||
    catalogItem?.id === 'jade-plant' ||
    catalogItem?.id === 'zz-plant' ||
    catalogItem?.id === 'string-of-pearls' ||
    /(succulent|cactus|jade|snake|aloe|zz plant|sansevieria|zamioculcas)/.test(text)
  );
}

/**
 * Appends honest regional Karnataka nuance when the user selects a specific sub-region.
 */
function applyRegionalNuance(
  baseText: string,
  field: 'watering' | 'heatAndRainProtection' | 'pestAndDisease',
  season: IndianSeasonId,
  zone: KarnatakaClimateZoneId,
  isOutdoor: boolean
): string {
  if (zone === 'general-karnataka') return baseText;

  if (zone === 'coastal-malnad' && season === 'monsoon') {
    if (field === 'heatAndRainProtection' && isOutdoor) {
      return `${baseText} In Coastal & Malnad Karnataka, sustained heavy downpours require roofed eaves or raised pot stands.`;
    }
    if (field === 'pestAndDisease') {
      return `${baseText} High Coastal/Malnad humidity also elevates slug and fungal spot pressure—check undersides after rain breaks.`;
    }
  }

  if (zone === 'north-interior' && season === 'summer') {
    if (field === 'heatAndRainProtection' && isOutdoor) {
      return `${baseText} In North Interior Karnataka's 38–42°C afternoons, 50% green shade net and thick mulch make a big difference.`;
    }
    if (field === 'watering' && isOutdoor) {
      return `${baseText} Check outdoor pot moisture again by late evening during peak North Interior heatwaves.`;
    }
  }

  if (zone === 'bengaluru-south-interior' && season === 'winter' && field === 'watering') {
    return `${baseText} Cool Bengaluru & South Interior mornings slow soil drying—stick strictly to mid-morning watering.`;
  }

  return baseText;
}

/**
 * Generates personalized seasonal care recommendations for a single plant.
 * Never mutates the plant or overwrites its reminders/schedules.
 */
export function getPlantSeasonalCare(
  plant: Plant,
  season: IndianSeasonId,
  climateZone: KarnatakaClimateZoneId = 'general-karnataka'
): PlantSeasonalCareAdvice {
  const catalogMatch = matchPlantToCatalog(plant);
  const category: PlantCategory = catalogMatch?.category || inferCategoryForCustomPlant(plant);
  const isOutdoor = isOutdoorPlantLocation(plant.room);
  const droughtTolerant = isSucculentOrDroughtTolerant(plant, catalogMatch);

  const baseProfile = CATEGORY_SEASONAL_PROFILES[category][season];
  const override = catalogMatch ? PLANT_SPECIFIC_SEASONAL_OVERRIDES[catalogMatch.id] : undefined;
  const seasonOverride = override?.seasons[season];

  // Merge base category guidance + plant-specific override
  let watering = seasonOverride?.watering || baseProfile.watering;
  let sunlight = seasonOverride?.sunlight || baseProfile.sunlight;
  let soilMoisture = seasonOverride?.soilMoisture || baseProfile.soilMoisture;
  const fertilizer = seasonOverride?.fertilizer || baseProfile.fertilizer;
  const pruning = seasonOverride?.pruning || baseProfile.pruning;
  let pestAndDisease = seasonOverride?.pestAndDisease || baseProfile.pestAndDisease;
  let heatAndRainProtection =
    seasonOverride?.heatAndRainProtection || baseProfile.heatAndRainProtection;

  // Customize for drought-tolerant plants that don't have a dedicated override (e.g., Jade, ZZ, String of Pearls)
  if (droughtTolerant && !seasonOverride) {
    if (season === 'monsoon') {
      watering = `Water very sparingly (roughly every ${Math.max(
        plant.wateringFrequencyDays + 5,
        14
      )}–21 days) only after soil dries completely to the bottom.`;
      soilMoisture =
        'Must remain fast-draining and dry between waterings; humid monsoon air can rot fleshy roots quickly.';
      heatAndRainProtection =
        'Keep completely sheltered from monsoon rainfall and avoid misting leaves.';
    } else if (season === 'winter') {
      watering = `Reduce watering to every ${Math.max(
        plant.wateringFrequencyDays + 4,
        14
      )}–21 days in the morning only when soil is bone-dry.`;
    }
  } else if (!seasonOverride) {
    // Anchor watering guidance gently to the user's existing schedule without modifying it
    if (season === 'summer' && isOutdoor && plant.wateringFrequencyDays <= 3) {
      watering = `${watering} (Your current schedule is every ${plant.wateringFrequencyDays}d—verify top inch of soil each morning on warm days.)`;
    } else if (season === 'monsoon') {
      watering = `${watering} (Your base schedule is every ${plant.wateringFrequencyDays}d—skip a cycle if soil is still damp.)`;
    }
  }

  // Contextual room adaptation for outdoor vs indoor sun/rain
  if (isOutdoor && category === 'Indoor' && season === 'summer' && !seasonOverride?.sunlight) {
    sunlight = `Placed in ${plant.room}—shift into bright shaded cover during 11 AM–4 PM so direct summer glare does not scorch foliage.`;
  }

  // Apply optional Karnataka sub-region nuance
  watering = applyRegionalNuance(watering, 'watering', season, climateZone, isOutdoor);
  pestAndDisease = applyRegionalNuance(
    pestAndDisease,
    'pestAndDisease',
    season,
    climateZone,
    isOutdoor
  );
  heatAndRainProtection = applyRegionalNuance(
    heatAndRainProtection,
    'heatAndRainProtection',
    season,
    climateZone,
    isOutdoor
  );

  // Determine attention level & reason for this plant this season
  let attentionLevel: 'high' | 'moderate' | 'low' =
    override?.attentionBySeason?.[season] || 'low';
  let attentionReason = override?.attentionReasonBySeason?.[season] || '';

  if (!override?.attentionBySeason?.[season]) {
    if (season === 'summer') {
      if (isOutdoor && (category === 'Flowering' || category === 'Vegetable' || category === 'Fruit')) {
        attentionLevel = 'high';
        attentionReason = `Sun-exposed ${category.toLowerCase()} plant in ${plant.room} dries quickly in summer heat—watch moisture and midday shade.`;
      } else if (plant.wateringFrequencyDays <= 4 || plant.difficulty === 'Demanding') {
        attentionLevel = 'high';
        attentionReason = 'Frequent-watering plant sensitive to dry summer heat; check soil moisture and humidity often.';
      } else {
        attentionLevel = 'low';
        attentionReason = 'Handles warm weather smoothly with indirect light and regular soil checks.';
      }
    } else if (season === 'monsoon') {
      if (droughtTolerant) {
        attentionLevel = 'high';
        attentionReason = 'Drought-tolerant/succulent roots rot quickly in humid or rain-soaked monsoon soil.';
      } else if (isOutdoor && (category === 'Vegetable' || category === 'Medicinal & Traditional')) {
        attentionLevel = 'high';
        attentionReason = `Keep ${plant.room} pot drainage clear and shelter from heavy downpours to prevent root rot and leaf spots.`;
      } else if (plant.difficulty === 'Demanding' || category === 'Flowering') {
        attentionLevel = 'moderate';
        attentionReason = 'Monitor drainage, airflow, and preventive neem care during damp monsoon spells.';
      } else {
        attentionLevel = 'low';
        attentionReason = 'Enjoys monsoon humidity—just confirm top 2 inches of soil dry before watering.';
      }
    } else if (season === 'post-monsoon') {
      if (category === 'Flowering' || category === 'Vegetable' || category === 'Fruit') {
        attentionLevel = 'moderate';
        attentionReason = 'Prime post-monsoon feeding and light pruning window to trigger healthy autumn–winter blooms or harvest.';
      } else {
        attentionLevel = 'low';
        attentionReason = 'Mild, bright weather—great time for light compost top-dressing and leaf cleaning.';
      }
    } else {
      // winter
      if (plant.difficulty === 'Demanding' || (isOutdoor && category === 'Medicinal & Traditional')) {
        attentionLevel = 'moderate';
        attentionReason = 'Cool nights slow root uptake—water mid-morning only and maximize gentle morning sun.';
      } else if (droughtTolerant) {
        attentionLevel = 'moderate';
        attentionReason = 'Dormant in cool weather—avoid overwatering cold soil.';
      } else {
        attentionLevel = 'low';
        attentionReason = 'Comfortable winter pace; reduce watering slightly and keep away from cold night drafts.';
      }
    }
  }

  // Build concise 3-item plant-specific checklist
  const quickChecklist: string[] = [
    season === 'summer'
      ? `Check top 1 inch of soil early morning before watering`
      : season === 'monsoon'
      ? `Verify pot drainage holes and empty saucer trays after rain`
      : season === 'post-monsoon'
      ? `Top-dress pot with fresh vermicompost and inspect new shoots`
      : `Water mid-morning only and maximize gentle winter sunlight`,
    season === 'monsoon'
      ? `Inspect leaves for fungal spots or snails; apply preventive neem spray on a dry morning`
      : season === 'summer'
      ? `Check undersides of leaves for spider mites or mealybugs and add surface mulch if outdoor`
      : season === 'post-monsoon'
      ? `Lightly prune leggy monsoon stems to encourage bushy growth`
      : `Hold back heavy fertilizer until late February unless actively blooming`,
    isOutdoor
      ? season === 'summer'
        ? `Shield from harsh 1–4 PM afternoon sun if foliage wilts`
        : season === 'monsoon'
        ? `Move or shelter during continuous heavy downpours`
        : `Enjoy ${INDIAN_SEASONS[season].name.toLowerCase()} daylight in ${plant.room}`
      : `Keep away from ${season === 'summer' ? 'direct AC airflow and hot window glass' : season === 'winter' ? 'chilly open-window night drafts' : 'standing tray moisture'}`,
  ];

  return {
    plantId: plant.id,
    plantName: plant.name,
    kannadaName: catalogMatch?.kannadaName,
    category,
    isOutdoorLocation: isOutdoor,
    season,
    climateZone,
    attentionLevel,
    attentionReason,
    watering,
    sunlight,
    soilMoisture,
    fertilizer,
    pruning,
    pestAndDisease,
    heatAndRainProtection,
    quickChecklist,
  };
}

/**
 * Returns plants from the user's collection requiring special seasonal attention,
 * ordered with 'high' priority first, then 'moderate'.
 */
export function getPlantsRequiringSeasonalAttention(
  plants: Plant[],
  season: IndianSeasonId,
  climateZone: KarnatakaClimateZoneId = 'general-karnataka'
): { plant: Plant; advice: PlantSeasonalCareAdvice }[] {
  const rank = { high: 0, moderate: 1, low: 2 };

  return plants
    .map((plant) => ({
      plant,
      advice: getPlantSeasonalCare(plant, season, climateZone),
    }))
    .filter(({ advice }) => advice.attentionLevel === 'high' || advice.attentionLevel === 'moderate')
    .sort((a, b) => rank[a.advice.attentionLevel] - rank[b.advice.attentionLevel]);
}

/**
 * Generates non-destructive seasonal advisory suggestions for the Reminders view.
 * Does NOT overwrite existing schedules or duplicate watering/fertilizing/pruning reminders.
 */
export function getSeasonalReminderSuggestions(
  plants: Plant[],
  season: IndianSeasonId,
  climateZone: KarnatakaClimateZoneId = 'general-karnataka',
  limit = 4
): SeasonalReminderSuggestion[] {
  const attentionList = getPlantsRequiringSeasonalAttention(plants, season, climateZone);
  const suggestions: SeasonalReminderSuggestion[] = [];

  for (const { plant, advice } of attentionList) {
    if (suggestions.length >= limit) break;

    let careFocus: SeasonalReminderSuggestion['careFocus'] = 'protection';
    let title = '';
    let suggestion = '';

    if (season === 'summer') {
      if (advice.category === 'Flowering' || advice.category === 'Vegetable' || advice.category === 'Fruit') {
        careFocus = 'watering';
        title = `Summer Moisture & Pest Check`;
        suggestion = `${advice.watering} ${advice.pestAndDisease}`;
      } else {
        careFocus = 'protection';
        title = `Summer Heat & Humidity Care`;
        suggestion = advice.heatAndRainProtection;
      }
    } else if (season === 'monsoon') {
      careFocus = 'protection';
      title = `Monsoon Drainage & Rot Prevention`;
      suggestion = `${advice.soilMoisture} ${advice.heatAndRainProtection}`;
    } else if (season === 'post-monsoon') {
      careFocus = 'fertilizer';
      title = `Post-Monsoon Soil Refresh & Pruning`;
      suggestion = `${advice.fertilizer} ${advice.pruning}`;
    } else {
      careFocus = 'watering';
      title = `Winter Morning Care Adjustment`;
      suggestion = `${advice.watering} ${advice.heatAndRainProtection}`;
    }

    suggestions.push({
      id: `seasonal-${season}-${plant.id}`,
      plantId: plant.id,
      plantName: plant.name,
      plantRoom: plant.room,
      season,
      careFocus,
      title,
      suggestion,
      priority: advice.attentionLevel === 'high' ? 'high' : 'medium',
    });
  }

  return suggestions;
}
