import React, { useState, useMemo } from 'react';
import { Plant, CareType } from '../types/plant';
import { 
  getMonthCalendarDays, 
  getCareEventsForCalendar, 
  CalendarCareEvent, 
  CalendarDay 
} from '../utils/calendarUtils';
import { getTodayString, formatDatePretty, getDaysDifference } from '../utils/dateUtils';
import { PlantIllustration } from './PlantIllustration';
import { 
  ChevronLeft, 
  ChevronRight, 
  Droplets, 
  Sparkles, 
  Scissors, 
  Check, 
  AlertTriangle, 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  ArrowRight,
  Info
} from 'lucide-react';

interface PlantCareCalendarProps {
  plants: Plant[];
  onLogCare: (plantId: string, careType: CareType) => void;
  onOpenPlantDetail: (plant: Plant) => void;
}

const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const PlantCareCalendar: React.FC<PlantCareCalendarProps> = ({
  plants,
  onLogCare,
  onOpenPlantDetail,
}) => {
  const todayStr = getTodayString();
  const todayDate = useMemo(() => new Date(todayStr + 'T00:00:00'), [todayStr]);

  // Current viewed month and year
  const [currentYear, setCurrentYear] = useState<number>(todayDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(todayDate.getMonth()); // 0 - 11

  // Currently selected date for the day details drawer below
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Temporary local feedback state for completed buttons
  const [completedTaskKeys, setCompletedTaskKeys] = useState<Record<string, boolean>>({});

  // Generate calendar grid days
  const calendarDays: CalendarDay[] = useMemo(() => {
    return getMonthCalendarDays(currentYear, currentMonth);
  }, [currentYear, currentMonth]);

  // Compute all immediate & projected care events for the visible grid
  const { eventsByDate, overdueEvents } = useMemo(() => {
    return getCareEventsForCalendar(plants, calendarDays);
  }, [plants, calendarDays]);

  // Navigation handlers
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleJumpToToday = () => {
    setCurrentYear(todayDate.getFullYear());
    setCurrentMonth(todayDate.getMonth());
    setSelectedDate(todayStr);
  };

  const handleMarkDone = (event: CalendarCareEvent) => {
    const key = `${event.plantId}-${event.careType}`;
    onLogCare(event.plantId, event.careType);
    setCompletedTaskKeys((prev) => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setCompletedTaskKeys((prev) => ({ ...prev, [key]: false }));
    }, 2000);
  };

  // Selected date events
  const selectedDateEvents = eventsByDate.get(selectedDate) || [];

  const getCareIcon = (careType: CareType, size = 'w-3 h-3') => {
    switch (careType) {
      case 'water':
        return <Droplets className={`${size} text-sky-600`} />;
      case 'fertilize':
        return <Sparkles className={`${size} text-emerald-600`} />;
      case 'prune':
        return <Scissors className={`${size} text-amber-700`} />;
    }
  };

  const getCareBadgeStyle = (careType: CareType) => {
    switch (careType) {
      case 'water':
        return 'bg-sky-50 text-sky-800 border-sky-200';
      case 'fertilize':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'prune':
        return 'bg-amber-50 text-amber-800 border-amber-200';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Overdue Task Summary Alert Banner */}
      {overdueEvents.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200/90 rounded-2xl text-amber-900 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800 shrink-0">
              <AlertTriangle className="w-4 h-4 text-amber-700" />
            </div>
            <div>
              <span className="font-bold text-sm text-amber-950 block">
                {overdueEvents.length} Overdue Care {overdueEvents.length === 1 ? 'Activity' : 'Activities'}
              </span>
              <p className="text-xs text-amber-800 mt-0.5">
                Some plants need hydration or grooming from previous days.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setSelectedDate(overdueEvents[0].dateStr)}
              className="px-3 py-1.5 text-xs font-semibold text-amber-900 bg-white hover:bg-amber-100 border border-amber-300 rounded-lg shadow-2xs transition-colors"
            >
              View Overdue Tasks
            </button>
          </div>
        </div>
      )}

      {/* Calendar Card Container */}
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden">
        {/* Navigation & Month Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200/80 bg-stone-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-700 flex items-center justify-center text-white shadow-xs">
              <CalendarIcon className="w-5 h-5 text-emerald-100" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-stone-900 font-display">
                {MONTH_NAMES[currentMonth]} {currentYear}
              </h2>
              <p className="text-xs text-stone-500">
                Monthly routine schedule & recurring botanical care
              </p>
            </div>
          </div>

          {/* Month Controls & Today Button */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={handleJumpToToday}
              className="px-3 py-1.5 text-xs font-semibold text-stone-700 hover:text-emerald-900 bg-white hover:bg-stone-50 border border-stone-200 rounded-lg shadow-2xs transition-colors"
            >
              Today
            </button>
            <div className="flex items-center border border-stone-200 rounded-lg bg-white shadow-2xs">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-l-lg transition-colors"
                aria-label="Previous month"
                title="Previous month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="w-[1px] h-4 bg-stone-200" />
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-r-lg transition-colors"
                aria-label="Next month"
                title="Next month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* 7-Day Header (Sunday to Saturday) */}
        <div className="grid grid-cols-7 border-b border-stone-200/80 bg-stone-50/80 text-center py-2.5 text-xs font-semibold text-stone-500 uppercase tracking-wider">
          {WEEKDAY_NAMES.map((weekday, idx) => (
            <div key={idx} className="truncate px-1">
              {weekday}
            </div>
          ))}
        </div>

        {/* Calendar Grid Cells */}
        <div className="grid grid-cols-7 border-collapse divide-x divide-y divide-stone-100">
          {calendarDays.map((day) => {
            const isSelected = day.dateStr === selectedDate;
            const dayEvents = eventsByDate.get(day.dateStr) || [];
            const hasOverdue = dayEvents.some((e) => e.isOverdue && !e.isProjected);
            const hasDueToday = dayEvents.some((e) => e.isDueToday && !e.isProjected);

            // Display up to 3 visual indicators, then +N
            const maxIndicators = 3;
            const visibleEvents = dayEvents.slice(0, maxIndicators);
            const overflowCount = dayEvents.length - maxIndicators;

            return (
              <button
                key={day.dateStr}
                type="button"
                onClick={() => setSelectedDate(day.dateStr)}
                className={`min-h-[76px] sm:min-h-[96px] p-1.5 sm:p-2 text-left flex flex-col justify-between transition-all relative ${
                  day.isCurrentMonth
                    ? 'bg-white hover:bg-emerald-50/30'
                    : 'bg-stone-50/40 text-stone-400 hover:bg-stone-50/70'
                } ${
                  isSelected
                    ? 'ring-2 ring-emerald-700 bg-emerald-50/20 z-10'
                    : ''
                }`}
              >
                {/* Date Header in cell */}
                <div className="flex items-center justify-between w-full">
                  <span
                    className={`inline-flex items-center justify-center text-xs font-mono font-medium rounded-full ${
                      day.isToday
                        ? 'w-6 h-6 bg-emerald-700 text-white font-bold shadow-2xs'
                        : isSelected
                        ? 'font-bold text-emerald-950'
                        : day.isCurrentMonth
                        ? 'text-stone-800'
                        : 'text-stone-400'
                    }`}
                  >
                    {day.dayNumber}
                  </span>

                  {/* Overdue alert indicator on cell */}
                  {hasOverdue && (
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" title="Overdue task on this day" />
                  )}
                  {hasDueToday && !hasOverdue && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Due today" />
                  )}
                </div>

                {/* Event Indicators in cell */}
                <div className="mt-1 space-y-1 w-full">
                  {visibleEvents.map((evt) => (
                    <div
                      key={evt.id}
                      className={`hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium truncate border ${getCareBadgeStyle(
                        evt.careType
                      )} ${evt.isProjected ? 'opacity-70 border-dashed' : ''}`}
                      title={`${evt.plant.name} - ${evt.careType} (${evt.isProjected ? 'Projected cycle' : 'Scheduled'})`}
                    >
                      {getCareIcon(evt.careType, 'w-2.5 h-2.5 shrink-0')}
                      <span className="truncate">{evt.plant.name}</span>
                    </div>
                  ))}

                  {/* Mobile Compact Dots */}
                  <div className="flex sm:hidden items-center gap-1 flex-wrap pt-0.5">
                    {visibleEvents.map((evt) => (
                      <span
                        key={evt.id}
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          evt.careType === 'water'
                            ? 'bg-sky-500'
                            : evt.careType === 'fertilize'
                            ? 'bg-emerald-500'
                            : 'bg-amber-500'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Overflow +N badge */}
                  {overflowCount > 0 && (
                    <div className="text-[9px] sm:text-[10px] text-stone-500 font-mono font-semibold pl-1">
                      +{overflowCount} more
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Legend Footer */}
        <div className="p-3 bg-stone-50/70 border-t border-stone-200/70 flex flex-wrap items-center justify-between gap-3 text-xs text-stone-600">
          <div className="flex flex-wrap items-center gap-3 sm:gap-5">
            <span className="font-semibold text-stone-500 text-[11px] uppercase tracking-wider">
              Indicators:
            </span>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
              <span>Watering</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Fertilizing</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>Pruning</span>
            </div>
            <div className="flex items-center gap-1.5 text-stone-400">
              <span className="border border-dashed border-stone-400 px-1 py-0.5 rounded text-[10px]">
                Dashed
              </span>
              <span>Projected Future Cycle</span>
            </div>
          </div>

          <div className="text-[11px] text-stone-400">
            Click any date to inspect scheduled care
          </div>
        </div>
      </div>

      {/* DAY CARE DETAIL DRAWER (Below Calendar) */}
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs p-5 sm:p-6 space-y-4">
        {/* Day Drawer Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200/70 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-stone-900 font-display">
                Care Scheduled for {formatDatePretty(selectedDate)}
              </h3>
              {selectedDate === todayStr && (
                <span className="px-2 py-0.5 text-[10px] font-semibold text-emerald-800 bg-emerald-100 rounded-full">
                  Today
                </span>
              )}
            </div>
            <p className="text-xs text-stone-500">
              {selectedDateEvents.length === 0
                ? 'No plant care tasks scheduled for this date.'
                : `${selectedDateEvents.length} routine ${
                    selectedDateEvents.length === 1 ? 'activity' : 'activities'
                  } scheduled.`}
            </p>
          </div>

          <div className="text-xs font-mono text-stone-400">
            {selectedDate}
          </div>
        </div>

        {/* Task Cards List */}
        {selectedDateEvents.length === 0 ? (
          <div className="p-8 text-center bg-stone-50/50 rounded-xl border border-stone-200/60">
            <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-emerald-100/70 text-emerald-800 flex items-center justify-center">
              <Check className="w-5 h-5 text-emerald-700" />
            </div>
            <p className="text-sm font-semibold text-stone-800">Clear Care Schedule</p>
            <p className="text-xs text-stone-500 max-w-xs mx-auto mt-0.5">
              No plants require water, fertilizer, or pruning on this date. Your plants are resting.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {selectedDateEvents.map((evt) => {
              const diff = getDaysDifference(evt.dateStr, todayStr);
              const isDone = completedTaskKeys[`${evt.plantId}-${evt.careType}`];

              let statusLabel = 'Scheduled';
              let statusClass = 'bg-stone-100 text-stone-700 border-stone-200';

              if (evt.isProjected) {
                statusLabel = 'Projected Routine';
                statusClass = 'bg-stone-50 text-stone-500 border-stone-200 border-dashed';
              } else if (diff < 0) {
                statusLabel = `Overdue by ${Math.abs(diff)}d`;
                statusClass = 'bg-rose-100 text-rose-800 border-rose-200 font-semibold';
              } else if (diff === 0) {
                statusLabel = 'Due Today';
                statusClass = 'bg-emerald-100 text-emerald-800 border-emerald-200 font-semibold';
              } else {
                statusLabel = `Due in ${diff}d`;
                statusClass = 'bg-sky-50 text-sky-800 border-sky-200';
              }

              return (
                <div
                  key={evt.id}
                  className="p-3.5 bg-white rounded-xl border border-stone-200/80 hover:border-emerald-300 shadow-2xs transition-all flex items-center justify-between gap-3"
                >
                  {/* Plant Info & Thumbnail */}
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={() => onOpenPlantDetail(evt.plant)}
                      className="w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-stone-200/80 hover:opacity-90 transition-opacity"
                      title="View plant details"
                    >
                      <PlantIllustration
                        type={evt.plant.illustrationType}
                        imageUrl={evt.plant.imageUrl}
                        className="w-full h-full object-cover"
                        alt={evt.plant.name}
                      />
                    </button>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onOpenPlantDetail(evt.plant)}
                          className="font-bold text-sm text-stone-900 hover:text-emerald-800 transition-colors truncate text-left"
                        >
                          {evt.plant.name}
                        </button>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-stone-500 mt-0.5">
                        <span className="flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
                          <span className="truncate">{evt.plant.room}</span>
                        </span>
                        <span>·</span>
                        <span className="capitalize text-stone-600 font-medium">
                          {evt.careType}
                        </span>
                      </div>

                      <div className="mt-1.5 flex items-center gap-2">
                        <span className={`px-2 py-0.5 text-[10px] rounded-md border ${statusClass}`}>
                          {statusLabel}
                        </span>
                        {evt.isSnoozed && (
                          <span className="px-1.5 py-0.5 text-[10px] rounded bg-amber-50 text-amber-700 border border-amber-200">
                            Snoozed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Mark Done Action */}
                  <div className="shrink-0 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleMarkDone(evt)}
                      disabled={isDone}
                      className={`px-3 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                        isDone
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 active:bg-emerald-200 shadow-2xs'
                      }`}
                      title={`Mark ${evt.careType} as completed`}
                    >
                      {isDone ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Done!</span>
                        </>
                      ) : (
                        <>
                          {getCareIcon(evt.careType, 'w-3.5 h-3.5')}
                          <span>Mark Done</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => onOpenPlantDetail(evt.plant)}
                      className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
                      title="Open plant details"
                      aria-label="Open plant details"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
