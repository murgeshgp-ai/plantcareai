import React from 'react';
import { Plant, CareType } from '../../types/plant';
import { GrowthRecord } from '../../types/growth';
import { HealthAssessment } from '../../types/health';
import { PlantIllustration } from './PlantIllustration';
import { HealthScoreBadge } from '../health/HealthScoreBadge';
import { calculatePlantHealthScore, getHealthBadgeColors } from '../../utils/healthCalculator';
import { addDays, getDaysDifference, formatDueDateLabel, formatDatePretty } from '../../utils/dateUtils';
import {
  X,
  Droplets,
  Sparkles,
  Scissors,
  SunMedium,
  MapPin,
  Heart,
  Info,
  Check,
  Trash2,
  TrendingUp,
  ArrowRight,
  Activity,
  Lightbulb,
  HelpCircle,
  Bot,
  Stethoscope,
} from 'lucide-react';

interface PlantDetailModalProps {
  plant: Plant | null;
  onClose: () => void;
  onLogCare: (plantId: string, careType: CareType) => void;
  onDeletePlant?: (plantId: string) => void;
  onOpenGrowthTracker?: (plant: Plant) => void;
  allAssessments?: HealthAssessment[];
  allGrowthRecords?: GrowthRecord[];
  onOpenHealthAssessment?: (plant: Plant) => void;
  onOpenAIAssistant?: (plant: Plant) => void;
  onOpenDiagnosis?: (plant: Plant) => void;
}

export const PlantDetailModal: React.FC<PlantDetailModalProps> = ({
  plant,
  onClose,
  onLogCare,
  onDeletePlant,
  onOpenGrowthTracker,
  allAssessments = [],
  allGrowthRecords = [],
  onOpenHealthAssessment,
  onOpenAIAssistant,
  onOpenDiagnosis,
}) => {
  if (!plant) return null;

  // Care routine due dates
  const nextWater = plant.snoozedWaterUntil || addDays(plant.lastWatered, plant.wateringFrequencyDays);
  const waterDiff = getDaysDifference(nextWater);
  const waterDueInfo = formatDueDateLabel(waterDiff);

  const nextFertilize = plant.snoozedFertilizeUntil || addDays(plant.lastFertilized, plant.fertilizingFrequencyDays);
  const fertDiff = getDaysDifference(nextFertilize);
  const fertDueInfo = formatDueDateLabel(fertDiff);

  const nextPrune = plant.snoozedPruneUntil || addDays(plant.lastPruned, plant.pruningFrequencyDays);
  const pruneDiff = getDaysDifference(nextPrune);
  const pruneDueInfo = formatDueDateLabel(pruneDiff);

  // Calculate detailed plant health breakdown
  const healthBreakdown = calculatePlantHealthScore(
    plant,
    allAssessments,
    allGrowthRecords
  );
  const healthColors = getHealthBadgeColors(healthBreakdown.totalScore);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/45 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        className="bg-white w-full max-w-xl rounded-2xl border border-stone-200/90 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8"
        role="dialog"
        aria-modal="true"
      >
        {/* Header Visual with Close Button */}
        <div className="relative">
          <PlantIllustration
            type={plant.illustrationType}
            imageUrl={plant.imageUrl}
            className="w-full h-56 object-cover"
            alt={plant.name}
          />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-xs text-xs font-medium text-stone-700 px-3 py-1 rounded-md border border-stone-200/60 shadow-xs flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-emerald-700" />
            <span>{plant.room}</span>
          </div>

          {/* Health score mini pill overlay on image */}
          <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-md border border-stone-200/60 shadow-xs flex items-center gap-2">
            <HealthScoreBadge score={healthBreakdown.totalScore} size="xs" />
            <span className={`text-xs font-semibold ${healthColors.text}`}>
              {healthBreakdown.label}
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Title and botanical name */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-stone-900 font-display">
                {plant.name}
              </h2>
              <p className="text-xs italic text-stone-500 mt-0.5">
                {plant.species}
              </p>
            </div>
            <div className="text-right">
              <span className="inline-block text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                Difficulty
              </span>
              <div className="text-xs font-semibold text-stone-800">{plant.difficulty}</div>
            </div>
          </div>

          {/* DEDICATED PLANT HEALTH SCORE SECTION */}
          <div className={`p-4 sm:p-5 rounded-2xl border ${healthColors.borderLight} ${healthColors.bgLight}/40 space-y-4`}>
            {/* Header of Health Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200/60 pb-3">
              <div className="flex items-center gap-3">
                <HealthScoreBadge
                  score={healthBreakdown.totalScore}
                  size="lg"
                  scoreDelta={healthBreakdown.scoreDelta}
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                      Plant Health Score
                    </span>
                    <span className={`px-2 py-0.5 text-xs font-bold rounded-full bg-white border border-stone-200 shadow-2xs ${healthColors.text}`}>
                      {healthBreakdown.label}
                    </span>
                  </div>
                  <div className="text-xs text-stone-600 mt-0.5">
                    {healthBreakdown.lastAssessedAt ? (
                      <span>Last assessed: <strong className="text-stone-800">{formatDatePretty(healthBreakdown.lastAssessedAt)}</strong></span>
                    ) : (
                      <span>No manual assessment logged yet</span>
                    )}
                    {healthBreakdown.previousScore !== null && (
                      <span className="ml-2 text-stone-400">
                        (prev: {healthBreakdown.previousScore})
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                {onOpenDiagnosis && (
                  <button
                    type="button"
                    onClick={() => onOpenDiagnosis(plant)}
                    className="px-3 py-1.5 text-xs font-semibold text-emerald-900 bg-emerald-100 hover:bg-emerald-200/80 border border-emerald-300/80 rounded-lg shadow-2xs transition-colors whitespace-nowrap flex items-center justify-center gap-1.5"
                  >
                    <Stethoscope className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Diagnose Plant</span>
                  </button>
                )}

                {onOpenHealthAssessment && (
                  <button
                    type="button"
                    onClick={() => onOpenHealthAssessment(plant)}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-2xs transition-colors whitespace-nowrap flex items-center justify-center gap-1.5"
                  >
                    <Activity className="w-3.5 h-3.5" />
                    <span>{healthBreakdown.latestAssessment ? 'Update Assessment' : 'Assess Health'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Assessment observations chips (if logged) */}
            {healthBreakdown.latestAssessment ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                <div className="bg-white/80 rounded-lg p-2 border border-stone-200/70">
                  <span className="text-[10px] text-stone-400 block font-medium">Leaves</span>
                  <span className="font-semibold text-stone-800 capitalize">
                    {healthBreakdown.latestAssessment.leafCondition.replace('-', ' ')}
                  </span>
                </div>
                <div className="bg-white/80 rounded-lg p-2 border border-stone-200/70">
                  <span className="text-[10px] text-stone-400 block font-medium">Pests</span>
                  <span className="font-semibold text-stone-800 capitalize">
                    {healthBreakdown.latestAssessment.pestCondition.replace('-', ' ')}
                  </span>
                </div>
                <div className="bg-white/80 rounded-lg p-2 border border-stone-200/70">
                  <span className="text-[10px] text-stone-400 block font-medium">Soil</span>
                  <span className="font-semibold text-stone-800 capitalize">
                    {healthBreakdown.latestAssessment.soilCondition.replace('-', ' ')}
                  </span>
                </div>
                <div className="bg-white/80 rounded-lg p-2 border border-stone-200/70">
                  <span className="text-[10px] text-stone-400 block font-medium">Appearance</span>
                  <span className="font-semibold text-stone-800 capitalize">
                    {healthBreakdown.latestAssessment.overallAppearance}
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-white/70 rounded-xl border border-stone-200/60 text-xs text-stone-600 flex items-center justify-between gap-3">
                <span>Record a quick physical inspection to factor leaf, pest, and soil condition into this score.</span>
                {onOpenHealthAssessment && (
                  <button
                    type="button"
                    onClick={() => onOpenHealthAssessment(plant)}
                    className="text-xs font-semibold text-emerald-800 hover:underline shrink-0"
                  >
                    Start Inspection →
                  </button>
                )}
              </div>
            )}

            {/* Transparent Factor Breakdown */}
            <div className="space-y-2 pt-1">
              <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider flex items-center justify-between">
                <span>Score Breakdown & Weighting</span>
                <span className="font-normal lowercase text-stone-400">transparent formula</span>
              </div>
              <div className="space-y-1.5">
                {healthBreakdown.factors.map((factor) => (
                  <div key={factor.name} className="bg-white/90 rounded-lg p-2.5 border border-stone-200/60 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-stone-800 flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          factor.status === 'good' ? 'bg-emerald-600' : factor.status === 'warning' ? 'bg-amber-500' : 'bg-rose-500'
                        }`} />
                        {factor.name} ({factor.weight}%)
                      </span>
                      <span className="font-mono tabular-nums font-semibold text-stone-900">
                        {factor.weight > 0 ? `${factor.score}/100` : 'Not active'}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-500">{factor.detail}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Personalized Recommendations */}
            <div className="space-y-2 pt-1">
              <div className="text-[11px] font-semibold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                <span>Personalized Recommendations</span>
              </div>
              <ul className="space-y-2">
                {healthBreakdown.recommendations.map((rec, i) => (
                  <li key={i} className="text-xs text-stone-700 bg-white/90 p-2.5 rounded-lg border border-stone-200/60 flex items-start gap-2">
                    <span className="text-emerald-700 font-bold leading-none mt-0.5">•</span>
                    <span className="leading-relaxed">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Educational Disclaimer */}
            <div className="text-[10px] text-stone-400 leading-normal flex items-start gap-1.5 pt-1">
              <HelpCircle className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
              <span>
                Educational wellness estimate based on logged routines and physical signs. Not a formal scientific diagnosis.
              </span>
            </div>
          </div>

          {/* Environmental Specs */}
          <div className="grid grid-cols-2 gap-3 p-3.5 bg-stone-50 rounded-xl border border-stone-200/70 text-xs">
            <div className="flex items-center gap-2">
              <SunMedium className="w-4 h-4 text-amber-600 shrink-0" />
              <div>
                <span className="block text-stone-400 font-medium">Light</span>
                <span className="font-semibold text-stone-800">{plant.light}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <span className="block text-stone-400 font-medium">Condition</span>
                <span className="font-semibold text-stone-800 capitalize">{plant.health}</span>
              </div>
            </div>
          </div>

          {/* Care Routines Breakdown */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              Care Routines & Next Due Dates
            </h3>

            {/* Watering */}
            <div className="flex items-center justify-between p-3 rounded-xl border border-stone-200/80 bg-white">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center">
                  <Droplets className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-stone-900">
                    Watering (every {plant.wateringFrequencyDays}d)
                  </div>
                  <div className={`text-xs font-mono tabular-nums ${
                    waterDueInfo.urgency === 'overdue' ? 'text-red-700 font-medium' : 'text-stone-500'
                  }`}>
                    {waterDueInfo.label} · Last: {formatDatePretty(plant.lastWatered)}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onLogCare(plant.id, 'water')}
                className="px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Water</span>
              </button>
            </div>

            {/* Fertilizing */}
            <div className="flex items-center justify-between p-3 rounded-xl border border-stone-200/80 bg-white">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-stone-900">
                    Fertilizing (every {plant.fertilizingFrequencyDays}d)
                  </div>
                  <div className="text-xs text-stone-500 font-mono tabular-nums">
                    {fertDueInfo.label} · Last: {formatDatePretty(plant.lastFertilized)}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onLogCare(plant.id, 'fertilize')}
                className="px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Fertilize</span>
              </button>
            </div>

            {/* Pruning */}
            <div className="flex items-center justify-between p-3 rounded-xl border border-stone-200/80 bg-white">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                  <Scissors className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-stone-900">
                    Pruning (every {plant.pruningFrequencyDays}d)
                  </div>
                  <div className="text-xs text-stone-500 font-mono tabular-nums">
                    {pruneDueInfo.label} · Last: {formatDatePretty(plant.lastPruned)}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onLogCare(plant.id, 'prune')}
                className="px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Prune</span>
              </button>
            </div>
          </div>

          {/* Plant Notes */}
          {plant.notes && (
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/70 text-xs text-stone-700 flex items-start gap-2">
              <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-stone-900 block mb-0.5">Care Tip</span>
                <p className="text-stone-600 leading-relaxed">{plant.notes}</p>
              </div>
            </div>
          )}

          {/* Growth Tracker Direct Access */}
          {onOpenGrowthTracker && (
            <div className="p-3.5 bg-emerald-50/70 rounded-xl border border-emerald-200/80 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-emerald-950">Plant Growth Tracker</div>
                  <div className="text-[11px] text-emerald-800/90 truncate">Track height, leaf count, and photos over time</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenGrowthTracker(plant);
                }}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors flex items-center gap-1 shadow-xs shrink-0"
              >
                <span>Track Growth</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* AI Care Assistant Direct Access */}
          {onOpenAIAssistant && (
            <div className="p-3.5 bg-emerald-50/70 rounded-xl border border-emerald-200/80 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-emerald-950">Ask AI Care Assistant</div>
                  <div className="text-[11px] text-emerald-800/90 truncate">Troubleshoot symptoms & tailored care advice</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAIAssistant(plant);
                }}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors flex items-center gap-1 shadow-xs shrink-0"
              >
                <span>Ask AI</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Footer Controls */}
          <div className="pt-2 flex items-center justify-between border-t border-stone-100">
            {onDeletePlant ? (
              <button
                type="button"
                onClick={() => {
                  onDeletePlant(plant.id);
                  onClose();
                }}
                className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1.5 px-2 py-1 rounded hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove Plant</span>
              </button>
            ) : <div />}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
