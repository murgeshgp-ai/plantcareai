import React from 'react';
import {
  Sprout,
  LayoutDashboard,
  PlusCircle,
  CalendarCheck,
  BellRing,
  TrendingUp,
  Sparkles,
  Palmtree,
  Trophy,
} from 'lucide-react';

export type ActiveTab = 'dashboard' | 'add-plant' | 'growth' | 'schedule' | 'reminders';

interface NavbarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  urgentRemindersCount: number;
  onOpenAssistant: () => void;
  isVacationActive?: boolean;
  onOpenVacationMode?: () => void;
  unlockedAchievementsCount?: number;
  totalAchievementsCount?: number;
  onOpenAchievements?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  urgentRemindersCount,
  onOpenAssistant,
  isVacationActive = false,
  onOpenVacationMode,
  unlockedAchievementsCount = 0,
  totalAchievementsCount = 16,
  onOpenAchievements,
}) => {
  const navItems: {
    id: ActiveTab;
    label: string;
    icon: React.FC<{ className?: string }>;
    badge?: number;
  }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'growth', label: 'Growth', icon: TrendingUp },
    { id: 'schedule', label: 'Schedule', icon: CalendarCheck },
    {
      id: 'reminders',
      label: 'Reminders',
      icon: BellRing,
      badge: urgentRemindersCount > 0 ? urgentRemindersCount : undefined,
    },
  ];

  return (
    <>
      {/* Desktop & Tablet Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-3 lg:gap-6 h-16">
            {/* Zone 1: Brand Wordmark */}
            <button
              type="button"
              onClick={() => onSelectTab('dashboard')}
              className="flex items-center gap-2.5 text-left text-emerald-950 hover:opacity-90 transition-opacity shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700/30 rounded-lg"
              aria-label="SproutCare Home"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-700 flex items-center justify-center text-white shadow-xs shrink-0">
                <Sprout className="w-4.5 h-4.5 text-emerald-100" />
              </div>
              <span className="font-display text-lg font-bold tracking-tight text-emerald-950 whitespace-nowrap">
                SproutCare
              </span>
            </button>

            {/* Zone 2: Primary Navigation Links (4 core tabs, cleanly spaced, no duplicate Add Plant) */}
            <nav
              aria-label="Primary Navigation"
              className="hidden md:flex items-center gap-1 lg:gap-1.5 text-sm font-medium min-w-0"
            >
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelectTab(item.id)}
                    className={`inline-flex items-center gap-1.5 px-2.5 lg:px-3 py-2 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700/30 ${
                      isActive
                        ? 'text-emerald-950 bg-emerald-50 font-semibold'
                        : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/70'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? 'text-emerald-700' : 'text-stone-500'
                      }`}
                    />
                    <span>{item.label}</span>
                    {item.badge !== undefined && (
                      <span className="text-[11px] font-mono tabular-nums font-semibold text-emerald-900 bg-emerald-100/90 rounded px-1.5 py-0.5 leading-none">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Zone 3: Utility & Primary Actions (Responsive, never cramped) */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Vacation Mode */}
              {onOpenVacationMode && (
                <button
                  type="button"
                  onClick={onOpenVacationMode}
                  className={`inline-flex items-center justify-center gap-1.5 h-9 px-2.5 xl:px-3 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700/30 ${
                    isVacationActive
                      ? 'bg-amber-100/90 text-amber-950 border-amber-300 hover:bg-amber-200/80'
                      : 'text-stone-700 hover:text-stone-950 bg-stone-50 hover:bg-stone-100 border-stone-200/90'
                  }`}
                  title={
                    isVacationActive
                      ? 'Vacation Mode is Active — Click to view or edit'
                      : 'Plan Vacation Mode'
                  }
                  aria-label={isVacationActive ? 'Vacation Mode Active' : 'Vacation Mode'}
                >
                  <Palmtree
                    className={`w-4 h-4 shrink-0 ${
                      isVacationActive ? 'text-amber-700' : 'text-stone-600'
                    }`}
                  />
                  <span className="hidden xl:inline">
                    {isVacationActive ? 'Vacation Active' : 'Vacation'}
                  </span>
                </button>
              )}

              {/* Achievements & Badges */}
              {onOpenAchievements && (
                <button
                  type="button"
                  onClick={onOpenAchievements}
                  className="inline-flex items-center justify-center gap-1.5 h-9 px-2.5 xl:px-3 text-xs font-semibold text-amber-950 bg-amber-50/80 hover:bg-amber-100/80 border border-amber-200/90 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/30"
                  title={`Achievements & Badges (${unlockedAchievementsCount}/${totalAchievementsCount} Unlocked)`}
                  aria-label={`Achievements: ${unlockedAchievementsCount} of ${totalAchievementsCount} unlocked`}
                >
                  <Trophy className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="hidden xl:inline">Badges</span>
                  <span className="text-[11px] font-mono tabular-nums font-bold text-amber-900">
                    {unlockedAchievementsCount}/{totalAchievementsCount}
                  </span>
                </button>
              )}

              {/* AI Plant Care Assistant */}
              <button
                type="button"
                onClick={onOpenAssistant}
                className="inline-flex items-center justify-center gap-1.5 h-9 px-2.5 sm:px-3 text-xs font-semibold text-emerald-950 bg-emerald-50 hover:bg-emerald-100/90 border border-emerald-200/90 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700/30"
                title="Ask SproutCare AI Plant Care Assistant"
              >
                <Sparkles className="w-4 h-4 text-emerald-700 shrink-0" />
                <span className="hidden sm:inline">AI Assistant</span>
              </button>

              {/* Primary CTA: Add Plant */}
              <button
                type="button"
                onClick={() => onSelectTab('add-plant')}
                className={`inline-flex items-center justify-center gap-1.5 h-9 px-3 sm:px-3.5 text-xs font-semibold rounded-lg shadow-xs transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700/40 ${
                  activeTab === 'add-plant'
                    ? 'bg-emerald-900 text-white'
                    : 'bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white'
                }`}
              >
                <PlusCircle className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">Add Plant</span>
                <span className="sm:hidden">Add</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (Equal 5-column Grid, >=44px touch targets) */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200/90 px-2 py-1.5 shadow-sm"
      >
        <div className="grid grid-cols-5 gap-1 max-w-md mx-auto">
          <button
            type="button"
            onClick={() => onSelectTab('dashboard')}
            className={`flex flex-col items-center justify-center min-h-[44px] rounded-lg transition-colors ${
              activeTab === 'dashboard'
                ? 'text-emerald-800 bg-emerald-50/80 font-semibold'
                : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            <LayoutDashboard className="w-4.5 h-4.5 mb-0.5" />
            <span className="text-[10px] leading-tight whitespace-nowrap">Dashboard</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('growth')}
            className={`flex flex-col items-center justify-center min-h-[44px] rounded-lg transition-colors ${
              activeTab === 'growth'
                ? 'text-emerald-800 bg-emerald-50/80 font-semibold'
                : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            <TrendingUp className="w-4.5 h-4.5 mb-0.5" />
            <span className="text-[10px] leading-tight whitespace-nowrap">Growth</span>
          </button>

          <button
            type="button"
            onClick={onOpenAssistant}
            className="flex flex-col items-center justify-center min-h-[44px] rounded-lg transition-colors text-emerald-700 hover:text-emerald-950 font-medium"
          >
            <Sparkles className="w-4.5 h-4.5 mb-0.5 text-emerald-700" />
            <span className="text-[10px] leading-tight font-semibold whitespace-nowrap">
              Assistant
            </span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('schedule')}
            className={`flex flex-col items-center justify-center min-h-[44px] rounded-lg transition-colors ${
              activeTab === 'schedule'
                ? 'text-emerald-800 bg-emerald-50/80 font-semibold'
                : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            <CalendarCheck className="w-4.5 h-4.5 mb-0.5" />
            <span className="text-[10px] leading-tight whitespace-nowrap">Schedule</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('reminders')}
            className={`relative flex flex-col items-center justify-center min-h-[44px] rounded-lg transition-colors ${
              activeTab === 'reminders'
                ? 'text-emerald-800 bg-emerald-50/80 font-semibold'
                : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            <div className="relative">
              <BellRing className="w-4.5 h-4.5 mb-0.5" />
              {urgentRemindersCount > 0 && (
                <span className="absolute -top-1 -right-2 text-[10px] font-mono tabular-nums font-bold bg-amber-600 text-white rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center">
                  {urgentRemindersCount}
                </span>
              )}
            </div>
            <span className="text-[10px] leading-tight whitespace-nowrap">Reminders</span>
          </button>
        </div>
      </nav>
    </>
  );
};
