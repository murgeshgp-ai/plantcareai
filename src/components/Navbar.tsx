import React from 'react';
import { Sprout, LayoutDashboard, PlusCircle, CalendarCheck, BellRing, TrendingUp, Sparkles, Palmtree, Trophy } from 'lucide-react';

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
  return (
    <>
      {/* Desktop & Tablet Top Bar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-stone-200/80 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 sm:gap-8 h-16">
            
            {/* Zone 1: Brand Wordmark */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => onSelectTab('dashboard')}
                className="flex items-center gap-2.5 text-left text-emerald-950 hover:opacity-90 transition-opacity shrink-0"
                aria-label="SproutCare Home"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-700 flex items-center justify-center text-white shadow-xs">
                  <Sprout className="w-5 h-5 text-emerald-100" />
                </div>
                <span className="font-display text-lg font-bold tracking-tight text-emerald-950 whitespace-nowrap">
                  SproutCare
                </span>
              </button>

              {/* Mobile Vacation Quick Button */}
              {onOpenVacationMode && (
                <button
                  type="button"
                  onClick={onOpenVacationMode}
                  className={`sm:hidden px-2 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1 shrink-0 transition-colors ${
                    isVacationActive
                      ? 'bg-amber-100/90 text-amber-900 border-amber-300'
                      : 'bg-stone-100/80 text-stone-700 border-stone-200'
                  }`}
                  title={isVacationActive ? 'Vacation Mode Active' : 'Vacation Mode'}
                >
                  <Palmtree className={`w-3.5 h-3.5 ${isVacationActive ? 'text-amber-700' : 'text-stone-600'}`} />
                  <span className="text-[11px]">{isVacationActive ? 'Active' : 'Vacation'}</span>
                </button>
              )}
            </div>

            {/* Zone 2: Navigation Links */}
            <nav className="hidden md:flex items-center gap-1 sm:gap-2 text-sm font-medium">
              <button
                onClick={() => onSelectTab('dashboard')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                  activeTab === 'dashboard'
                    ? 'text-emerald-900 bg-emerald-50 font-semibold'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 text-emerald-700" />
                <span>Dashboard</span>
              </button>

              <button
                onClick={() => onSelectTab('growth')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                  activeTab === 'growth'
                    ? 'text-emerald-900 bg-emerald-50 font-semibold'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
                }`}
              >
                <TrendingUp className="w-4 h-4 text-emerald-700" />
                <span>Growth</span>
              </button>

              <button
                onClick={() => onSelectTab('add-plant')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                  activeTab === 'add-plant'
                    ? 'text-emerald-900 bg-emerald-50 font-semibold'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
                }`}
              >
                <PlusCircle className="w-4 h-4 text-emerald-700" />
                <span>Add Plant</span>
              </button>

              <button
                onClick={() => onSelectTab('schedule')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                  activeTab === 'schedule'
                    ? 'text-emerald-900 bg-emerald-50 font-semibold'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
                }`}
              >
                <CalendarCheck className="w-4 h-4 text-emerald-700" />
                <span>Schedule</span>
              </button>

              <button
                onClick={() => onSelectTab('reminders')}
                className={`relative flex items-center gap-2 px-3 py-2 rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                  activeTab === 'reminders'
                    ? 'text-emerald-900 bg-emerald-50 font-semibold'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
                }`}
              >
                <BellRing className="w-4 h-4 text-emerald-700" />
                <span>Reminders</span>
                {urgentRemindersCount > 0 && (
                  <span className="ml-1 text-xs font-mono font-semibold text-emerald-800 bg-emerald-100/90 rounded px-1.5 py-0.5">
                    {urgentRemindersCount}
                  </span>
                )}
              </button>
            </nav>

            {/* Zone 3: Actions (Vacation Mode + AI Assistant + Add Plant) */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* Vacation Mode Trigger Button */}
              {onOpenVacationMode && (
                <button
                  type="button"
                  onClick={onOpenVacationMode}
                  className={`hidden sm:inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg shadow-2xs transition-colors whitespace-nowrap shrink-0 ${
                    isVacationActive
                      ? 'bg-amber-100/90 text-amber-900 border border-amber-300 hover:bg-amber-200'
                      : 'text-stone-700 hover:text-stone-900 bg-stone-100/80 hover:bg-stone-200/80 border border-stone-200/90'
                  }`}
                  title={isVacationActive ? 'Vacation Mode is Active - Click to view or edit' : 'Plan Vacation Mode'}
                >
                  <Palmtree className={`w-4 h-4 ${isVacationActive ? 'text-amber-700' : 'text-stone-600'}`} />
                  <span>{isVacationActive ? 'Vacation Active' : 'Vacation Mode'}</span>
                </button>
              )}

              {/* Achievements Trigger Button */}
              {onOpenAchievements && (
                <button
                  type="button"
                  onClick={onOpenAchievements}
                  className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 text-xs sm:text-sm font-semibold text-amber-950 bg-amber-50/90 hover:bg-amber-100/90 active:bg-amber-200 border border-amber-200/90 rounded-lg shadow-2xs transition-colors whitespace-nowrap shrink-0"
                  title={`Achievements & Badges (${unlockedAchievementsCount}/${totalAchievementsCount} Unlocked)`}
                >
                  <Trophy className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="hidden md:inline">Achievements</span>
                  <span className="text-[11px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300/80">
                    {unlockedAchievementsCount}/{totalAchievementsCount}
                  </span>
                </button>
              )}

              {/* Botanical Sparkle AI Assistant Trigger Button */}
              <button
                type="button"
                onClick={onOpenAssistant}
                className="inline-flex items-center gap-2 px-3 sm:px-3.5 py-2 text-xs sm:text-sm font-semibold text-emerald-900 bg-emerald-50 hover:bg-emerald-100/80 active:bg-emerald-200/80 border border-emerald-200/90 rounded-lg shadow-2xs transition-colors whitespace-nowrap shrink-0"
                title="Ask SproutCare AI Assistant"
              >
                <Sparkles className="w-4 h-4 text-emerald-700" />
                <span>AI Assistant</span>
              </button>

              <button
                onClick={() => onSelectTab('add-plant')}
                className="hidden lg:inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 rounded-lg shadow-xs transition-colors whitespace-nowrap shrink-0"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Add Plant</span>
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <nav 
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200/90 px-1 py-2 flex items-center justify-around shadow-sm"
      >
        <button
          onClick={() => onSelectTab('dashboard')}
          className={`flex flex-col items-center justify-center min-w-[48px] min-h-[44px] rounded-lg transition-colors ${
            activeTab === 'dashboard' ? 'text-emerald-700 font-semibold' : 'text-stone-500 hover:text-stone-900'
          }`}
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] leading-tight">Dashboard</span>
        </button>

        <button
          onClick={() => onSelectTab('growth')}
          className={`flex flex-col items-center justify-center min-w-[48px] min-h-[44px] rounded-lg transition-colors ${
            activeTab === 'growth' ? 'text-emerald-700 font-semibold' : 'text-stone-500 hover:text-stone-900'
          }`}
        >
          <TrendingUp className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] leading-tight">Growth</span>
        </button>

        {/* Botanical Sparkle Assistant on Mobile */}
        <button
          type="button"
          onClick={onOpenAssistant}
          className="flex flex-col items-center justify-center min-w-[48px] min-h-[44px] rounded-lg transition-colors text-emerald-700 hover:text-emerald-950 font-medium"
        >
          <Sparkles className="w-5 h-5 mb-0.5 text-emerald-700" />
          <span className="text-[10px] leading-tight font-semibold">Assistant</span>
        </button>

        <button
          onClick={() => onSelectTab('schedule')}
          className={`flex flex-col items-center justify-center min-w-[48px] min-h-[44px] rounded-lg transition-colors ${
            activeTab === 'schedule' ? 'text-emerald-700 font-semibold' : 'text-stone-500 hover:text-stone-900'
          }`}
        >
          <CalendarCheck className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] leading-tight">Schedule</span>
        </button>

        <button
          onClick={() => onSelectTab('reminders')}
          className={`relative flex flex-col items-center justify-center min-w-[48px] min-h-[44px] rounded-lg transition-colors ${
            activeTab === 'reminders' ? 'text-emerald-700 font-semibold' : 'text-stone-500 hover:text-stone-900'
          }`}
        >
          <div className="relative">
            <BellRing className="w-5 h-5 mb-0.5" />
            {urgentRemindersCount > 0 && (
              <span className="absolute -top-1 -right-2 text-[10px] font-mono font-bold bg-amber-600 text-white rounded-full w-4 h-4 flex items-center justify-center">
                {urgentRemindersCount}
              </span>
            )}
          </div>
          <span className="text-[10px] leading-tight">Reminders</span>
        </button>
      </nav>
    </>
  );
};
