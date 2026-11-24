export type DiseaseCategory =
  | 'healthy'
  | 'fungal'
  | 'pest'
  | 'watering'
  | 'nutrient'
  | 'environmental'
  | 'unknown';

export type SeverityLevel = 'none' | 'low' | 'moderate' | 'high' | 'critical';

export type DiagnosisConfidence = 'high' | 'medium' | 'low' | 'uncertain';

export interface PlantDiagnosisResult {
  isPlant: boolean;
  hasIssue: boolean;
  conditionName: string;
  category: DiseaseCategory;
  severity: SeverityLevel;
  confidence: DiagnosisConfidence;
  visibleSymptoms: string[];
  possibleCauses: string[];
  treatmentSteps: string[];
  preventionTips: string[];
  uncertaintyWarning?: string;
}

export interface DiagnosticRecord {
  id: string;
  plantId: string;
  diagnosedAt: string; // ISO date string YYYY-MM-DD
  imageUrl?: string;
  result: PlantDiagnosisResult;
  userNotes?: string;
  createdAt: string;
}
