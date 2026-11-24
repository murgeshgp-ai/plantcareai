export interface GrowthRecord {
  id: string;
  plantId: string;
  date: string; // YYYY-MM-DD
  heightCm: number;
  leafCount: number;
  photoUrl?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface GrowthStatistics {
  currentHeight: number | null;
  previousHeight: number | null;
  totalHeightIncrease: number | null;
  currentLeafCount: number | null;
  totalLeafCountChange: number | null;
  hasEnoughData: boolean;
  message?: string;
}
