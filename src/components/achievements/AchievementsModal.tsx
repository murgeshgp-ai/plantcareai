import React, { useState, useMemo, useEffect } from 'react';
import {
  AchievementWithProgress,
  AchievementCategory,
  AchievementTier,
  UserActivityStats,
  UnlockedAchievement,
} from '../../types/achievement';
import { Plant } from '../../types/plant';
import { GrowthRecord } from '../../types/growth';
import { evaluateAchievements } from '../../utils/achievementEvaluator';
import { formatDatePretty } from '../../utils/dateUtils';
import { 
  Trophy, 
  X, 
  Sparkles, 
  Sprout, 
  Trees, 
  Home, 
  Compass, 
  Droplets, 
  Waves, 
  Scissors, 
  ShieldCheck, 
  Ruler, 
  Camera, 
  TrendingUp, 
  BookOpen, 
  Calendar, 
  Award, 
  Palmtree, 
  Lock, 
  CheckCircle2, 
  Filter 
} from 'lucide-react';

export interface AchievementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Can accept pre-evaluated achievements or userStats/plants/growthRecords to evaluate
  achievements?: AchievementWithProgress[];
  userStats?: UserActivityStats;
  plants?: Plant[];
  growthRecords?: GrowthRecord[];
  unlockedAchievements?: Record<string, UnlockedAchievement>;
}

type CategoryFilter = 'all' | AchievementCategory;
type StatusFilter = 'all' | 'unlocked' | 'locked';

export const AchievementsModal: React.FC<AchievementsModalProps> = ({
  isOpen,
  onClose,
  achievements: externalAchievements,
  userStats,
  plants = [],
  growthRecords = [],
  unlockedAchievements = {},
}) => {
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  // Keyboard Escape listener
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Evaluate achievements if not provided externally
  const computedAchievements = useMemo<AchievementWithProgress[]>(() => {
    if (externalAchievements && externalAchievements.length > 0) {
      return externalAchievements;
    }
    if (userStats) {
      const res = evaluateAchievements(userStats, plants, growthRecords, unlockedAchievements);
      return res.achievementsWithProgress;
    }
    // Fallback evaluation with empty stats
    const emptyStats: UserActivityStats = {
      totalWaterings: 0,
      totalFertilizings: 0,
      totalPrunings: 0,
      totalCareActions: 0,
      activeCareDates: [],
      userPlantIds: [],
      userGrowthRecordIds: [],
      growthRecordsWithPhotoCount: 0,
      vacationModeActivations: 0,
    };
    return evaluateAchievements(emptyStats, plants, growthRecords, unlockedAchievements).achievementsWithProgress;
  }, [externalAchievements, userStats, plants, growthRecords, unlockedAchievements]);

  // Overall metrics summary
  const summary = useMemo(() => {
    const total = computedAchievements.length;
    const unlockedCount = computedAchievements.filter((a) => a.isUnlocked).length;
    const percentage = total > 0 ? Math.round((unlockedCount / total) * 100) : 0;

    const categoryBreakdown: Record<AchievementCategory, { total: number; unlocked: number }> = {
      collection: { total: 0, unlocked: 0 },
      care: { total: 0, unlocked: 0 },
      growth: { total: 0, unlocked: 0 },
      gardening: { total: 0, unlocked: 0 },
    };

    computedAchievements.forEach((a) => {
      if (categoryBreakdown[a.category]) {
        categoryBreakdown[a.category].total += 1;
        if (a.isUnlocked) {
          categoryBreakdown[a.category].unlocked += 1;
        }
      }
    });

    return {
      total,
      unlockedCount,
      percentage,
      categoryBreakdown,
    };
  }, [computedAchievements]);

  // Filtered list
  const filteredAchievements = useMemo(() => {
    return computedAchievements.filter((a) => {
      const matchesCategory = selectedCategory === 'all' || a.category === selectedCategory;
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'unlocked' && a.isUnlocked) ||
        (statusFilter === 'locked' && !a.isUnlocked);
      return matchesCategory && matchesStatus;
    });
  }, [computedAchievements, selectedCategory, statusFilter]);

  // Safe early return placed AFTER all hooks to adhere to React Rules of Hooks
  if (!isOpen) return null;

  const getBadgeIcon = (iconName: string, isUnlocked: boolean) => {
    const props = { className: `w-6 h-6 ${isUnlocked ? '' : 'text-stone-400'}` };
    switch (iconName) {
      case 'Sprout': return <Sprout {...props} />;
      case 'Trees': return <Trees {...props} />;
      case 'Home': return <Home {...props} />;
      case 'Compass': return <Compass {...props} />;
      case 'Droplets': return <Droplets {...props} />;
      case 'Waves': return <Waves {...props} />;
      case 'Sparkles': return <Sparkles {...props} />;
      case 'Scissors': return <Scissors {...props} />;
      case 'ShieldCheck': return <ShieldCheck {...props} />;
      case 'Ruler': return <Ruler {...props} />;
      case 'Camera': return <Camera {...props} />;
      case 'TrendingUp': return <TrendingUp {...props} />;
      case 'BookOpen': return <BookOpen {...props} />;
      case 'Calendar': return <Calendar {...props} />;
      case 'Award': return <Award {...props} />;
      case 'Palmtree': return <Palmtree {...props} />;
      default: return <Trophy {...props} />;
    }
  };

  const getTierBadgeStyle = (tier: AchievementTier, isUnlocked: boolean) => {
    if (!isUnlocked) {
      return {
        badge: 'bg-stone-100 text-stone-500 border-stone-200',
        iconBg: 'bg-stone-100 border-stone-200 text-stone-400',
        progressBar: 'bg-stone-300',
      };
    }

    switch (tier) {
      case 'bronze':
        return {
          badge: 'bg-amber-100 text-amber-900 border-amber-300 font-semibold',
          iconBg: 'bg-amber-100/80 border-amber-300 text-amber-800 shadow-2xs',
          progressBar: 'bg-amber-500',
        };
      case 'silver':
        return {
          badge: 'bg-slate-100 text-slate-800 border-slate-300 font-semibold',
          iconBg: 'bg-slate-100 border-slate-300 text-slate-700 shadow-2xs',
          progressBar: 'bg-slate-500',
        };
      case 'gold':
        return {
          badge: 'bg-yellow-100 text-yellow-900 border-yellow-400 font-semibold',
          iconBg: 'bg-yellow-100 border-yellow-400 text-yellow-800 shadow-2xs',
          progressBar: 'bg-yellow-500',
        };
      case 'emerald':
        return {
          badge: 'bg-emerald-100 text-emerald-950 border-emerald-400 font-semibold',
          iconBg: 'bg-emerald-100 border-emerald-400 text-emerald-800 shadow-2xs',
          progressBar: 'bg-emerald-600',
        };
    }
  };

  const categoryLabels: Record<AchievementCategory, string> = {
    collection: 'Collection',
    care: 'Care Activities',
    growth: 'Growth Tracker',
    gardening: 'Gardening Mastery',
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-black/45 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-4xl rounded-2xl border border-stone-200/90 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="achievements-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-200/80 bg-stone-50/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100/90 border border-amber-300 flex items-center justify-center text-amber-800 shadow-2xs">
              <Trophy className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="achievements-modal-title" className="text-base sm:text-lg font-bold text-stone-900 font-display">
                  Achievements & Badges
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                  {summary.unlockedCount} / {summary.total} Unlocked
                </span>
              </div>
              <p className="text-xs text-stone-500">
                Celebrate your green-thumb milestones and mindful plant care journey
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 rounded-lg transition-colors"
            aria-label="Close achievements dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Overall Progress Showcase Card */}
          <div className="bg-gradient-to-r from-emerald-50/80 via-emerald-50/40 to-stone-50 border border-emerald-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider block font-display">
                  Gardening Journey Progress
                </span>
                <span className="text-xs text-stone-600">
                  Earn badges automatically as you nurture your plant collection
                </span>
              </div>
              <div className="text-left sm:text-right">
                <span className="text-xl font-bold font-mono text-emerald-900">
                  {summary.percentage}%
                </span>
                <span className="text-xs text-stone-500 block">Total Completion</span>
              </div>
            </div>

            {/* Overall Progress Bar */}
            <div className="w-full bg-stone-200/80 h-2.5 rounded-full overflow-hidden">
              <div 
                className="bg-emerald-700 h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${summary.percentage}%` }}
              />
            </div>

            {/* Category Micro-Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              {(Object.keys(categoryLabels) as AchievementCategory[]).map((cat) => {
                const info = summary.categoryBreakdown[cat];
                return (
                  <div key={cat} className="p-2 bg-white/80 rounded-xl border border-stone-200/70 text-center">
                    <span className="text-[10px] text-stone-500 block truncate font-medium">
                      {categoryLabels[cat]}
                    </span>
                    <span className="text-xs font-mono font-bold text-stone-800">
                      {info.unlocked} / {info.total}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Controls: Category Tabs & Status Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200/80 pb-3">
            {/* Category Tabs */}
            <div className="flex flex-wrap items-center gap-1 text-xs">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 rounded-lg transition-colors font-medium ${
                  selectedCategory === 'all'
                    ? 'bg-emerald-800 text-white font-semibold shadow-2xs'
                    : 'bg-stone-100 text-stone-600 hover:text-stone-900 hover:bg-stone-200'
                }`}
              >
                All Badges ({summary.total})
              </button>
              {(Object.keys(categoryLabels) as AchievementCategory[]).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg transition-colors font-medium ${
                    selectedCategory === cat
                      ? 'bg-emerald-800 text-white font-semibold shadow-2xs'
                      : 'bg-stone-100 text-stone-600 hover:text-stone-900 hover:bg-stone-200'
                  }`}
                >
                  {categoryLabels[cat]}
                </button>
              ))}
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1 text-xs self-start sm:self-auto shrink-0">
              <span className="text-stone-400 flex items-center gap-1 text-[11px] pr-1">
                <Filter className="w-3 h-3" />
                <span>Status:</span>
              </span>
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  statusFilter === 'all' ? 'bg-stone-800 text-white' : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('unlocked')}
                className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  statusFilter === 'unlocked' ? 'bg-emerald-700 text-white' : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                Unlocked
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('locked')}
                className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  statusFilter === 'locked' ? 'bg-stone-600 text-white' : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                Locked
              </button>
            </div>
          </div>

          {/* Badge Cards Grid */}
          {filteredAchievements.length === 0 ? (
            <div className="p-10 text-center bg-stone-50 rounded-2xl border border-stone-200">
              <Trophy className="w-8 h-8 text-stone-300 mx-auto mb-2" />
              <p className="text-xs text-stone-600 font-medium">No badges match your filter selection.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
              {filteredAchievements.map((achievement) => {
                const tierStyle = getTierBadgeStyle(achievement.tier, achievement.isUnlocked);

                return (
                  <div
                    key={achievement.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 relative overflow-hidden ${
                      achievement.isUnlocked
                        ? 'bg-white border-stone-200/90 shadow-2xs hover:border-emerald-300'
                        : 'bg-stone-50/70 border-stone-200/70 opacity-80'
                    }`}
                  >
                    {/* Top Row: Icon + Meta + Status */}
                    <div className="flex items-start gap-3.5">
                      <div 
                        className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${tierStyle.iconBg}`}
                      >
                        {getBadgeIcon(achievement.icon, achievement.isUnlocked)}
                      </div>

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-1.5 flex-wrap">
                          <span 
                            className={`px-2 py-0.5 text-[9px] rounded-md border uppercase tracking-wider ${tierStyle.badge}`}
                          >
                            {achievement.tier}
                          </span>

                          {achievement.isUnlocked ? (
                            <span className="text-[10px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1 shrink-0">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>{achievement.unlockedAt ? formatDatePretty(achievement.unlockedAt) : 'Earned'}</span>
                            </span>
                          ) : (
                            <span className="text-[10px] text-stone-500 bg-stone-100 border border-stone-200 px-2 py-0.5 rounded-full font-medium flex items-center gap-1 shrink-0">
                              <Lock className="w-3 h-3 text-stone-400" />
                              <span>Locked</span>
                            </span>
                          )}
                        </div>

                        <h4 className="font-bold text-stone-900 text-sm font-display truncate">
                          {achievement.title}
                        </h4>

                        <p className="text-xs text-stone-600 leading-snug line-clamp-2">
                          {achievement.description}
                        </p>
                      </div>
                    </div>

                    {/* Bottom Progress Bar */}
                    <div className="space-y-1.5 pt-1 border-t border-stone-100">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-stone-500 font-medium">Progress</span>
                        <span className="font-mono font-bold text-stone-800">
                          {Math.min(achievement.currentValue, achievement.targetValue)} / {achievement.targetValue}
                          {achievement.isUnlocked && ' (Complete)'}
                        </span>
                      </div>

                      <div className="w-full bg-stone-200/80 h-2 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-300 ${tierStyle.progressBar}`}
                          style={{ width: `${achievement.progressPercentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-stone-200/80 bg-stone-50/80 flex items-center justify-between gap-3 shrink-0">
          <span className="text-xs text-stone-500">
            Achievements update automatically in real-time as you tend to your garden.
          </span>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-stone-700 hover:text-stone-900 bg-white hover:bg-stone-100 border border-stone-200 rounded-xl transition-colors shadow-2xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
