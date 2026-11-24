import React, { useState } from 'react';
import { Plant, CareType } from '../types/plant';
import { GrowthRecord } from '../types/growth';
import { HealthAssessment } from '../types/health';
import { AchievementWithProgress } from '../types/achievement';
import { PlantIllustration } from './PlantIllustration';
import { HealthScoreBadge } from './HealthScoreBadge';
import { calculatePlantHealthScore, getHealthBadgeColors } from '../utils/healthCalculator';
import { addDays, getDaysDifference, formatDueDateLabel, formatDatePretty } from '../utils/dateUtils';
import { 
  Droplets, 
  Sparkles, 
  Scissors, 
  Search, 
  Plus, 
  SunMedium, 
  MapPin, 
  Check, 
  AlertCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  Activity,
  Heart,
  Filter,
  Bot,
  Stethoscope,
  Trophy
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
  onOpenAIAssistant,
  onOpenDiagnosis,
  achievements,
  onOpenAchievements,
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
    const matchesSearch =
      plant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plant.species.toLowerCase().includes(searchQuery.toLowerCase());
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

  const collectionAvgHealth = totalCount > 0
    ? Math.round(
        plants.reduce((sum, p) => sum + (plantHealthMap.get(p.id)?.totalScore || 80), 0) / totalCount
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

  return (
    <div className="space-y-8">
      {/* Editorial Welcome & Overview */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-stone-200/80 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-emerald-950 font-display">
            Plant Collection
          </h1>
          <p className="mt-1 text-sm text-stone-600 max-w-xl">
            Keep your indoor oasis thriving with gentle, timely care routines and tailored schedules.
          </p>
        </div>
        <button
          onClick={onNavigateToAddPlant}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 rounded-lg shadow-xs transition-colors whitespace-nowrap self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Plant</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Plants */}
        <div className="p-4 sm:p-5 bg-white rounded-xl border border-stone-200/80 shadow-xs">
          <div className="text-xs font-medium text-stone-500 uppercase tracking-wider">
            Total Plants
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono tabular-nums text-emerald-950">
              {totalCount}
            </span>
            <span className="text-xs text-stone-500">in collection</span>
          </div>
        </div>

        {/* Care Needed Now */}
        <div className="p-4 sm:p-5 bg-white rounded-xl border border-stone-200/80 shadow-xs">
          <div className="text-xs font-medium text-stone-500 uppercase tracking-wider">
            Care Needed Now
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-3xl font-bold font-mono tabular-nums ${needsAttentionCount > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
              {needsAttentionCount}
            </span>
            <span className="text-xs text-stone-500">
              {needsAttentionCount === 1 ? 'plant requires watering' : 'plants require watering'}
            </span>
          </div>
        </div>

        {/* Overall Plant Health */}
        <div className="p-4 sm:p-5 bg-white rounded-xl border border-stone-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="text-xs font-medium text-stone-500 uppercase tracking-wider">
              Collection Health
            </div>
            <HealthScoreBadge score={collectionAvgHealth} size="xs" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono tabular-nums text-emerald-800">
              {healthyPlantsCount}
            </span>
            <span className="text-xs text-stone-500">
              of {totalCount} in Good or Excellent health
            </span>
          </div>
        </div>
      </div>

      {/* Achievements & Badges Overview Card */}
      {achievementSummary && onOpenAchievements && (
        <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-50/70 via-stone-50 to-emerald-50/70 border border-amber-200/80 rounded-xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800 shrink-0 shadow-2xs">
              <Trophy className="w-5 h-5 text-amber-700" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-sm text-stone-900 font-display">
                  Care Achievements & Badges
                </span>
                <span className="px-2 py-0.5 text-xs font-mono font-bold rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                  {achievementSummary.unlocked} / {achievementSummary.total} Unlocked ({achievementSummary.percentage}%)
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full max-w-md bg-stone-200/80 h-2 rounded-full overflow-hidden mt-2">
                <div 
                  className="bg-amber-600 h-full rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${achievementSummary.percentage}%` }}
                />
              </div>

              {/* Most recent badge or guidance */}
              <p className="text-xs text-stone-600 mt-1.5 truncate">
                {achievementSummary.mostRecent ? (
                  <span>
                    Latest badge: <strong className="text-stone-900">{achievementSummary.mostRecent.title}</strong> ({formatDatePretty(achievementSummary.mostRecent.unlockedAt!)}) · {achievementSummary.mostRecent.description}
                  </span>
                ) : (
                  <span>Tend your garden, record growth, or add custom plants to unlock achievements!</span>
                )}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenAchievements}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-950 bg-white hover:bg-emerald-50 border border-emerald-300 rounded-lg shadow-2xs transition-colors self-start md:self-auto shrink-0"
          >
            <span>View All Badges</span>
            <ArrowRight className="w-3.5 h-3.5 text-emerald-700" />
          </button>
        </div>
      )}

      {/* Search & Filters Controls */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              placeholder="Search plants by common or botanical name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-stone-200/90 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 transition-all text-stone-900 placeholder:text-stone-400"
            />
          </div>

          {/* Health Attention Quick Filter */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setHealthFilter('all')}
              className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                healthFilter === 'all'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-white text-stone-600 hover:text-stone-900 border border-stone-200/80 hover:bg-stone-50'
              }`}
            >
              All Statuses
            </button>
            <button
              onClick={() => setHealthFilter('needs-attention')}
              className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                healthFilter === 'needs-attention'
                  ? 'bg-rose-700 text-white shadow-xs'
                  : 'bg-white text-stone-600 hover:text-rose-700 border border-stone-200/80 hover:bg-stone-50'
              }`}
              title="Filter plants needing attention"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Needs Attention</span>
            </button>
          </div>

          {/* Room Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {rooms.map((room) => (
              <button
                key={room}
                onClick={() => setSelectedRoom(room)}
                className={`px-3 py-2 text-xs font-medium rounded-lg whitespace-nowrap shrink-0 transition-colors ${
                  selectedRoom === room
                    ? 'bg-stone-800 text-white shadow-xs'
                    : 'bg-white text-stone-600 hover:text-stone-900 border border-stone-200/80 hover:bg-stone-50'
                }`}
              >
                {room}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Plants Grid */}
      {filteredPlants.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-stone-200/80">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-stone-900">No plants match your filter</h3>
          <p className="mt-1 text-sm text-stone-500 max-w-sm mx-auto">
            {healthFilter === 'needs-attention'
              ? 'Great news! None of your plants are currently flagged as needing urgent attention.'
              : 'Try adjusting your search terms or room filter.'}
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedRoom('All');
              setHealthFilter('all');
            }}
            className="mt-4 px-4 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlants.map((plant) => {
            const nextWaterDate = plant.snoozedWaterUntil || addDays(plant.lastWatered, plant.wateringFrequencyDays);
            const waterDiff = getDaysDifference(nextWaterDate);
            const waterDueInfo = formatDueDateLabel(waterDiff);

            const nextFertilizeDate = plant.snoozedFertilizeUntil || addDays(plant.lastFertilized, plant.fertilizingFrequencyDays);
            const fertilizeDiff = getDaysDifference(nextFertilizeDate);

            const isWatered = wateredRecently[plant.id];
            const healthBreakdown = plantHealthMap.get(plant.id) || calculatePlantHealthScore(plant, allAssessments, allGrowthRecords);
            const healthColors = getHealthBadgeColors(healthBreakdown.totalScore);

            return (
              <div
                key={plant.id}
                onClick={() => onOpenPlantDetail(plant)}
                className="group cursor-pointer bg-white rounded-xl border border-stone-200/80 hover:border-emerald-600/50 shadow-xs hover:shadow-md transition-all flex flex-col overflow-hidden"
              >
                {/* Visual Area */}
                <div className="relative">
                  <PlantIllustration
                    type={plant.illustrationType}
                    imageUrl={plant.imageUrl}
                    className="w-full h-48"
                    alt={plant.name}
                  />

                  {/* Room metadata overlay */}
                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs text-[11px] font-medium text-stone-700 px-2.5 py-1 rounded-md border border-stone-200/60 shadow-xs flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 text-emerald-700" />
                    <span>{plant.room}</span>
                  </div>

                  {/* Prominent Plant Health Score Badge in top right */}
                  <div 
                    onClick={(e) => {
                      if (onOpenHealthAssessment) {
                        e.stopPropagation();
                        onOpenHealthAssessment(plant);
                      }
                    }}
                    title="Click to assess or view plant health score"
                    className="absolute top-3 right-3 bg-white/95 backdrop-blur-xs px-2 py-1 rounded-lg border border-stone-200/80 shadow-xs flex items-center gap-2 hover:bg-emerald-50/80 transition-colors"
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
                      <div className="text-[9px] text-stone-500 font-medium">Health</div>
                    </div>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    {/* Plant Titles */}
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="text-lg font-semibold text-stone-900 group-hover:text-emerald-800 transition-colors font-display">
                        {plant.name}
                      </h2>
                    </div>
                    <p className="text-xs italic text-stone-500 mt-0.5 truncate">
                      {plant.species}
                    </p>

                    {/* Metadata specs */}
                    <div className="mt-3 flex items-center gap-2 text-xs text-stone-500">
                      <span className="flex items-center gap-1">
                        <SunMedium className="w-3.5 h-3.5 text-stone-400" />
                        <span>{plant.light}</span>
                      </span>
                      <span aria-hidden="true" className="text-stone-300">·</span>
                      <span>Every {plant.wateringFrequencyDays} days</span>
                    </div>

                    {/* Care Schedule Overview */}
                    <div className="mt-4 pt-4 border-t border-stone-100 space-y-2 text-xs">
                      {/* Watering status */}
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-stone-600">
                          <Droplets className="w-3.5 h-3.5 text-sky-600" />
                          <span>Watering</span>
                        </span>
                        <span
                          className={`font-mono tabular-nums font-medium ${
                            waterDueInfo.urgency === 'overdue'
                              ? 'text-red-700'
                              : waterDueInfo.urgency === 'today'
                              ? 'text-amber-700'
                              : 'text-stone-600'
                          }`}
                        >
                          {waterDueInfo.label}
                        </span>
                      </div>

                      {/* Fertilizing status */}
                      <div className="flex items-center justify-between text-stone-500">
                        <span className="flex items-center gap-1.5 text-stone-600">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Fertilizing</span>
                        </span>
                        <span className="font-mono tabular-nums">
                          {fertilizeDiff < 0
                            ? `Overdue (${Math.abs(fertilizeDiff)}d)`
                            : fertilizeDiff === 0
                            ? 'Due today'
                            : `In ${fertilizeDiff}d`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => handleWaterClick(e, plant.id)}
                      disabled={isWatered}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 text-xs font-semibold rounded-lg transition-all ${
                        isWatered
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 active:bg-emerald-200'
                      }`}
                    >
                      {isWatered ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Watered!</span>
                        </>
                      ) : (
                        <>
                          <Droplets className="w-3.5 h-3.5 text-sky-600" />
                          <span>Water</span>
                        </>
                      )}
                    </button>

                    {onOpenHealthAssessment && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenHealthAssessment(plant);
                        }}
                        className="px-2.5 py-2 text-xs font-medium text-emerald-800 hover:text-emerald-950 bg-emerald-50/70 hover:bg-emerald-100/90 rounded-lg transition-colors flex items-center gap-1"
                        aria-label="Assess plant health"
                        title="Assess Plant Health"
                      >
                        <Activity className="w-3.5 h-3.5 text-emerald-700" />
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
                        className="px-2.5 py-2 text-xs font-medium text-emerald-800 hover:text-emerald-950 bg-emerald-50/70 hover:bg-emerald-100/90 rounded-lg transition-colors flex items-center gap-1"
                        aria-label="Diagnose plant disease"
                        title="Diagnose Plant Disease with AI Vision"
                      >
                        <Stethoscope className="w-3.5 h-3.5 text-emerald-700" />
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
                        className="px-2.5 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors flex items-center gap-1"
                        aria-label="Track plant growth"
                        title="Track Plant Growth"
                      >
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Growth</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onOpenPlantDetail(plant)}
                      className="px-2 py-2 text-xs font-medium text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition-colors"
                      aria-label="View plant details"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
