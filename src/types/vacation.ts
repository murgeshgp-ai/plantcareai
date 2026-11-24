import { CareType, Plant } from './plant';

export type PlantSurvivalCategory = 'drought-tolerant' | 'moderate' | 'moisture-sensitive';

export interface VacationConfig {
  isActive: boolean;
  departureDate: string; // ISO date string YYYY-MM-DD
  returnDate: string; // ISO date string YYYY-MM-DD
  notes?: string;
  activatedAt?: string;
}

export interface VacationTaskSummary {
  id: string;
  plantId: string;
  plantName: string;
  plantSpecies: string;
  plantRoom: string;
  careType: CareType;
  dueDate: string; // ISO date string YYYY-MM-DD
  daysIntoVacation: number; // Day N of absence
  isSnoozed?: boolean;
  isOverdueBeforeDeparture: boolean;
  isProjected: boolean; // true if it's a recurring cycle projected during longer absence
}

export interface VacationPrepItem {
  plantId: string;
  plantName: string;
  plantSpecies: string;
  plantRoom: string;
  survivalCategory: PlantSurvivalCategory;
  needsWateringBeforeDeparture: boolean;
  needsFertilizingPause: boolean;
  needsPruningBeforeDeparture: boolean;
  prepPriority: 'high' | 'medium' | 'low';
  recommendation: string; // Actionable botanical guidance
  suggestedActionDate: string; // Recommended date for pre-trip prep
}

export interface VacationSummary {
  config: VacationConfig;
  durationDays: number; // Length of trip in days
  daysUntilDeparture: number; // Relative to today (negative if vacation already started)
  tasksDuringAbsence: VacationTaskSummary[];
  totalTasksCount: number;
  wateringTasksCount: number;
  fertilizingTasksCount: number;
  pruningTasksCount: number;
  prepItems: VacationPrepItem[];
  plantsNeedingWaterCount: number;
  droughtTolerantCount: number;
  moistureSensitiveCount: number;
  generalTips: string[];
}
