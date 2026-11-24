import React, { useState } from 'react';
import { Plant, CareType } from '../../types/plant';
import { PlantIllustration } from '../plants/PlantIllustration';
import { PlantCareCalendar } from './PlantCareCalendar';
import { addDays, getDaysDifference, formatDueDateLabel, formatDatePretty } from '../../utils/dateUtils';
import {
  Droplets,
  Sparkles,
  Scissors,
  Check,
  Calendar,
  AlertTriangle,
  List,
} from 'lucide-react';

interface CareScheduleProps {
  plants: Plant[];
  onLogCare: (plantId: string, careType: CareType) => void;
  onOpenPlantDetail: (plant: Plant) => void;
}

interface ScheduleRow {
  plant: Plant;
  careType: CareType;
  intervalDays: number;
  lastDate: string;
  nextDate: string;
  daysDiff: number;
  isSnoozed?: boolean;
}

export const CareSchedule: React.FC<CareScheduleProps> = ({
  plants,
  onLogCare,
  onOpenPlantDetail,
}) => {
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [selectedCareType, setSelectedCareType] = useState<CareType | 'all'>('all');
  const [timeFilter, setTimeFilter] = useState<'all' | 'due-soon' | 'this-month'>('all');
  const [completedActions, setCompletedActions] = useState<Record<string, boolean>>({});

  // Generate schedule rows
  const scheduleRows: ScheduleRow[] = [];

  plants.forEach((plant) => {
    // 1. Watering
    const nextWater = plant.snoozedWaterUntil || addDays(plant.lastWatered, plant.wateringFrequencyDays);
    scheduleRows.push({
      plant,
      careType: 'water',
      intervalDays: plant.wateringFrequencyDays,
      lastDate: plant.lastWatered,
      nextDate: nextWater,
      daysDiff: getDaysDifference(nextWater),
      isSnoozed: Boolean(plant.snoozedWaterUntil),
    });

    // 2. Fertilizing
    const nextFertilize = plant.snoozedFertilizeUntil || addDays(plant.lastFertilized, plant.fertilizingFrequencyDays);
    scheduleRows.push({
      plant,
      careType: 'fertilize',
      intervalDays: plant.fertilizingFrequencyDays,
      lastDate: plant.lastFertilized,
      nextDate: nextFertilize,
      daysDiff: getDaysDifference(nextFertilize),
      isSnoozed: Boolean(plant.snoozedFertilizeUntil),
    });

    // 3. Pruning
    const nextPrune = plant.snoozedPruneUntil || addDays(plant.lastPruned, plant.pruningFrequencyDays);
    scheduleRows.push({
      plant,
      careType: 'prune',
      intervalDays: plant.pruningFrequencyDays,
      lastDate: plant.lastPruned,
      nextDate: nextPrune,
      daysDiff: getDaysDifference(nextPrune),
      isSnoozed: Boolean(plant.snoozedPruneUntil),
    });
  });

  // Sort: most urgent first (lowest daysDiff)
  scheduleRows.sort((a, b) => a.daysDiff - b.daysDiff);

  // Filter rows
  const filteredRows = scheduleRows.filter((row) => {
    const matchesType = selectedCareType === 'all' || row.careType === selectedCareType;
    let matchesTime = true;
    if (timeFilter === 'due-soon') {
      matchesTime = row.daysDiff <= 3; // overdue, today, or next 3 days
    } else if (timeFilter === 'this-month') {
      matchesTime = row.daysDiff <= 30;
    }
    return matchesType && matchesTime;
  });

  const handleMarkDone = (plantId: string, careType: CareType) => {
    const key = `${plantId}-${careType}`;
    onLogCare(plantId, careType);
    setCompletedActions((prev) => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setCompletedActions((prev) => ({ ...prev, [key]: false }));
    }, 2000);
  };

  // Metric counts
  const waterCount = scheduleRows.filter((r) => r.careType === 'water' && r.daysDiff <= 1).length;
  const fertilizeCount = scheduleRows.filter((r) => r.careType === 'fertilize' && r.daysDiff <= 7).length;
  const pruneCount = scheduleRows.filter((r) => r.careType === 'prune' && r.daysDiff <= 14).length;

  return (
    <div className="space-y-8">
      {/* Editorial Header with View Mode Toggle */}
      <div className="border-b border-stone-200/80 pb-5 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-emerald-950 font-display">
            Care Schedule
          </h1>
          <p className="mt-1 text-sm text-stone-600">
            Monthly calendar and timetable for watering, fertilizing, and pruning across all your botanical companions.
          </p>
        </div>

        {/* View Mode Segmented Toggle: Monthly Calendar vs List View */}
        <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200/80 self-start sm:self-auto shrink-0 shadow-2xs">
          <button
            type="button"
            onClick={() => setViewMode('calendar')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              viewMode === 'calendar'
                ? 'bg-white text-emerald-950 shadow-2xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-emerald-700" />
            <span>Monthly Calendar</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              viewMode === 'list'
                ? 'bg-white text-emerald-950 shadow-2xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <List className="w-3.5 h-3.5 text-emerald-700" />
            <span>List View</span>
          </button>
        </div>
      </div>

      {viewMode === 'calendar' ? (
        <PlantCareCalendar
          plants={plants}
          onLogCare={onLogCare}
          onOpenPlantDetail={onOpenPlantDetail}
        />
      ) : (
        <div className="space-y-8 animate-in fade-in duration-150">
          {/* Routine Quick Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Watering */}
        <button
          onClick={() => setSelectedCareType('water')}
          className={`p-4 rounded-xl border text-left transition-all ${
            selectedCareType === 'water'
              ? 'bg-sky-50/80 border-sky-300 ring-1 ring-sky-300'
              : 'bg-white border-stone-200/80 hover:border-sky-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
              <Droplets className="w-3.5 h-3.5 text-sky-600" />
              <span>Watering Schedule</span>
            </span>
            <span className="text-xs font-mono font-medium text-sky-800 bg-sky-100 px-2 py-0.5 rounded">
              {waterCount} urgent
            </span>
          </div>
          <p className="mt-2 text-xs text-stone-600">
            Keep hydration balanced according to seasonal requirements.
          </p>
        </button>

        {/* Fertilizing */}
        <button
          onClick={() => setSelectedCareType('fertilize')}
          className={`p-4 rounded-xl border text-left transition-all ${
            selectedCareType === 'fertilize'
              ? 'bg-emerald-50/80 border-emerald-300 ring-1 ring-emerald-300'
              : 'bg-white border-stone-200/80 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Fertilizing Schedule</span>
            </span>
            <span className="text-xs font-mono font-medium text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
              {fertilizeCount} due soon
            </span>
          </div>
          <p className="mt-2 text-xs text-stone-600">
            Nourish roots during active growth periods for vibrant leaf development.
          </p>
        </button>

        {/* Pruning */}
        <button
          onClick={() => setSelectedCareType('prune')}
          className={`p-4 rounded-xl border text-left transition-all ${
            selectedCareType === 'prune'
              ? 'bg-amber-50/80 border-amber-300 ring-1 ring-amber-300'
              : 'bg-white border-stone-200/80 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
              <Scissors className="w-4 h-4 text-amber-700" />
              <span>Pruning Schedule</span>
            </span>
            <span className="text-xs font-mono font-medium text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
              {pruneCount} planned
            </span>
          </div>
          <p className="mt-2 text-xs text-stone-600">
            Shape growth, remove spent leaves, and encourage bushier foliage.
          </p>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-stone-200/80">
        {/* Care Type Filter */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setSelectedCareType('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              selectedCareType === 'all'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            All Routines ({scheduleRows.length})
          </button>
          <button
            onClick={() => setSelectedCareType('water')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              selectedCareType === 'water'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            Watering
          </button>
          <button
            onClick={() => setSelectedCareType('fertilize')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              selectedCareType === 'fertilize'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            Fertilizing
          </button>
          <button
            onClick={() => setSelectedCareType('prune')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              selectedCareType === 'prune'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            Pruning
          </button>
        </div>

        {/* Time horizon filter */}
        <div className="flex items-center gap-1 text-xs text-stone-500">
          <span className="hidden sm:inline">Timeline:</span>
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value as any)}
            className="px-2.5 py-1 text-xs bg-stone-50 border border-stone-200 rounded-lg text-stone-700 focus:outline-none"
          >
            <option value="all">All upcoming dates</option>
            <option value="due-soon">Urgent & next 3 days</option>
            <option value="this-month">Next 30 days</option>
          </select>
        </div>
      </div>

      {/* Schedule Table / List */}
      <div className="bg-white rounded-xl border border-stone-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-stone-50/80 border-b border-stone-200/80 text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
              <tr>
                <th scope="col" className="py-3 px-4 sm:px-6">Plant</th>
                <th scope="col" className="py-3 px-4">Routine</th>
                <th scope="col" className="py-3 px-4 hidden sm:table-cell">Frequency</th>
                <th scope="col" className="py-3 px-4 hidden md:table-cell">Last Completed</th>
                <th scope="col" className="py-3 px-4">Next Due</th>
                <th scope="col" className="py-3 px-4 sm:px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredRows.map((row) => {
                const key = `${row.plant.id}-${row.careType}`;
                const isDone = completedActions[key];
                const dueInfo = formatDueDateLabel(row.daysDiff);

                let badgeIcon = <Droplets className="w-3.5 h-3.5 text-sky-600" />;
                let routineName = 'Watering';
                if (row.careType === 'fertilize') {
                  badgeIcon = <Sparkles className="w-3.5 h-3.5 text-emerald-600" />;
                  routineName = 'Fertilizing';
                } else if (row.careType === 'prune') {
                  badgeIcon = <Scissors className="w-3.5 h-3.5 text-amber-700" />;
                  routineName = 'Pruning';
                }

                return (
                  <tr
                    key={key}
                    className="hover:bg-stone-50/70 transition-colors group"
                  >
                    {/* Plant column */}
                    <td className="py-3.5 px-4 sm:px-6">
                      <div
                        onClick={() => onOpenPlantDetail(row.plant)}
                        className="flex items-center gap-3 cursor-pointer"
                      >
                        <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-stone-200/80 bg-stone-100">
                          <PlantIllustration
                            type={row.plant.illustrationType}
                            imageUrl={row.plant.imageUrl}
                            className="w-full h-full object-cover"
                            alt={row.plant.name}
                          />
                        </div>
                        <div>
                          <div className="font-semibold text-stone-900 group-hover:text-emerald-800 transition-colors">
                            {row.plant.name}
                          </div>
                          <div className="text-xs text-stone-500">
                            {row.plant.room}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Routine type */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-stone-700">
                        {badgeIcon}
                        <span>{routineName}</span>
                      </div>
                    </td>

                    {/* Frequency */}
                    <td className="py-3.5 px-4 hidden sm:table-cell text-xs text-stone-600 font-mono tabular-nums">
                      Every {row.intervalDays} days
                    </td>

                    {/* Last Completed */}
                    <td className="py-3.5 px-4 hidden md:table-cell text-xs text-stone-500 font-mono tabular-nums">
                      {formatDatePretty(row.lastDate)}
                    </td>

                    {/* Next Due */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <div
                          className={`text-xs font-mono tabular-nums font-semibold ${
                            dueInfo.urgency === 'overdue'
                              ? 'text-red-700 flex items-center gap-1'
                              : dueInfo.urgency === 'today'
                              ? 'text-amber-700 font-bold'
                              : 'text-stone-700'
                          }`}
                        >
                          {dueInfo.urgency === 'overdue' && (
                            <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0 inline" />
                          )}
                          <span>{dueInfo.label}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-stone-400 font-mono tabular-nums">
                          <span>{formatDatePretty(row.nextDate)}</span>
                          {row.isSnoozed && (
                            <span className="text-[10px] font-sans font-medium text-emerald-800 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">
                              Snoozed
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 sm:px-6 text-right">
                      <button
                        type="button"
                        onClick={() => handleMarkDone(row.plant.id, row.careType)}
                        disabled={isDone}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                          isDone
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 active:bg-emerald-200'
                        }`}
                      >
                        {isDone ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Logged!</span>
                          </>
                        ) : (
                          <span>Mark Done</span>
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )}
</div>
  );
};
