export type CareType = 'water' | 'fertilize' | 'prune';

export type LightRequirement = 
  | 'Low light' 
  | 'Medium indirect' 
  | 'Bright indirect' 
  | 'Direct sunlight';

export interface Plant {
  id: string;
  name: string;
  species: string;
  room: string;
  light: LightRequirement;
  imageUrl?: string;
  illustrationType: 'monstera' | 'fig' | 'snake' | 'peacelily' | 'pothos' | 'calathea' | 'succulent' | 'generic';
  wateringFrequencyDays: number;
  fertilizingFrequencyDays: number;
  pruningFrequencyDays: number;
  lastWatered: string; // ISO date string YYYY-MM-DD
  lastFertilized: string;
  lastPruned: string;
  snoozedWaterUntil?: string;
  snoozedFertilizeUntil?: string;
  snoozedPruneUntil?: string;
  health: 'thriving' | 'healthy' | 'needs-attention';
  notes?: string;
  difficulty: 'Easy' | 'Moderate' | 'Demanding';
  createdAt: string;
}

export interface CareReminder {
  id: string;
  plantId: string;
  plantName: string;
  plantSpecies: string;
  plantRoom: string;
  imageUrl?: string;
  illustrationType: Plant['illustrationType'];
  careType: CareType;
  dueDate: string; // ISO date string YYYY-MM-DD
  snoozedUntil?: string;
  daysDifference: number; // < 0 is overdue, 0 is today, > 0 is upcoming
  status: 'overdue' | 'today' | 'upcoming' | 'completed';
}
