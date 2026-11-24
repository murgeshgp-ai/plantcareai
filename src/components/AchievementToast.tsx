import React, { useEffect } from 'react';
import { AchievementWithProgress, AchievementTier } from '../types/achievement';
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
  Palmtree 
} from 'lucide-react';

interface AchievementToastProps {
  achievement: AchievementWithProgress | null;
  onClose: () => void;
  autoCloseMs?: number;
}

export const AchievementToast: React.FC<AchievementToastProps> = ({
  achievement,
  onClose,
  autoCloseMs = 4500,
}) => {
  useEffect(() => {
    if (!achievement) return;

    const timer = setTimeout(() => {
      onClose();
    }, autoCloseMs);

    return () => clearTimeout(timer);
  }, [achievement, autoCloseMs, onClose]);

  if (!achievement) return null;

  const getBadgeIcon = (iconName: string) => {
    const props = { className: 'w-6 h-6' };
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

  const getTierColors = (tier: AchievementTier) => {
    switch (tier) {
      case 'bronze':
        return {
          bg: 'bg-amber-50',
          border: 'border-amber-300',
          badge: 'bg-amber-100 text-amber-900 border-amber-300',
          iconBg: 'bg-amber-100 text-amber-800 border-amber-300',
        };
      case 'silver':
        return {
          bg: 'bg-slate-50',
          border: 'border-slate-300',
          badge: 'bg-slate-100 text-slate-800 border-slate-300',
          iconBg: 'bg-slate-100 text-slate-700 border-slate-300',
        };
      case 'gold':
        return {
          bg: 'bg-yellow-50/80',
          border: 'border-yellow-300',
          badge: 'bg-yellow-100 text-yellow-900 border-yellow-400',
          iconBg: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        };
      case 'emerald':
        return {
          bg: 'bg-emerald-50',
          border: 'border-emerald-300',
          badge: 'bg-emerald-100 text-emerald-900 border-emerald-300',
          iconBg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        };
    }
  };

  const tierColors = getTierColors(achievement.tier);

  return (
    <aside 
      aria-label="Achievement unlocked notification"
      className="fixed bottom-6 right-4 sm:right-6 z-50 max-w-sm w-full pointer-events-auto animate-in fade-in slide-in-from-bottom-5 duration-300"
    >
      <div 
        className={`p-4 rounded-2xl border shadow-xl bg-white/95 backdrop-blur-md flex items-start gap-3.5 relative overflow-hidden ${tierColors.border}`}
      >
        {/* Subtle decorative celebration shimmer glow */}
        <div 
          className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-emerald-500/10 blur-xl pointer-events-none" 
          aria-hidden="true" 
        />

        {/* Badge Icon */}
        <div 
          className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border shadow-2xs ${tierColors.iconBg}`}
        >
          {getBadgeIcon(achievement.icon)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pr-4 space-y-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-700 flex items-center gap-1 font-mono">
              <Sparkles className="w-3 h-3 text-amber-500 animate-pulse" />
              <span>Achievement Unlocked!</span>
            </span>
            <span 
              className={`px-1.5 py-0.2 text-[9px] font-semibold uppercase tracking-wider rounded border capitalize ${tierColors.badge}`}
            >
              {achievement.tier}
            </span>
          </div>

          <h4 className="font-bold text-stone-900 text-sm font-display truncate">
            {achievement.title}
          </h4>

          <p className="text-xs text-stone-600 leading-snug line-clamp-2">
            {achievement.description}
          </p>
        </div>

        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="p-1 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors shrink-0"
          aria-label="Dismiss achievement notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
