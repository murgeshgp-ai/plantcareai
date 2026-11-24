export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  plantId?: string;
  plantName?: string;
  isError?: boolean;
}

export interface PlantContextData {
  id: string;
  name: string;
  species: string;
  room: string;
  light: string;
  difficulty: string;
  wateringFrequencyDays: number;
  fertilizingFrequencyDays: number;
  pruningFrequencyDays: number;
  lastWatered: string;
  lastFertilized: string;
  lastPruned: string;
  snoozedWaterUntil?: string;
  snoozedFertilizeUntil?: string;
  snoozedPruneUntil?: string;
  health: string;
  notes?: string;
  // Computed care status
  waterStatusLabel: string;
  fertStatusLabel: string;
  pruneStatusLabel: string;
  // Health assessment
  healthScore?: number;
  healthLabel?: string;
  leafCondition?: string;
  pestCondition?: string;
  soilCondition?: string;
  overallAppearance?: string;
  assessmentNotes?: string;
  lastAssessedAt?: string;
  // Growth tracker
  currentHeight?: number | null;
  heightIncrease?: number | null;
  currentLeafCount?: number | null;
  leafCountChange?: number | null;
  totalGrowthRecords?: number;
}

export interface CollectionPlantSummary {
  id: string;
  name: string;
  species: string;
  room: string;
  light: string;
  health: string;
  healthScore?: number;
  healthLabel?: string;
  waterStatus: string;
  fertStatus: string;
  growthSummary?: string;
}

export interface AssistantChatRequest {
  messages: {
    role: 'user' | 'assistant';
    content: string;
  }[];
  selectedPlantId?: string;
  selectedPlantContext?: PlantContextData | null;
  allPlantsContext?: CollectionPlantSummary[];
}

export interface AssistantChatResponse {
  success: boolean;
  reply: string;
  error?: string;
}
