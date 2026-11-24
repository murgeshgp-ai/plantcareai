import React, { useState } from 'react';
import { Plant, CareType, CareReminder } from '../../types/plant';
import { PlantIllustration } from '../plants/PlantIllustration';
import { addDays, getDaysDifference, formatDueDateLabel } from '../../utils/dateUtils';
import {
  Droplets,
  Sparkles,
  Scissors,
  Check,
  AlertTriangle,
  CheckCircle2,
  RotateCw,
} from 'lucide-react';

interface RemindersProps {
  plants: Plant[];
  onLogCare: (plantId: string, careType: CareType) => void;
  onSnoozeCare: (plantId: string, careType: CareType, days: number) => void;
  onOpenPlantDetail: (plant: Plant) => void;
}

export const Reminders: React.FC<RemindersProps> = ({
  plants,
  onLogCare,
  onSnoozeCare,
  onOpenPlantDetail,
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'overdue' | 'today' | 'upcoming'>('all');
  const [completedIds, setCompletedIds] = useState<Record<string, boolean>>({});

  // Compute all reminders across plants
  const allReminders: CareReminder[] = [];

  plants.forEach((plant) => {
    // 1. Water Reminder
    const nextWater = plant.snoozedWaterUntil || addDays(plant.lastWatered, plant.wateringFrequencyDays);
    const waterDiff = getDaysDifference(nextWater);
    allReminders.push({
      id: `${plant.id}-water`,
      plantId: plant.id,
      plantName: plant.name,
      plantSpecies: plant.species,
      plantRoom: plant.room,
      imageUrl: plant.imageUrl,
      illustrationType: plant.illustrationType,
      careType: 'water',
      dueDate: nextWater,
      snoozedUntil: plant.snoozedWaterUntil,
      daysDifference: waterDiff,
      status: waterDiff < 0 ? 'overdue' : waterDiff === 0 ? 'today' : 'upcoming',
    });

    // 2. Fertilize Reminder
    const nextFertilize = plant.snoozedFertilizeUntil || addDays(plant.lastFertilized, plant.fertilizingFrequencyDays);
    const fertDiff = getDaysDifference(nextFertilize);
    allReminders.push({
      id: `${plant.id}-fertilize`,
      plantId: plant.id,
      plantName: plant.name,
      plantSpecies: plant.species,
      plantRoom: plant.room,
      imageUrl: plant.imageUrl,
      illustrationType: plant.illustrationType,
      careType: 'fertilize',
      dueDate: nextFertilize,
      snoozedUntil: plant.snoozedFertilizeUntil,
      daysDifference: fertDiff,
      status: fertDiff < 0 ? 'overdue' : fertDiff === 0 ? 'today' : 'upcoming',
    });

    // 3. Prune Reminder
    const nextPrune = plant.snoozedPruneUntil || addDays(plant.lastPruned, plant.pruningFrequencyDays);
    const pruneDiff = getDaysDifference(nextPrune);
    allReminders.push({
      id: `${plant.id}-prune`,
      plantId: plant.id,
      plantName: plant.name,
      plantSpecies: plant.species,
      plantRoom: plant.room,
      imageUrl: plant.imageUrl,
      illustrationType: plant.illustrationType,
      careType: 'prune',
      dueDate: nextPrune,
      snoozedUntil: plant.snoozedPruneUntil,
      daysDifference: pruneDiff,
      status: pruneDiff < 0 ? 'overdue' : pruneDiff === 0 ? 'today' : 'upcoming',
    });
  });

  // Sort by urgency: lowest daysDifference first
  allReminders.sort((a, b) => a.daysDifference - b.daysDifference);

  const overdueList = allReminders.filter((r) => r.status === 'overdue');
  const todayList = allReminders.filter((r) => r.status === 'today');
  const upcomingList = allReminders.filter((r) => r.status === 'upcoming');

  const filteredReminders = allReminders.filter((r) => {
    if (activeFilter === 'overdue') return r.status === 'overdue';
    if (activeFilter === 'today') return r.status === 'today';
    if (activeFilter === 'upcoming') return r.status === 'upcoming';
    return true;
  });

  const handleComplete = (reminder: CareReminder) => {
    onLogCare(reminder.plantId, reminder.careType);
    setCompletedIds((prev) => ({ ...prev, [reminder.id]: true }));
    setTimeout(() => {
      setCompletedIds((prev) => ({ ...prev, [reminder.id]: false }));
    }, 2000);
  };

  const getCareIcon = (type: CareType) => {
    switch (type) {
      case 'water':
        return <Droplets className="w-4 h-4 text-sky-600" />;
      case 'fertilize':
        return <Sparkles className="w-4 h-4 text-emerald-600" />;
      case 'prune':
        return <Scissors className="w-4 h-4 text-amber-700" />;
    }
  };

  const getCareActionLabel = (type: CareType) => {
    switch (type) {
      case 'water':
        return 'Water';
      case 'fertilize':
        return 'Fertilize';
      case 'prune':
        return 'Prune';
    }
  };

  return (
    <div className="space-y-8">
      {/* Editorial Header */}
      <div className="border-b border-stone-200/80 pb-5">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-emerald-950 font-display">
          Care Reminders
        </h1>
        <p className="mt-1 text-sm text-stone-600">
          Review upcoming and overdue tasks so your plants stay nourished, hydrated, and trimmed.
        </p>
      </div>

      {/* Status Filter Tabs (Button-like segmented controls) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
            activeFilter === 'all'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'bg-white text-stone-600 hover:text-stone-900 border border-stone-200/80 hover:bg-stone-50'
          }`}
        >
          All Activities ({allReminders.length})
        </button>

        <button
          onClick={() => setActiveFilter('overdue')}
          className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
            activeFilter === 'overdue'
              ? 'bg-red-700 text-white shadow-xs'
              : 'bg-white text-stone-600 hover:text-stone-900 border border-stone-200/80 hover:bg-stone-50'
          }`}
        >
          <span>Overdue</span>
          <span className={`text-[11px] font-mono tabular-nums px-1.5 py-0.2 rounded ${
            activeFilter === 'overdue' ? 'bg-red-800 text-white' : 'bg-red-100 text-red-800'
          }`}>
            {overdueList.length}
          </span>
        </button>

        <button
          onClick={() => setActiveFilter('today')}
          className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
            activeFilter === 'today'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-white text-stone-600 hover:text-stone-900 border border-stone-200/80 hover:bg-stone-50'
          }`}
        >
          <span>Due Today</span>
          <span className={`text-[11px] font-mono tabular-nums px-1.5 py-0.2 rounded ${
            activeFilter === 'today' ? 'bg-amber-700 text-white' : 'bg-amber-100 text-amber-800'
          }`}>
            {todayList.length}
          </span>
        </button>

        <button
          onClick={() => setActiveFilter('upcoming')}
          className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
            activeFilter === 'upcoming'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'bg-white text-stone-600 hover:text-stone-900 border border-stone-200/80 hover:bg-stone-50'
          }`}
        >
          <span>Upcoming</span>
          <span className={`text-[11px] font-mono tabular-nums px-1.5 py-0.2 rounded ${
            activeFilter === 'upcoming' ? 'bg-emerald-900 text-white' : 'bg-stone-100 text-stone-600'
          }`}>
            {upcomingList.length}
          </span>
        </button>
      </div>

      {/* Reminders List */}
      {filteredReminders.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-stone-200/80">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-stone-900">All caught up!</h3>
          <p className="mt-1 text-sm text-stone-500 max-w-sm mx-auto">
            There are no reminders matching this filter. Your plants are healthy and cared for.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredReminders.map((reminder) => {
            const isCompleted = completedIds[reminder.id];
            const dueInfo = formatDueDateLabel(reminder.daysDifference);
            const plantObj = plants.find((p) => p.id === reminder.plantId);

            return (
              <div
                key={reminder.id}
                className={`p-4 sm:p-5 bg-white rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs ${
                  reminder.status === 'overdue'
                    ? 'border-red-200/90 hover:border-red-300'
                    : reminder.status === 'today'
                    ? 'border-amber-200/90 hover:border-amber-300'
                    : 'border-stone-200/80 hover:border-emerald-300'
                }`}
              >
                {/* Left: Plant & Reminder Info */}
                <div className="flex items-center gap-3.5">
                  {/* Thumbnail */}
                  <div
                    onClick={() => plantObj && onOpenPlantDetail(plantObj)}
                    className="w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-stone-200/80 bg-stone-100 cursor-pointer"
                  >
                    <PlantIllustration
                      type={reminder.illustrationType}
                      imageUrl={reminder.imageUrl}
                      className="w-full h-full object-cover"
                      alt={reminder.plantName}
                    />
                  </div>

                  {/* Text Description */}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-stone-900 hover:text-emerald-800 transition-colors cursor-pointer"
                        onClick={() => plantObj && onOpenPlantDetail(plantObj)}
                      >
                        {reminder.plantName}
                      </span>
                      <span className="text-xs text-stone-400">·</span>
                      <span className="text-xs text-stone-500">{reminder.plantRoom}</span>
                    </div>

                    <div className="flex items-center gap-2 mt-1">
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-stone-700">
                        {getCareIcon(reminder.careType)}
                        <span className="capitalize">{getCareActionLabel(reminder.careType)}</span>
                      </span>
                      <span className="text-xs text-stone-300">/</span>
                      <span
                        className={`text-xs font-mono tabular-nums font-semibold ${
                          reminder.status === 'overdue'
                            ? 'text-red-700 flex items-center gap-1'
                            : reminder.status === 'today'
                            ? 'text-amber-700'
                            : 'text-stone-500'
                        }`}
                      >
                        {reminder.status === 'overdue' && (
                          <AlertTriangle className="w-3.5 h-3.5 text-red-600 inline shrink-0" />
                        )}
                        <span>{dueInfo.label}</span>
                      </span>
                      {reminder.snoozedUntil && (
                        <span className="text-[10px] font-medium text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          Snoozed
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  {/* Snooze 1 day */}
                  <button
                    type="button"
                    onClick={() => onSnoozeCare(reminder.plantId, reminder.careType, 1)}
                    className="px-2.5 py-1.5 text-xs font-medium text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition-colors flex items-center gap-1"
                    title="Delay reminder by 1 day"
                  >
                    <RotateCw className="w-3.5 h-3.5 text-stone-400" />
                    <span>Snooze +1d</span>
                  </button>

                  {/* Mark Done button */}
                  <button
                    type="button"
                    onClick={() => handleComplete(reminder)}
                    disabled={isCompleted}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                      isCompleted
                        ? 'bg-emerald-100 text-emerald-800'
                        : reminder.status === 'overdue'
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : reminder.status === 'today'
                        ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                        : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                    }`}
                  >
                    {isCompleted ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Completed!</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Mark Done</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
