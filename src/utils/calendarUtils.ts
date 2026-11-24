import { Plant, CareType } from '../types/plant';
import { addDays, getDaysDifference, getTodayString } from './dateUtils';

export interface CalendarDay {
  dateStr: string; // YYYY-MM-DD
  dayNumber: number; // 1 - 31
  month: number; // 0 - 11
  year: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isPast: boolean;
}

export interface CalendarCareEvent {
  id: string;
  plantId: string;
  plant: Plant;
  careType: CareType;
  dateStr: string; // YYYY-MM-DD
  isOverdue: boolean;
  isDueToday: boolean;
  isProjected: boolean; // true for future recurring cycle, false for current active due task
  isSnoozed?: boolean;
}

/**
 * Generates the 35 or 42 grid cells for a given month and year (Sunday to Saturday).
 */
export function getMonthCalendarDays(year: number, month: number): CalendarDay[] {
  const today = getTodayString();
  const firstDayOfMonth = new Date(year, month, 1);
  const firstDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday, 6 = Saturday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days: CalendarDay[] = [];

  // Previous month padding days
  const prevMonthLastDate = new Date(year, month, 0).getDate();
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const dayNum = prevMonthLastDate - i;
    const prevMonthDate = new Date(year, month - 1, dayNum);
    const dateStr = formatISODate(prevMonthDate);
    days.push({
      dateStr,
      dayNumber: dayNum,
      month: prevMonthDate.getMonth(),
      year: prevMonthDate.getFullYear(),
      isCurrentMonth: false,
      isToday: dateStr === today,
      isPast: getDaysDifference(dateStr, today) < 0,
    });
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const curDate = new Date(year, month, day);
    const dateStr = formatISODate(curDate);
    days.push({
      dateStr,
      dayNumber: day,
      month,
      year,
      isCurrentMonth: true,
      isToday: dateStr === today,
      isPast: getDaysDifference(dateStr, today) < 0,
    });
  }

  // Next month padding days to complete 7-day row
  const remainingCells = (7 - (days.length % 7)) % 7;
  // If only 35 cells, can pad to 35 or 42 as needed so rows look balanced
  const targetTotal = days.length + remainingCells < 35 ? 35 : days.length + remainingCells;
  const paddingNeeded = targetTotal - days.length;

  for (let day = 1; day <= paddingNeeded; day++) {
    const nextMonthDate = new Date(year, month + 1, day);
    const dateStr = formatISODate(nextMonthDate);
    days.push({
      dateStr,
      dayNumber: day,
      month: nextMonthDate.getMonth(),
      year: nextMonthDate.getFullYear(),
      isCurrentMonth: false,
      isToday: dateStr === today,
      isPast: getDaysDifference(dateStr, today) < 0,
    });
  }

  return days;
}

function formatISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Calculates all immediate due tasks and projects subsequent recurring routine events
 * for the visible calendar period across all plants in the collection.
 */
export function getCareEventsForCalendar(
  plants: Plant[],
  visibleDays: CalendarDay[]
): {
  eventsByDate: Map<string, CalendarCareEvent[]>;
  overdueEvents: CalendarCareEvent[];
  todayEvents: CalendarCareEvent[];
} {
  const today = getTodayString();
  const eventsByDate = new Map<string, CalendarCareEvent[]>();
  const overdueEvents: CalendarCareEvent[] = [];
  const todayEvents: CalendarCareEvent[] = [];

  if (visibleDays.length === 0) {
    return { eventsByDate, overdueEvents, todayEvents };
  }

  const startVisible = visibleDays[0].dateStr;
  const endVisible = visibleDays[visibleDays.length - 1].dateStr;

  const addEvent = (event: CalendarCareEvent) => {
    const list = eventsByDate.get(event.dateStr) || [];
    list.push(event);
    eventsByDate.set(event.dateStr, list);

    if (event.isOverdue && !event.isProjected) {
      overdueEvents.push(event);
    }
    if (event.isDueToday && !event.isProjected) {
      todayEvents.push(event);
    }
  };

  plants.forEach((plant) => {
    const routines: {
      careType: CareType;
      interval: number;
      lastDate: string;
      snoozeDate?: string;
    }[] = [
      {
        careType: 'water',
        interval: plant.wateringFrequencyDays,
        lastDate: plant.lastWatered,
        snoozeDate: plant.snoozedWaterUntil,
      },
      {
        careType: 'fertilize',
        interval: plant.fertilizingFrequencyDays,
        lastDate: plant.lastFertilized,
        snoozeDate: plant.snoozedFertilizeUntil,
      },
      {
        careType: 'prune',
        interval: plant.pruningFrequencyDays,
        lastDate: plant.lastPruned,
        snoozeDate: plant.snoozedPruneUntil,
      },
    ];

    routines.forEach(({ careType, interval, lastDate, snoozeDate }) => {
      if (interval <= 0) return;

      // 1. Immediate Due Date (respecting snooze)
      const immediateDue = snoozeDate || addDays(lastDate, interval);
      const diff = getDaysDifference(immediateDue, today);
      const isOverdue = diff < 0;
      const isDueToday = diff === 0;

      // Primary active due event
      const primaryEvent: CalendarCareEvent = {
        id: `${plant.id}-${careType}-${immediateDue}`,
        plantId: plant.id,
        plant,
        careType,
        dateStr: immediateDue,
        isOverdue,
        isDueToday,
        isProjected: false,
        isSnoozed: Boolean(snoozeDate),
      };

      // Add to calendar if within range or overdue
      if (isOverdue || (immediateDue >= startVisible && immediateDue <= endVisible)) {
        addEvent(primaryEvent);
      }

      // 2. Future Recurring Projections (project cycles up to endVisible)
      // Only project forward from max(immediateDue, today)
      let nextCycleDate = addDays(immediateDue, interval);
      
      // If immediate is overdue, future cycles should schedule from today onward
      if (isOverdue) {
        nextCycleDate = addDays(today, interval);
      }

      while (nextCycleDate <= endVisible) {
        if (nextCycleDate >= startVisible && nextCycleDate !== immediateDue) {
          addEvent({
            id: `${plant.id}-${careType}-${nextCycleDate}-projected`,
            plantId: plant.id,
            plant,
            careType,
            dateStr: nextCycleDate,
            isOverdue: false,
            isDueToday: nextCycleDate === today,
            isProjected: true,
          });
        }
        nextCycleDate = addDays(nextCycleDate, interval);
      }
    });
  });

  // Sort overdue tasks by urgency
  overdueEvents.sort((a, b) => getDaysDifference(a.dateStr) - getDaysDifference(b.dateStr));

  return { eventsByDate, overdueEvents, todayEvents };
}
