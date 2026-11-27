import React, { useState } from 'react';
import { Plant, CareType } from '../../types/plant';
import { GrowthRecord } from '../../types/growth';
import { HealthAssessment } from '../../types/health';
import { AchievementWithProgress } from '../../types/achievement';
import { KarnatakaClimateZoneId } from '../../types/seasonal';
import { PlantIllustration } from '../plants/PlantIllustration';
import { HealthScoreBadge } from '../health/HealthScoreBadge';
import { SeasonalCareSection } from '../seasonal/SeasonalCareSection';
import { calculatePlantHealthScore, getHealthBadgeColors } from '../../utils/healthCalculator';
import { addDays, getDaysDifference, formatDueDateLabel, formatDatePretty } from '../../utils/dateUtils';
import {
  Droplets,
  Sparkles,
  Search,
  Plus,
  SunMedium,
  MapPin,
  Check,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  Activity,
  Stethoscope,
  Trophy,
} from 'lucide-react';

interface DashboardProps {
  plants: Plant[];
  onLogCare: (plantId: string, careType: CareType) => void;
  onOpenPlantDetail: (plant: Plant) => void;
  onNavigateToAddPlant: () => void;
  onOpenGrowthTracker?: (plant: Plant) => void;
  allAssessments?: HealthAssessment[];
  allGrowthRecords?: GrowthRecord[];
  onOpenHealthAssessment?: (plant: Plant) => void;
  onOpenAIAssistant?: (plant?: Plant) => void;
  onOpenDiagnosis?: (plant: Plant) => void;
  achievements?: AchievementWithProgress[];
  onOpenAchievements?: () => void;
  climateZone?: KarnatakaClimateZoneId;
  onChangeClimateZone?: (zone: KarnatakaClimateZoneId) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  plants,
  onLogCare,
  onOpenPlantDetail,
  onNavigateToAddPlant,
  onOpenGrowthTracker,
  allAssessments = [],
  allGrowthRecords = [],
  onOpenHealthAssessment,
  onOpenDiagnosis,
  achievements,
  onOpenAchievements,
  climateZone = 'general-karnataka',
  onChangeClimateZone,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoom, setSelectedRoom] = useState<string>('All');
  const [healthFilter, setHealthFilter] = useState<'all' | 'needs-attention'>('all');
  const [wateredRecently, setWateredRecently] = useState<Record<string, boolean>>({});

  // Rooms list extracted from plants
  const rooms = ['All', ...Array.from(new Set(plants.map((p) => p.room)))];

  // Pre-calculate health scores map for all plants
  const plantHealthMap = React.useMemo(() => {
    const map = new Map<string, ReturnType<typeof calculatePlantHealthScore>>();
    plants.forEach((plant) => {
      map.set(plant.id, calculatePlantHealthScore(plant, allAssessments, allGrowthRecords));
    });
    return map;
  }, [plants, allAssessments, allGrowthRecords]);

  // Filtered plants
  const filteredPlants = plants.filter((plant) => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      plant.name.toLowerCase().includes(q) ||
      (plant.species || '').toLowerCase().includes(q) ||
      (plant.notes || '').toLowerCase().includes(q);
    const matchesRoom = selectedRoom === 'All' || plant.room === selectedRoom;

    const healthInfo = plantHealthMap.get(plant.id);
    const isNeedsAttention =
      plant.health === 'needs-attention' ||
      (healthInfo && (healthInfo.totalScore < 50 || healthInfo.label === 'Needs Attention'));

    const matchesHealth = healthFilter === 'all' || isNeedsAttention;

    return matchesSearch && matchesRoom && matchesHealth;
  });

  // KPI metrics
  const totalCount = plants.length;

  // Count plants needing water today or overdue
  const needsAttentionCount = plants.filter((plant) => {
    const nextWater = plant.snoozedWaterUntil || addDays(plant.lastWatered, plant.wateringFrequencyDays);
    const diff = getDaysDifference(nextWater);
    return diff <= 0;
  }).length;

  // Count plants in Good or Excellent health (score >= 75)
  const healthyPlantsCount = plants.filter((p) => {
    const info = plantHealthMap.get(p.id);
    return info ? info.totalScore >= 75 : p.health !== 'needs-attention';
  }).length;

  const collectionAvgHealth =
    totalCount > 0
      ? Math.round(
          plants.reduce((sum, p) => sum + (plantHealthMap.get(p.id)?.totalScore || 80), 0) /
            totalCount
        )
      : 100;

  const handleWaterClick = (e: React.MouseEvent, plantId: string) => {
    e.stopPropagation();
    onLogCare(plantId, 'water');
    setWateredRecently((prev) => ({ ...prev, [plantId]: true }));
    setTimeout(() => {
      setWateredRecently((prev) => ({ ...prev, [plantId]: false }));
    }, 2500);
  };

  const achievementSummary = React.useMemo(() => {
    if (!achievements || achievements.length === 0) return null;
    const total = achievements.length;
    const unlocked = achievements.filter((a) => a.isUnlocked).length;
    const percentage = total > 0 ? Math.round((unlocked / total) * 100) : 0;
    const unlockedBadges = achievements
      .filter((a) => a.isUnlocked && a.unlockedAt)
      .sort((a, b) => new Date(b.unlockedAt!).getTime() - new Date(a.unlockedAt!).getTime());
    const mostRecent = unlockedBadges[0] || null;

    return {
      total,
      unlocked,
      percentage,
      mostRecent,
    };
  }, [achievements]);

  const hasActiveFilters =
    searchQuery.trim().length > 0 || selectedRoom !== 'All' || healthFilter !== 'all';

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-stone-200/80 pb-5">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-emerald-950 font-display">
            Plant Collection
          </h1>
          <p className="mt-1 text-sm text-stone-600 max-w-xl">
            Keep your home garden thriving with gentle, timely care routines and seasonal guidance.
          </p>
        </div>
        <button
          type="button"
          onClick={onNavigateToAddPlant}
          className="inline-flex items-center justify-center gap-2 h-10 px-4 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 rounded-lg shadow-xs transition-colors whitespace-nowrap self-start sm:self-auto shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Plant</span>
        </button>
      </div>

      {/* KPI Metrics Row */}
      <section aria-label="Collection Summary" className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-stretch">
        {/* Total Plants */}
        <div className="p-5 bg-white rounded-xl border border-stone-200/90 shadow-xs flex flex-col justify-between">
          <div className="text-xs font-medium text-stone-500">Total Plants</div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono tabular-nums text-emerald-950 leading-none">
              {totalCount}
            </span>
            <span className="text-xs text-stone-500">in collection</span>
          </div>
        </div>

        {/* Care Needed Now */}
        <div className="p-5 bg-white rounded-xl border border-stone-200/90 shadow-xs flex flex-col justify-between">
          <div className="text-xs font-medium text-stone-500">Care Needed Now</div>
          <div className="mt-3 flex items-baseline gap-2">
            <span
              className={`text-3xl font-bold font-mono tabular-nums leading-none ${
                needsAttentionCount > 0 ? 'text-amber-700' : 'text-emerald-700'
              }`}
            >
              {needsAttentionCount}
            </span>
            <span className="text-xs text-stone-500">
              {needsAttentionCount === 1 ? 'plant requires watering' : 'plants require watering'}
            </span>
          </div>
        </div>

        {/* Overall Plant Health */}
        <div className="p-5 bg-white rounded-xl border border-stone-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-stone-500">Collection Health</span>
            <HealthScoreBadge score={collectionAvgHealth} size="xs" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono tabular-nums text-emerald-800 leading-none">
              {healthyPlantsCount}
            </span>
            <span className="text-xs text-stone-500">
              of {totalCount} in Good or Excellent health
            </span>
          </div>
        </div>
      </section>

      {/* Achievements & Badges Overview Card */}
      {achievementSummary && onOpenAchievements && (
        <section
          aria-label="Care Achievements"
          className="p-5 bg-white border border-stone-200/90 rounded-xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-200/90 flex items-center justify-center text-amber-700 shrink-0">
              <Trophy className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
                <h2 className="font-bold text-sm sm:text-base text-stone-900 font-display">
                  Care Achievements &amp; Badges
                </h2>
                <span className="text-xs font-mono tabular-nums font-semibold text-amber-800">
                  {achievementSummary.unlocked} / {achievementSummary.total} Unlocked ({achievementSummary.percentage}%)
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full max-w-md bg-stone-100 h-2 rounded-full overflow-hidden mt-2">
                <div
                  className="bg-amber-600 h-full rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${achievementSummary.percentage}%` }}
                />
              </div>

              {/* Most recent badge or guidance */}
              <p className="text-xs text-stone-600 mt-1.5 truncate">
                {achievementSummary.mostRecent ? (
                  <span>
                    Latest badge:{' '}
                    <strong className="text-stone-900">{achievementSummary.mostRecent.title}</strong> (
                    {formatDatePretty(achievementSummary.mostRecent.unlockedAt!)}) ·{' '}
                    {achievementSummary.mostRecent.description}
                  </span>
                ) : (
                  <span>
                    Tend your garden, record growth, or add custom plants to unlock achievements.
                  </span>
                )}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenAchievements}
            className="inline-flex items-center justify-center gap-1.5 h-9 px-3.5 text-xs font-semibold text-emerald-950 bg-emerald-50/70 hover:bg-emerald-100/80 border border-emerald-200/90 rounded-lg transition-colors self-start md:self-center shrink-0 whitespace-nowrap"
          >
            <span>View All Badges</span>
            <ArrowRight className="w-3.5 h-3.5 text-emerald-700" />
          </button>
        </section>
      )}

      {/* Indian Seasonal Plant Care Section */}
      <SeasonalCareSection
        plants={plants}
        climateZone={climateZone}
        onChangeClimateZone={onChangeClimateZone || (() => {})}
        onOpenPlantDetail={onOpenPlantDetail}
      />

      {/* Plant Collection Browse & Filter Section */}
      <section aria-label="Your Plants" className="space-y-4">
        {/* Subsection Header */}
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
          <h2 className="text-lg font-bold text-emerald-950 font-display">Your Plants</h2>
          <div className="flex items-center gap-3 text-xs text-stone-500">
            <span className="font-mono tabular-nums">
              Showing {filteredPlants.length} of {plants.length}{' '}
              {plants.length === 1 ? 'plant' : 'plants'}
            </span>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedRoom('All');
                  setHealthFilter('all');
                }}
                className="font-medium text-emerald-700 hover:text-emerald-900 underline underline-offset-2"
              >
                Reset filters
              </button>
            )}
          </div>
        </div>

        {/* Structured Two-Row Filter Bar (Aligned Edges, Zero Horizontal Overflow) */}
        <div className="bg-white p-4 rounded-xl border border-stone-200/90 shadow-xs space-y-3">
          {/* Row 1: Search Input + Health Status Segmented Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search your plants by English, Kannada, or botanical name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-10 pr-4 text-sm bg-stone-50/70 border border-stone-200/90 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 transition-all text-stone-900 placeholder:text-stone-400"
              />
            </div>

            {/* Segmented Status Control */}
            <div className="inline-flex items-center p-1 bg-stone-100 rounded-lg border border-stone-200/70 shrink-0 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setHealthFilter('all')}
                className={`h-8 px-3 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  healthFilter === 'all'
                    ? 'bg-white text-emerald-950 font-semibold shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                All Statuses
              </button>
              <button
                type="button"
                onClick={() => setHealthFilter('needs-attention')}
                className={`h-8 px-3 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                  healthFilter === 'needs-attention'
                    ? 'bg-rose-700 text-white font-semibold shadow-2xs'
                    : 'text-stone-600 hover:text-rose-700'
                }`}
                title="Filter plants needing attention"
              >
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>Needs Attention</span>
              </button>
            </div>
          </div>

          {/* Row 2: Wrapped Room Filter Controls (No Cramped Horizontal Scrolling) */}
          <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-stone-100">
            <span className="text-xs font-medium text-stone-500 mr-1">Location:</span>
            {rooms.map((room) => {
              const isSelected = selectedRoom === room;
              return (
                <button
                  key={room}
                  type="button"
                  onClick={() => setSelectedRoom(room)}
                  className={`h-8 px-3 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap ${
                    isSelected
                      ? 'bg-emerald-900 text-white border-emerald-900 shadow-2xs'
                      : 'bg-stone-50/80 text-stone-600 border-stone-200/80 hover:bg-emerald-50/70 hover:text-emerald-950 hover:border-emerald-300'
                  }`}
                >
                  {room}
                </button>
              );
            })}
          </div>
        </div>

        {/* Plants Grid */}
        {filteredPlants.length === 0 ? (
          <div className="p-10 sm:p-12 text-center bg-white rounded-xl border border-stone-200/90 shadow-xs">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Search className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-stone-900 font-display">
              No plants match your filter
            </h3>
            <p className="mt-1 text-sm text-stone-500 max-w-sm mx-auto">
              {healthFilter === 'needs-attention'
                ? 'Great news! None of your plants are currently flagged as needing urgent attention.'
                : 'Try adjusting your search terms or location filter.'}
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedRoom('All');
                setHealthFilter('all');
              }}
              className="mt-4 h-9 px-4 text-xs font-semibold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 items-stretch">
            {filteredPlants.map((plant) => {
              const nextWaterDate =
                plant.snoozedWaterUntil || addDays(plant.lastWatered, plant.wateringFrequencyDays);
              const waterDiff = getDaysDifference(nextWaterDate);
              const waterDueInfo = formatDueDateLabel(waterDiff);

              const nextFertilizeDate =
                plant.snoozedFertilizeUntil ||
                addDays(plant.lastFertilized, plant.fertilizingFrequencyDays);
              const fertilizeDiff = getDaysDifference(nextFertilizeDate);

              const isWatered = wateredRecently[plant.id];
              const healthBreakdown =
                plantHealthMap.get(plant.id) ||
                calculatePlantHealthScore(plant, allAssessments, allGrowthRecords);
              const healthColors = getHealthBadgeColors(healthBreakdown.totalScore);

              return (
                <article
                  key={plant.id}
                  onClick={() => onOpenPlantDetail(plant)}
                  className="group cursor-pointer bg-white rounded-xl border border-stone-200/90 hover:border-emerald-600/50 shadow-xs hover:shadow-md transition-all flex flex-col overflow-hidden h-full"
                >
                  {/* Uniform Image Header */}
                  <div className="relative h-48 w-full shrink-0 overflow-hidden bg-stone-100">
                    <PlantIllustration
                      type={plant.illustrationType}
                      imageUrl={plant.imageUrl}
                      className="w-full h-full"
                      alt={plant.name}
                    />

                    {/* Room metadata overlay */}
                    <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs text-[11px] font-medium text-stone-700 px-2.5 py-1 rounded-md border border-stone-200/70 shadow-xs flex items-center gap-1.5 max-w-[55%]">
                      <MapPin className="w-3 h-3 text-emerald-700 shrink-0" />
                      <span className="truncate">{plant.room}</span>
                    </div>

                    {/* Plant Health Score Badge */}
                    <button
                      type="button"
                      onClick={(e) => {
                        if (onOpenHealthAssessment) {
                          e.stopPropagation();
                          onOpenHealthAssessment(plant);
                        }
                      }}
                      title="Click to assess or view plant health score"
                      className="absolute top-3 right-3 bg-white/95 backdrop-blur-xs px-2 py-1 rounded-lg border border-stone-200/80 shadow-xs flex items-center gap-1.5 hover:bg-emerald-50/90 transition-colors"
                    >
                      <HealthScoreBadge
                        score={healthBreakdown.totalScore}
                        size="sm"
                        scoreDelta={healthBreakdown.scoreDelta}
                      />
                      <div className="text-left pr-0.5">
                        <div className={`text-[11px] font-bold ${healthColors.text} leading-tight`}>
                          {healthBreakdown.label}
                        </div>
                        <div className="text-[9px] text-stone-500 font-medium leading-tight">
                          Health
                        </div>
                      </div>
                    </button>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 flex-1 flex flex-col">
                    {/* Consistent Title Header Block */}
                    <div className="min-h-[44px]">
                      <h3 className="text-base sm:text-lg font-semibold text-stone-900 group-hover:text-emerald-800 transition-colors font-display leading-snug truncate">
                        {plant.name}
                      </h3>
                      {plant.species ? (
                        <p className="text-xs italic text-stone-500 mt-0.5 truncate">
                          {plant.species}
                        </p>
                      ) : (
                        <p className="text-xs text-stone-400 mt-0.5 truncate">{plant.difficulty} care</p>
                      )}
                    </div>

                    {/* Metadata specs */}
                    <div className="mt-2.5 flex items-center gap-2 text-xs text-stone-500">
                      <span className="flex items-center gap-1 truncate">
                        <SunMedium className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        <span className="truncate">{plant.light}</span>
                      </span>
                      <span aria-hidden="true" className="text-stone-300">
                        ·
                      </span>
                      <span className="whitespace-nowrap">Every {plant.wateringFrequencyDays}d</span>
                    </div>

                    {/* Care Schedule Overview */}
                    <div className="mt-4 pt-3.5 border-t border-stone-100 space-y-2 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1.5 text-stone-600">
                          <Droplets className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                          <span>Watering</span>
                        </span>
                        <span
                          className={`font-mono tabular-nums font-medium whitespace-nowrap ${
                            waterDueInfo.urgency === 'overdue'
                              ? 'text-red-700'
                              : waterDueInfo.urgency === 'today'
                              ? 'text-amber-700'
                              : 'text-stone-700'
                          }`}
                        >
                          {waterDueInfo.label}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2 text-stone-500">
                        <span className="flex items-center gap-1.5 text-stone-600">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>Fertilizing</span>
                        </span>
                        <span className="font-mono tabular-nums whitespace-nowrap">
                          {fertilizeDiff < 0
                            ? `Overdue (${Math.abs(fertilizeDiff)}d)`
                            : fertilizeDiff === 0
                            ? 'Due today'
                            : `In ${fertilizeDiff}d`}
                        </span>
                      </div>
                    </div>

                    {/* Balanced Two-Tier Action Footer (Never Overflows Card Width) */}
                    <div className="mt-auto pt-4 space-y-2">
                      {/* Primary Action Row */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => handleWaterClick(e, plant.id)}
                          disabled={isWatered}
                          className={`flex-1 h-9 flex items-center justify-center gap-1.5 px-3 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                            isWatered
                              ? 'bg-emerald-100 text-emerald-900'
                              : 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100 active:bg-emerald-200 border border-emerald-200/70'
                          }`}
                        >
                          {isWatered ? (
                            <>
                              <Check className="w-3.5 h-3.5 shrink-0" />
                              <span>Watered</span>
                            </>
                          ) : (
                            <>
                              <Droplets className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                              <span>Water Now</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenPlantDetail(plant);
                          }}
                          className="h-9 px-3 text-xs font-medium text-stone-700 hover:text-emerald-950 bg-stone-50 hover:bg-stone-100 border border-stone-200/80 rounded-lg transition-colors inline-flex items-center gap-1 whitespace-nowrap shrink-0"
                          aria-label={`View ${plant.name} details`}
                        >
                          <span>Details</span>
                          <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                        </button>
                      </div>

                      {/* Secondary Utility Row (Equal 3-Column Grid) */}
                      {(onOpenHealthAssessment || onOpenDiagnosis || onOpenGrowthTracker) && (
                        <div className="grid grid-cols-3 gap-1.5">
                          {onOpenHealthAssessment && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenHealthAssessment(plant);
                              }}
                              className="h-8 px-2 text-[11px] font-medium text-stone-700 hover:text-emerald-950 bg-stone-50/80 hover:bg-emerald-50 border border-stone-200/70 rounded-lg transition-colors flex items-center justify-center gap-1 whitespace-nowrap"
                              aria-label="Assess plant health"
                              title="Assess Plant Health"
                            >
                              <Activity className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                              <span>Assess</span>
                            </button>
                          )}

                          {onOpenDiagnosis && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenDiagnosis(plant);
                              }}
                              className="h-8 px-2 text-[11px] font-medium text-stone-700 hover:text-emerald-950 bg-stone-50/80 hover:bg-emerald-50 border border-stone-200/70 rounded-lg transition-colors flex items-center justify-center gap-1 whitespace-nowrap"
                              aria-label="Diagnose plant disease"
                              title="Diagnose Plant Disease with AI Vision"
                            >
                              <Stethoscope className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                              <span>Diagnose</span>
                            </button>
                          )}

                          {onOpenGrowthTracker && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenGrowthTracker(plant);
                              }}
                              className="h-8 px-2 text-[11px] font-medium text-stone-700 hover:text-emerald-950 bg-stone-50/80 hover:bg-emerald-50 border border-stone-200/70 rounded-lg transition-colors flex items-center justify-center gap-1 whitespace-nowrap"
                              aria-label="Track plant growth"
                              title="Track Plant Growth"
                            >
                              <TrendingUp className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                              <span>Growth</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
