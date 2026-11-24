import React, { useState, useMemo, useEffect } from 'react';
import { Plant, CareType } from '../types/plant';
import { VacationConfig } from '../types/vacation';
import { 
  calculateVacationDuration, 
  calculateVacationSummary, 
  generatePreDepartureChecklist, 
  categorizePlantSurvival,
  isVacationActive
} from '../utils/vacationUtils';
import { addDays, getTodayString, formatDatePretty, getDaysDifference, isValidDateString } from '../utils/dateUtils';
import { 
  Palmtree, 
  X, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  Droplets, 
  Sparkles, 
  Scissors, 
  Sun, 
  ShieldCheck, 
  MapPin, 
  Check, 
  PowerOff,
  ChevronRight,
  ArrowRight,
  Sparkle
} from 'lucide-react';

interface VacationModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  plants: Plant[];
  vacationConfig?: VacationConfig | null;
  onActivate: (config: VacationConfig) => void;
  onDeactivate?: () => void;
}

type ModalTab = 'checklist' | 'care-tasks' | 'survival-guide';

export const VacationModeModal: React.FC<VacationModeModalProps> = ({
  isOpen,
  onClose,
  plants,
  vacationConfig,
  onActivate,
  onDeactivate,
}) => {
  const todayStr = getTodayString();
  const defaultDeparture = addDays(todayStr, 1); // Tomorrow by default
  const defaultReturn = addDays(defaultDeparture, 7); // 7 days after departure

  // Date selection state with validation fallbacks
  const [departureDate, setDepartureDate] = useState<string>(
    isValidDateString(vacationConfig?.departureDate) ? (vacationConfig?.departureDate as string) : defaultDeparture
  );
  const [returnDate, setReturnDate] = useState<string>(
    isValidDateString(vacationConfig?.returnDate) ? (vacationConfig?.returnDate as string) : defaultReturn
  );
  const [vacationNotes, setVacationNotes] = useState<string>(
    vacationConfig?.notes || ''
  );

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<ModalTab>('checklist');

  // Local interactive checklist completion tracking (purely visual helper for packing)
  const [checkedPrepIds, setCheckedPrepIds] = useState<Record<string, boolean>>({});

  // Sync state if vacationConfig or isOpen changes
  useEffect(() => {
    if (isOpen) {
      if (vacationConfig && isValidDateString(vacationConfig.departureDate)) {
        setDepartureDate(vacationConfig.departureDate);
        setReturnDate(isValidDateString(vacationConfig.returnDate) ? vacationConfig.returnDate : defaultReturn);
        setVacationNotes(vacationConfig.notes || '');
      } else {
        setDepartureDate(defaultDeparture);
        setReturnDate(defaultReturn);
        setVacationNotes('');
      }
    }
  }, [isOpen, vacationConfig, defaultDeparture, defaultReturn]);

  // Strict Date Validation
  const isDepartureValid = isValidDateString(departureDate);
  const isReturnValid = isValidDateString(returnDate);
  const isDateOrderValid = Boolean(isDepartureValid && isReturnValid && returnDate > departureDate);
  const durationDays = isDateOrderValid ? calculateVacationDuration(departureDate, returnDate) : 0;
  const isDepartureInPast = isDepartureValid && getDaysDifference(departureDate, todayStr) < 0;

  // Compute live vacation summary and pre-departure checklist using existing utilities
  const currentConfig: VacationConfig = useMemo(() => ({
    isActive: Boolean(vacationConfig?.isActive),
    departureDate: isDepartureValid ? departureDate : defaultDeparture,
    returnDate: isReturnValid ? returnDate : defaultReturn,
    notes: vacationNotes,
  }), [vacationConfig?.isActive, isDepartureValid, departureDate, defaultDeparture, isReturnValid, returnDate, defaultReturn, vacationNotes]);

  const vacationSummary = useMemo(() => {
    if (!isDateOrderValid) return null;
    return calculateVacationSummary(plants, currentConfig, todayStr);
  }, [plants, currentConfig, todayStr, isDateOrderValid]);

  const prepChecklist = useMemo(() => {
    if (!isDateOrderValid) return [];
    return generatePreDepartureChecklist(plants, departureDate, returnDate);
  }, [plants, departureDate, returnDate, isDateOrderValid]);

  const currentlyActive = isVacationActive(vacationConfig, todayStr);

  const handleQuickPreset = (days: number) => {
    const validDep = isDepartureValid ? departureDate : defaultDeparture;
    setDepartureDate(validDep);
    setReturnDate(addDays(validDep, days));
  };

  const handleActivateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDateOrderValid) return;

    onActivate({
      isActive: true,
      departureDate,
      returnDate,
      notes: vacationNotes.trim() || undefined,
      activatedAt: new Date().toISOString(),
    });
    onClose();
  };

  const togglePrepChecked = (plantId: string) => {
    setCheckedPrepIds((prev) => ({ ...prev, [plantId]: !prev[plantId] }));
  };

  const getCareIcon = (careType: CareType, size = 'w-3.5 h-3.5') => {
    switch (careType) {
      case 'water':
        return <Droplets className={`${size} text-sky-600`} />;
      case 'fertilize':
        return <Sparkles className={`${size} text-emerald-600`} />;
      case 'prune':
        return <Scissors className={`${size} text-amber-700`} />;
    }
  };

  const getPriorityBadgeClass = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high':
        return 'bg-rose-100 text-rose-800 border-rose-200 font-semibold';
      case 'medium':
        return 'bg-amber-100 text-amber-800 border-amber-200 font-medium';
      case 'low':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200 font-medium';
    }
  };

  // Safe early return placed AFTER all hooks to adhere to React Rules of Hooks
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-black/45 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-3xl rounded-2xl border border-stone-200/90 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="vacation-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Section A: Header */}
        <div className="px-5 py-4 border-b border-stone-200/80 bg-stone-50/70 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100/80 border border-amber-200 flex items-center justify-center text-amber-800 shadow-2xs">
              <Palmtree className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="vacation-modal-title" className="text-base sm:text-lg font-bold text-stone-900 font-display">
                  Vacation Mode
                </h2>
                {currentlyActive ? (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                    <span>Active</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 text-[10px] font-semibold text-stone-600 bg-stone-100 rounded-full">
                    Setup & Prep
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-500">
                Keep your plants happy and hydrated while you're away
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 rounded-lg transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Section B: Trip Date Selection Form */}
          <div className="bg-stone-50/70 border border-stone-200/80 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200/60 pb-3">
              <div>
                <span className="text-xs font-bold text-stone-800 uppercase tracking-wider block">
                  Trip Schedule
                </span>
                <span className="text-xs text-stone-500">
                  Select your departure and return dates to calculate care needs
                </span>
              </div>

              {isDateOrderValid && (
                <div className="px-3 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold self-start sm:self-auto flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-700" />
                  <span>{durationDays} Days Total Absence</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Departure Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={departureDate}
                    onChange={(e) => setDepartureDate(e.target.value)}
                    className="w-full text-xs sm:text-sm bg-white border border-stone-200 rounded-xl px-3 py-2 text-stone-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Return Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={returnDate}
                    min={isDepartureValid ? addDays(departureDate, 1) : todayStr}
                    onChange={(e) => setReturnDate(e.target.value)}
                    className="w-full text-xs sm:text-sm bg-white border border-stone-200 rounded-xl px-3 py-2 text-stone-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
                  />
                </div>
              </div>
            </div>

            {/* Quick Presets Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="text-stone-500 font-medium text-[11px]">Quick Presets:</span>
              <button
                type="button"
                onClick={() => handleQuickPreset(3)}
                className="px-2.5 py-1 bg-white hover:bg-stone-100 border border-stone-200 rounded-lg text-stone-700 transition-colors"
              >
                Long Weekend (3d)
              </button>
              <button
                type="button"
                onClick={() => handleQuickPreset(7)}
                className="px-2.5 py-1 bg-white hover:bg-stone-100 border border-stone-200 rounded-lg text-stone-700 transition-colors"
              >
                1 Week (7d)
              </button>
              <button
                type="button"
                onClick={() => handleQuickPreset(14)}
                className="px-2.5 py-1 bg-white hover:bg-stone-100 border border-stone-200 rounded-lg text-stone-700 transition-colors"
              >
                2 Weeks (14d)
              </button>
            </div>

            {/* Validation Message Banner */}
            {!isDateOrderValid && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Return date must be at least 1 day after your departure date.</span>
              </div>
            )}
          </div>

          {/* Section Navigation Tabs */}
          {isDateOrderValid && vacationSummary && (
            <div className="space-y-4">
              <div className="flex items-center border-b border-stone-200/80 gap-1 sm:gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('checklist')}
                  className={`pb-2.5 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
                    activeTab === 'checklist'
                      ? 'border-emerald-700 text-emerald-950 font-bold'
                      : 'border-transparent text-stone-500 hover:text-stone-800'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span>Pre-Departure Checklist</span>
                  <span className="ml-1 text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800">
                    {prepChecklist.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('care-tasks')}
                  className={`pb-2.5 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
                    activeTab === 'care-tasks'
                      ? 'border-emerald-700 text-emerald-950 font-bold'
                      : 'border-transparent text-stone-500 hover:text-stone-800'
                  }`}
                >
                  <Calendar className="w-4 h-4 text-emerald-700" />
                  <span>Care During Absence</span>
                  <span className="ml-1 text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded-full bg-stone-100 text-stone-700">
                    {vacationSummary.totalTasksCount}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('survival-guide')}
                  className={`pb-2.5 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
                    activeTab === 'survival-guide'
                      ? 'border-emerald-700 text-emerald-950 font-bold'
                      : 'border-transparent text-stone-500 hover:text-stone-800'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span>Survival Guide</span>
                </button>
              </div>

              {/* TAB 1: PRE-DEPARTURE CHECKLIST */}
              {activeTab === 'checklist' && (
                <div className="space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between text-xs text-stone-500">
                    <span>Complete these preparations before you head out:</span>
                    <span>
                      {Object.values(checkedPrepIds).filter(Boolean).length} of {prepChecklist.length} prepped
                    </span>
                  </div>

                  {prepChecklist.length === 0 ? (
                    <div className="p-8 text-center bg-stone-50 rounded-xl border border-stone-200">
                      <p className="text-xs text-stone-600">No plants currently in your collection.</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {prepChecklist.map((item) => {
                        const isChecked = Boolean(checkedPrepIds[item.plantId]);

                        return (
                          <div
                            key={item.plantId}
                            onClick={() => togglePrepChecked(item.plantId)}
                            className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                              isChecked
                                ? 'bg-emerald-50/50 border-emerald-200 opacity-80'
                                : 'bg-white border-stone-200/80 hover:border-emerald-300 shadow-2xs'
                            }`}
                          >
                            <div className="pt-0.5 shrink-0">
                              <div
                                className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                                  isChecked
                                    ? 'bg-emerald-700 border-emerald-700 text-white'
                                    : 'border-stone-300 bg-white hover:border-emerald-500'
                                }`}
                              >
                                {isChecked && <Check className="w-3.5 h-3.5" />}
                              </div>
                            </div>

                            <div className="flex-1 min-w-0 space-y-1">
                              <div className="flex flex-wrap items-center justify-between gap-1.5">
                                <div className="flex items-center gap-2 truncate">
                                  <span className={`font-bold text-xs sm:text-sm text-stone-900 truncate ${isChecked ? 'line-through text-stone-500' : ''}`}>
                                    {item.plantName}
                                  </span>
                                  <span className="text-xs text-stone-400">·</span>
                                  <span className="text-[11px] text-stone-500 flex items-center gap-1 truncate">
                                    <MapPin className="w-3 h-3 text-stone-400" />
                                    <span>{item.plantRoom}</span>
                                  </span>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  <span className={`px-2 py-0.5 text-[10px] rounded-md border uppercase tracking-wider ${getPriorityBadgeClass(item.prepPriority)}`}>
                                    {item.prepPriority} Priority
                                  </span>
                                  <span className="px-2 py-0.5 text-[10px] rounded-md bg-stone-100 text-stone-600 border border-stone-200 capitalize">
                                    {item.survivalCategory.replace('-', ' ')}
                                  </span>
                                </div>
                              </div>

                              <p className={`text-xs leading-relaxed ${isChecked ? 'text-stone-400 line-through' : 'text-stone-700'}`}>
                                {item.recommendation}
                              </p>

                              <div className="flex items-center gap-3 text-[11px] text-stone-500 pt-0.5">
                                <span>Suggested prep: <strong className="text-stone-700">{formatDatePretty(item.suggestedActionDate)}</strong></span>
                                {item.needsFertilizingPause && (
                                  <span className="text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200/80">
                                    Pause fertilizer
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: CARE DURING VACATION SUMMARY */}
              {activeTab === 'care-tasks' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  {/* Metric Overview Pills */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-center">
                      <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider block">
                        Total Activities
                      </span>
                      <span className="text-lg font-bold text-stone-800 font-mono">
                        {vacationSummary.totalTasksCount}
                      </span>
                    </div>

                    <div className="p-3 bg-sky-50/60 rounded-xl border border-sky-200 text-center">
                      <span className="text-[10px] font-semibold text-sky-700 uppercase tracking-wider flex items-center justify-center gap-1">
                        <Droplets className="w-3 h-3" />
                        <span>Watering</span>
                      </span>
                      <span className="text-lg font-bold text-sky-900 font-mono">
                        {vacationSummary.wateringTasksCount}
                      </span>
                    </div>

                    <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200 text-center">
                      <span className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wider flex items-center justify-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        <span>Fertilizing</span>
                      </span>
                      <span className="text-lg font-bold text-emerald-900 font-mono">
                        {vacationSummary.fertilizingTasksCount}
                      </span>
                    </div>

                    <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 text-center">
                      <span className="text-[10px] font-semibold text-amber-800 uppercase tracking-wider flex items-center justify-center gap-1">
                        <Scissors className="w-3 h-3" />
                        <span>Pruning</span>
                      </span>
                      <span className="text-lg font-bold text-amber-900 font-mono">
                        {vacationSummary.pruningTasksCount}
                      </span>
                    </div>
                  </div>

                  {/* Tasks List Falling in Window */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-stone-800 uppercase tracking-wider block">
                      Scheduled Routine Calendar
                    </span>

                    {vacationSummary.tasksDuringAbsence.length === 0 ? (
                      <div className="p-6 text-center bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-500">
                        No care routines fall due during this {durationDays}-day window. Your plants are safe!
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {vacationSummary.tasksDuringAbsence.map((task) => (
                          <div
                            key={task.id}
                            className="p-3 bg-white rounded-xl border border-stone-200/80 flex items-center justify-between gap-3 text-xs"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center shrink-0">
                                {getCareIcon(task.careType)}
                              </div>
                              <div>
                                <span className="font-bold text-stone-900 block">{task.plantName}</span>
                                <span className="text-stone-500 flex items-center gap-1 text-[11px]">
                                  <MapPin className="w-3 h-3 text-stone-400" />
                                  <span>{task.plantRoom}</span>
                                  <span>·</span>
                                  <span className="capitalize">{task.careType}</span>
                                </span>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <span className="font-semibold text-stone-800 block text-xs">
                                {formatDatePretty(task.dueDate)}
                              </span>
                              <div className="flex items-center gap-1 justify-end mt-0.5">
                                <span className="text-[10px] text-stone-400 font-mono">
                                  Day {task.daysIntoVacation} of trip
                                </span>
                                {task.isSnoozed && (
                                  <span className="text-[9px] bg-amber-100 text-amber-800 px-1 rounded">
                                    Snoozed
                                  </span>
                                )}
                                {task.isProjected && (
                                  <span className="text-[9px] bg-stone-100 text-stone-600 px-1 rounded">
                                    Projected
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: PLANT SURVIVAL GUIDE */}
              {activeTab === 'survival-guide' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Moisture Sensitive Advice */}
                    <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-2">
                      <div className="flex items-center gap-2">
                        <Droplets className="w-4 h-4 text-emerald-700" />
                        <h4 className="font-bold text-xs text-emerald-950 uppercase tracking-wider">
                          Moisture-Sensitive Plants ({vacationSummary.moistureSensitiveCount})
                        </h4>
                      </div>
                      <p className="text-xs text-stone-700 leading-relaxed">
                        Calatheas, ferns, and peace lilies transpire rapidly. Group them together on a tray filled with pebbles and water (ensuring pots sit above water) to elevate local humidity by up to 20%.
                      </p>
                    </div>

                    {/* Drought-Tolerant Advice */}
                    <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-xl space-y-2">
                      <div className="flex items-center gap-2">
                        <Sun className="w-4 h-4 text-amber-700" />
                        <h4 className="font-bold text-xs text-amber-950 uppercase tracking-wider">
                          Drought-Tolerant Plants ({vacationSummary.droughtTolerantCount})
                        </h4>
                      </div>
                      <p className="text-xs text-stone-700 leading-relaxed">
                        Snake plants, ZZ plants, and succulents store water in their fleshy foliage. They survive easily without care for 2–3 weeks. Never over-soak them before leaving.
                      </p>
                    </div>
                  </div>

                  {/* General Golden Rules */}
                  <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-2">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-700" />
                      <h4 className="font-bold text-xs text-stone-900 uppercase tracking-wider">
                        Household Environment Guidelines
                      </h4>
                    </div>
                    <ul className="space-y-1.5 text-xs text-stone-700">
                      {vacationSummary.generalTips.map((tip, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Section F: Modal Footer Actions */}
        <div className="px-5 py-4 border-t border-stone-200/80 bg-stone-50/80 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-stone-500 text-center sm:text-left">
            {currentlyActive ? (
              <span>Vacation Mode is currently active until {formatDatePretty(returnDate)}.</span>
            ) : (
              <span>Care intervals and reminders remain intact during your absence.</span>
            )}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            {currentlyActive && onDeactivate && (
              <button
                type="button"
                onClick={() => {
                  onDeactivate();
                  onClose();
                }}
                className="px-3.5 py-2 text-xs font-semibold text-rose-700 hover:text-rose-800 bg-white hover:bg-rose-50 border border-rose-200 rounded-xl transition-colors shadow-2xs"
              >
                Deactivate Vacation Mode
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-stone-700 hover:text-stone-900 hover:bg-stone-200/60 rounded-xl transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleActivateSubmit}
              disabled={!isDateOrderValid}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-semibold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Palmtree className="w-4 h-4 text-emerald-200" />
              <span>{currentlyActive ? 'Update Vacation Dates' : 'Activate Vacation Mode'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
