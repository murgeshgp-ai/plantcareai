import React, { useState, useEffect } from 'react';
import { Sprout, RotateCcw, Palmtree, CheckCircle2, PowerOff } from 'lucide-react';

import { Plant, CareType } from './types/plant';
import { GrowthRecord } from './types/growth';
import { HealthAssessment } from './types/health';
import { UnlockedAchievement, UserActivityStats, AchievementWithProgress } from './types/achievement';
import { VacationConfig } from './types/vacation';

import { INITIAL_PLANTS } from './data/samplePlants';
import { INITIAL_GROWTH_RECORDS } from './data/sampleGrowthRecords';

import { Navbar, ActiveTab } from './components/Navbar';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Toast } from './components/Toast';
import { Dashboard } from './components/dashboard/Dashboard';
import { AddPlant } from './components/plants/AddPlant';
import { PlantDetailModal } from './components/plants/PlantDetailModal';
import { DEFAULT_PLANT_PHOTOS } from './components/plants/PlantIllustration';
import { GrowthTracker } from './components/growth/GrowthTracker';
import { CareSchedule } from './components/reminders/CareSchedule';
import { Reminders } from './components/reminders/Reminders';
import { HealthAssessmentModal } from './components/health/HealthAssessmentModal';
import { PlantDiagnosisModal } from './components/health/PlantDiagnosisModal';
import { PlantAssistantModal } from './components/assistant/PlantAssistantModal';
import { VacationModeModal } from './components/vacation/VacationModeModal';
import { AchievementsModal } from './components/achievements/AchievementsModal';
import { AchievementToast } from './components/achievements/AchievementToast';

import { getTodayString, addDays, getDaysDifference, formatDatePretty } from './utils/dateUtils';
import { loadAllGrowthRecords, saveAllGrowthRecords } from './utils/growthStorage';
import { loadAllHealthAssessments, saveAllHealthAssessments, getLatestAssessmentForPlant } from './utils/healthStorage';
import {
  loadUnlockedAchievements,
  saveUnlockedAchievements,
  loadUserActivityStats,
  saveUserActivityStats,
} from './utils/achievementStorage';
import {
  evaluateAchievements,
  recordCareAction,
  recordPlantAdded,
  recordGrowthRecordAdded,
  recordVacationActivated,
} from './utils/achievementEvaluator';
import {
  isVacationActive,
  isVacationExpired,
  calculateVacationDuration,
  calculateVacationSummary,
} from './utils/vacationUtils';

const STORAGE_KEY = 'sproutcare_plants_data_v1';
const VACATION_STORAGE_KEY = 'sproutcare_vacation_config_v1';

export default function App() {
  const [plants, setPlants] = useState<Plant[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: Plant[] = JSON.parse(stored);
        const hydrated = parsed.map((p) => {
          // Ensure sample Calathea Orbifolia (plant-6) uses the genuine botanical photo if previously cached with outdated manicure URL
          if (p.id === 'plant-6' && (p.imageUrl?.includes('1607779097040') || !p.imageUrl?.includes('calathea.jpg'))) {
            return { ...p, imageUrl: '/images/plants/calathea.jpg' };
          }
          // Ensure sample Snake Plant (plant-3) uses the verified snake photo if previously pointing to deleted URL
          if (p.id === 'plant-3' && (p.imageUrl?.includes('1593482892290') || !p.imageUrl?.includes('snake.jpg'))) {
            return { ...p, imageUrl: '/images/plants/snake.jpg' };
          }
          if (!p.imageUrl && DEFAULT_PLANT_PHOTOS[p.illustrationType]) {
            return { ...p, imageUrl: DEFAULT_PLANT_PHOTOS[p.illustrationType] };
          }
          return p;
        });

        // Ensure 7th plant (Jade Plant) exists if user had old 6-plant sample set
        const hasPlant7 = hydrated.some((p) => p.id === 'plant-7');
        if (!hasPlant7 && INITIAL_PLANTS.length >= 7) {
          const plant7 = INITIAL_PLANTS.find((p) => p.id === 'plant-7');
          if (plant7) hydrated.push(plant7);
        }

        return hydrated;
      }
    } catch (e) {
      console.error('Failed to load plants from storage', e);
    }
    return INITIAL_PLANTS;
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [assessingPlant, setAssessingPlant] = useState<Plant | null>(null);
  const [diagnosingPlant, setDiagnosingPlant] = useState<Plant | null>(null);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Vacation Mode state with persistent storage
  const [vacationConfig, setVacationConfig] = useState<VacationConfig | null>(() => {
    try {
      const stored = localStorage.getItem(VACATION_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object' && typeof parsed.isActive === 'boolean') {
          return parsed as VacationConfig;
        }
      }
    } catch (e) {
      console.error('Failed to load vacation config from storage', e);
    }
    return null;
  });

  const [isVacationModalOpen, setIsVacationModalOpen] = useState(false);

  // Growth tracker records state with persistent storage
  const [growthRecords, setGrowthRecords] = useState<GrowthRecord[]>(() => loadAllGrowthRecords());
  const [selectedGrowthPlantId, setSelectedGrowthPlantId] = useState<string | undefined>(undefined);

  // Health assessment records state with persistent storage
  const [healthAssessments, setHealthAssessments] = useState<HealthAssessment[]>(() => loadAllHealthAssessments());

  // Sync plants to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(plants));
    } catch (e) {
      console.error('Failed to save plants to storage', e);
    }
  }, [plants]);

  // Sync growth records to local storage
  useEffect(() => {
    saveAllGrowthRecords(growthRecords);
  }, [growthRecords]);

  // Sync health assessments to local storage
  useEffect(() => {
    saveAllHealthAssessments(healthAssessments);
  }, [healthAssessments]);

  // Achievements & Badges state with persistent storage
  const [unlockedAchievements, setUnlockedAchievements] = useState<Record<string, UnlockedAchievement>>(() => loadUnlockedAchievements());
  const [userStats, setUserStats] = useState<UserActivityStats>(() => loadUserActivityStats());
  const [isAchievementsModalOpen, setIsAchievementsModalOpen] = useState(false);
  const [toastQueue, setToastQueue] = useState<AchievementWithProgress[]>([]);
  const [activeAchievementToast, setActiveAchievementToast] = useState<AchievementWithProgress | null>(null);

  // Sync unlocked achievements to local storage
  useEffect(() => {
    saveUnlockedAchievements(unlockedAchievements);
  }, [unlockedAchievements]);

  // Sync user activity stats to local storage
  useEffect(() => {
    saveUserActivityStats(userStats);
  }, [userStats]);

  // Process toast queue sequentially so multiple unlocked badges are not missed
  useEffect(() => {
    if (!activeAchievementToast && toastQueue.length > 0) {
      const nextBadge = toastQueue[0];
      setActiveAchievementToast(nextBadge);
      setToastQueue((prev) => prev.slice(1));
    }
  }, [activeAchievementToast, toastQueue]);

  // Evaluate achievements with real user stats
  const currentAchievements = React.useMemo(() => {
    return evaluateAchievements(userStats, plants, growthRecords, unlockedAchievements).achievementsWithProgress;
  }, [userStats, plants, growthRecords, unlockedAchievements]);

  const unlockedAchievementsCount = React.useMemo(() => {
    return currentAchievements.filter((a) => a.isUnlocked).length;
  }, [currentAchievements]);

  // Central trigger to record user actions and evaluate achievements
  const triggerAchievementEvaluation = (
    nextStats: UserActivityStats,
    currentPlants: Plant[] = plants,
    currentGrowth: GrowthRecord[] = growthRecords
  ) => {
    setUserStats(nextStats);

    const evalResult = evaluateAchievements(
      nextStats,
      currentPlants,
      currentGrowth,
      unlockedAchievements
    );

    if (evalResult.newlyUnlocked.length > 0) {
      setUnlockedAchievements(evalResult.updatedUnlocked);
      setToastQueue((prev) => [...prev, ...evalResult.newlyUnlocked]);
    }
  };

  // Compute urgent reminders count (overdue + due today tasks)
  const urgentRemindersCount = plants.reduce((count, plant) => {
    const today = getTodayString();
    let urgentForPlant = 0;

    // Water
    const nextWater = plant.snoozedWaterUntil || addDays(plant.lastWatered, plant.wateringFrequencyDays);
    if (getDaysDifference(nextWater, today) <= 0) urgentForPlant++;

    // Fertilize
    const nextFertilize = plant.snoozedFertilizeUntil || addDays(plant.lastFertilized, plant.fertilizingFrequencyDays);
    if (getDaysDifference(nextFertilize, today) <= 0) urgentForPlant++;

    // Prune
    const nextPrune = plant.snoozedPruneUntil || addDays(plant.lastPruned, plant.pruningFrequencyDays);
    if (getDaysDifference(nextPrune, today) <= 0) urgentForPlant++;

    return count + urgentForPlant;
  }, 0);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 3200);
  };

  const handleLogCare = (plantId: string, careType: CareType) => {
    const today = getTodayString();
    let updatedPlantName = '';

    setPlants((prevPlants) =>
      prevPlants.map((plant) => {
        if (plant.id !== plantId) return plant;
        updatedPlantName = plant.name;

        const updated: Plant = { ...plant };
        if (careType === 'water') {
          updated.lastWatered = today;
          delete updated.snoozedWaterUntil;
          // If plant was needing attention due to water, restore healthy
          if (updated.health === 'needs-attention') {
            updated.health = 'healthy';
          }
        } else if (careType === 'fertilize') {
          updated.lastFertilized = today;
          delete updated.snoozedFertilizeUntil;
        } else if (careType === 'prune') {
          updated.lastPruned = today;
          delete updated.snoozedPruneUntil;
        }
        return updated;
      })
    );

    // Keep selectedPlant in sync if opened in modal
    if (selectedPlant && selectedPlant.id === plantId) {
      setSelectedPlant((prev) => {
        if (!prev) return null;
        const copy = { ...prev };
        if (careType === 'water') {
          copy.lastWatered = today;
          delete copy.snoozedWaterUntil;
        } else if (careType === 'fertilize') {
          copy.lastFertilized = today;
          delete copy.snoozedFertilizeUntil;
        } else if (careType === 'prune') {
          copy.lastPruned = today;
          delete copy.snoozedPruneUntil;
        }
        return copy;
      });
    }

    const verbs: Record<CareType, string> = {
      water: 'watered',
      fertilize: 'fertilized',
      prune: 'pruned',
    };
    showToast(`Marked ${updatedPlantName || 'plant'} as ${verbs[careType]}!`);

    // Record care action and evaluate achievements
    const nextStats = recordCareAction(userStats, careType, today);
    triggerAchievementEvaluation(nextStats);
  };

  const handleSnoozeCare = (plantId: string, careType: CareType, days: number) => {
    const today = getTodayString();
    let success = false;

    setPlants((prevPlants) => {
      let matched = false;
      const next = prevPlants.map((plant) => {
        if (plant.id !== plantId) return plant;
        matched = true;

        const copy: Plant = { ...plant };
        if (careType === 'water') {
          const currentDue = copy.snoozedWaterUntil || addDays(copy.lastWatered, copy.wateringFrequencyDays);
          const isOverdue = getDaysDifference(currentDue, today) < 0;
          const baseDate = isOverdue ? today : currentDue;
          copy.snoozedWaterUntil = addDays(baseDate, days);
        } else if (careType === 'fertilize') {
          const currentDue = copy.snoozedFertilizeUntil || addDays(copy.lastFertilized, copy.fertilizingFrequencyDays);
          const isOverdue = getDaysDifference(currentDue, today) < 0;
          const baseDate = isOverdue ? today : currentDue;
          copy.snoozedFertilizeUntil = addDays(baseDate, days);
        } else if (careType === 'prune') {
          const currentDue = copy.snoozedPruneUntil || addDays(copy.lastPruned, copy.pruningFrequencyDays);
          const isOverdue = getDaysDifference(currentDue, today) < 0;
          const baseDate = isOverdue ? today : currentDue;
          copy.snoozedPruneUntil = addDays(baseDate, days);
        }
        return copy;
      });

      if (matched) {
        success = true;
        return next;
      }
      return prevPlants;
    });

    if (selectedPlant && selectedPlant.id === plantId) {
      setSelectedPlant((prev) => {
        if (!prev) return null;
        const copy = { ...prev };
        if (careType === 'water') {
          const currentDue = copy.snoozedWaterUntil || addDays(copy.lastWatered, copy.wateringFrequencyDays);
          const isOverdue = getDaysDifference(currentDue, today) < 0;
          const baseDate = isOverdue ? today : currentDue;
          copy.snoozedWaterUntil = addDays(baseDate, days);
        } else if (careType === 'fertilize') {
          const currentDue = copy.snoozedFertilizeUntil || addDays(copy.lastFertilized, copy.fertilizingFrequencyDays);
          const isOverdue = getDaysDifference(currentDue, today) < 0;
          const baseDate = isOverdue ? today : currentDue;
          copy.snoozedFertilizeUntil = addDays(baseDate, days);
        } else if (careType === 'prune') {
          const currentDue = copy.snoozedPruneUntil || addDays(copy.lastPruned, copy.pruningFrequencyDays);
          const isOverdue = getDaysDifference(currentDue, today) < 0;
          const baseDate = isOverdue ? today : currentDue;
          copy.snoozedPruneUntil = addDays(baseDate, days);
        }
        return copy;
      });
    }

    if (success) {
      showToast(`Snoozed task by ${days} day.`);
    }
  };

  const handleAddPlant = (newPlant: Plant) => {
    const nextPlants = [newPlant, ...plants];
    setPlants(nextPlants);
    setActiveTab('dashboard');
    showToast(`Added ${newPlant.name} to your collection!`);

    // Record custom plant addition and evaluate achievements
    const nextStats = recordPlantAdded(userStats, newPlant.id);
    triggerAchievementEvaluation(nextStats, nextPlants, growthRecords);
  };

  const handleDeletePlant = (plantId: string) => {
    setPlants((prev) => prev.filter((p) => p.id !== plantId));
    setGrowthRecords((prev) => prev.filter((r) => r.plantId !== plantId));
    setHealthAssessments((prev) => prev.filter((a) => a.plantId !== plantId));
    showToast('Plant removed from collection.');
  };

  const handleResetSampleData = () => {
    setPlants(INITIAL_PLANTS);
    setGrowthRecords(INITIAL_GROWTH_RECORDS);
    setHealthAssessments([]);
    showToast('Reset sample plant collection, growth & health records.');
  };

  const handleOpenGrowthTracker = (plant: Plant) => {
    setSelectedGrowthPlantId(plant.id);
    setActiveTab('growth');
  };

  const handleAddGrowthRecord = (data: Omit<GrowthRecord, 'id' | 'createdAt'>) => {
    const newRecord: GrowthRecord = {
      ...data,
      id: `growth-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
    };
    const nextRecords = [...growthRecords, newRecord];
    setGrowthRecords(nextRecords);
    showToast('Growth record saved successfully!');

    // Record genuine growth measurement and evaluate achievements
    const nextStats = recordGrowthRecordAdded(userStats, newRecord.id, Boolean(newRecord.photoUrl));
    triggerAchievementEvaluation(nextStats, plants, nextRecords);
  };

  const handleUpdateGrowthRecord = (updatedRecord: GrowthRecord) => {
    setGrowthRecords((prev) =>
      prev.map((r) => (r.id === updatedRecord.id ? updatedRecord : r))
    );
    showToast('Growth record updated successfully!');
  };

  const handleDeleteGrowthRecord = (recordId: string) => {
    setGrowthRecords((prev) => prev.filter((r) => r.id !== recordId));
    showToast('Growth record deleted.');
  };

  const handleSaveHealthAssessment = (data: Omit<HealthAssessment, 'id' | 'createdAt'>) => {
    const newAssessment: HealthAssessment = {
      ...data,
      id: `health-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
    };
    
    setHealthAssessments((prev) => [newAssessment, ...prev]);

    // Update the plant's health category in collection state
    setPlants((prev) =>
      prev.map((p) => {
        if (p.id !== data.plantId) return p;
        const isNeedsAttention = data.score < 50 || data.leafCondition === 'wilting' || data.pestCondition === 'visible-pests';
        const isThriving = data.score >= 90;
        return {
          ...p,
          health: isNeedsAttention ? 'needs-attention' : isThriving ? 'thriving' : 'healthy',
        };
      })
    );

    const targetPlantName = plants.find((p) => p.id === data.plantId)?.name || 'Plant';
    showToast(`Health assessment recorded for ${targetPlantName}!`);
  };

  // Check auto-expiry of vacation mode on startup
  useEffect(() => {
    const today = getTodayString();
    if (vacationConfig && vacationConfig.isActive && isVacationExpired(vacationConfig, today)) {
      const expiredConfig: VacationConfig = {
        ...vacationConfig,
        isActive: false,
      };
      setVacationConfig(expiredConfig);
      try {
        localStorage.setItem(VACATION_STORAGE_KEY, JSON.stringify(expiredConfig));
      } catch (e) {
        console.error('Failed to update expired vacation config', e);
      }

      const welcomeKey = `sproutcare_welcome_back_shown_${vacationConfig.returnDate}`;
      if (!sessionStorage.getItem(welcomeKey)) {
        showToast('Welcome back! Vacation Mode has concluded. Your care schedule is ready.');
        sessionStorage.setItem(welcomeKey, 'true');
      }
    }
  }, []);

  const handleActivateVacation = (newConfig: VacationConfig) => {
    setVacationConfig(newConfig);
    try {
      localStorage.setItem(VACATION_STORAGE_KEY, JSON.stringify(newConfig));
    } catch (e) {
      console.error('Failed to save vacation config', e);
    }
    showToast(`Vacation Mode activated until ${formatDatePretty(newConfig.returnDate)}!`);

    // Record vacation activation for achievements
    const nextStats = recordVacationActivated(userStats);
    triggerAchievementEvaluation(nextStats, plants, growthRecords);
  };

  const handleDeactivateVacation = () => {
    if (!vacationConfig) return;
    const deactivated: VacationConfig = {
      ...vacationConfig,
      isActive: false,
    };
    setVacationConfig(deactivated);
    try {
      localStorage.setItem(VACATION_STORAGE_KEY, JSON.stringify(deactivated));
    } catch (e) {
      console.error('Failed to save deactivated vacation config', e);
    }
    showToast('Vacation Mode deactivated.');
  };

  const isVacationModeActive = Boolean(vacationConfig && isVacationActive(vacationConfig));

  // Compute number of unique plants needing care during vacation
  const vacationAbsentPlantsCount = React.useMemo(() => {
    if (!isVacationModeActive || !vacationConfig) return 0;
    const summary = calculateVacationSummary(plants, vacationConfig);
    const plantIds = new Set(summary.tasksDuringAbsence.map((t) => t.plantId));
    return plantIds.size;
  }, [plants, vacationConfig, isVacationModeActive]);

  return (
    <div className="min-h-screen flex flex-col bg-stone-50/50 text-stone-800">
      {/* Navigation */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        urgentRemindersCount={urgentRemindersCount}
        onOpenAssistant={() => setIsAssistantOpen(true)}
        isVacationActive={isVacationModeActive}
        onOpenVacationMode={() => setIsVacationModalOpen(true)}
        unlockedAchievementsCount={unlockedAchievementsCount}
        totalAchievementsCount={currentAchievements.length}
        onOpenAchievements={() => setIsAchievementsModalOpen(true)}
      />

      {/* Main Viewport Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 pb-28 md:pb-16">
        {/* Active Vacation Banner */}
        {isVacationModeActive && vacationConfig && (
          <div className="mb-6 sm:mb-8 p-4 sm:p-5 bg-gradient-to-r from-amber-50/90 via-emerald-50/70 to-emerald-50/90 border border-amber-200/90 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in duration-200">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-200/80 flex items-center justify-center text-amber-800 shrink-0 shadow-2xs">
                <Palmtree className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-sm sm:text-base text-stone-900 font-display">
                    Vacation Mode Active
                  </span>
                  <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-amber-100 text-amber-900 border border-amber-200/80">
                    {formatDatePretty(vacationConfig.departureDate)} – {formatDatePretty(vacationConfig.returnDate)}
                  </span>
                </div>
                <p className="text-xs text-stone-600 mt-0.5">
                  <strong>{calculateVacationDuration(vacationConfig.departureDate, vacationConfig.returnDate)} days</strong> away ·{' '}
                  <strong className="text-emerald-900 font-semibold">{vacationAbsentPlantsCount}</strong> {vacationAbsentPlantsCount === 1 ? 'plant' : 'plants'} scheduled for care during your absence.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0">
              <button
                type="button"
                onClick={() => setIsVacationModalOpen(true)}
                className="px-3.5 py-2 text-xs font-semibold text-emerald-900 bg-white hover:bg-emerald-50 border border-emerald-300 rounded-xl shadow-2xs transition-colors flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                <span>View Prep Checklist</span>
              </button>
              <button
                type="button"
                onClick={handleDeactivateVacation}
                className="px-3.5 py-2 text-xs font-semibold text-stone-700 hover:text-stone-900 bg-white/80 hover:bg-white border border-stone-200 rounded-xl shadow-2xs transition-colors flex items-center gap-1.5"
              >
                <PowerOff className="w-3.5 h-3.5 text-stone-500" />
                <span>End Vacation</span>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <Dashboard
            plants={plants}
            onLogCare={handleLogCare}
            onOpenPlantDetail={setSelectedPlant}
            onNavigateToAddPlant={() => setActiveTab('add-plant')}
            onOpenGrowthTracker={handleOpenGrowthTracker}
            allAssessments={healthAssessments}
            allGrowthRecords={growthRecords}
            onOpenHealthAssessment={setAssessingPlant}
            onOpenDiagnosis={setDiagnosingPlant}
            achievements={currentAchievements}
            onOpenAchievements={() => setIsAchievementsModalOpen(true)}
          />
        )}

        {activeTab === 'growth' && (
          <GrowthTracker
            plants={plants}
            selectedPlantId={selectedGrowthPlantId || plants[0]?.id}
            onSelectPlantId={setSelectedGrowthPlantId}
            growthRecords={growthRecords}
            onAddGrowthRecord={handleAddGrowthRecord}
            onUpdateGrowthRecord={handleUpdateGrowthRecord}
            onDeleteGrowthRecord={handleDeleteGrowthRecord}
            onNavigateToDashboard={() => setActiveTab('dashboard')}
          />
        )}

        {activeTab === 'add-plant' && (
          <AddPlant
            onAddPlant={handleAddPlant}
            onCancel={() => setActiveTab('dashboard')}
          />
        )}

        {activeTab === 'schedule' && (
          <CareSchedule
            plants={plants}
            onLogCare={handleLogCare}
            onOpenPlantDetail={setSelectedPlant}
          />
        )}

        {activeTab === 'reminders' && (
          <Reminders
            plants={plants}
            onLogCare={handleLogCare}
            onSnoozeCare={handleSnoozeCare}
            onOpenPlantDetail={setSelectedPlant}
          />
        )}
      </main>

      {/* Plant Detail Modal */}
      <PlantDetailModal
        plant={selectedPlant}
        onClose={() => setSelectedPlant(null)}
        onLogCare={handleLogCare}
        onDeletePlant={handleDeletePlant}
        onOpenGrowthTracker={handleOpenGrowthTracker}
        allAssessments={healthAssessments}
        allGrowthRecords={growthRecords}
        onOpenHealthAssessment={setAssessingPlant}
        onOpenDiagnosis={setDiagnosingPlant}
      />

      {/* Health Assessment Observation Modal */}
      <HealthAssessmentModal
        plant={assessingPlant}
        latestAssessment={assessingPlant ? getLatestAssessmentForPlant(healthAssessments, assessingPlant.id) : null}
        isOpen={Boolean(assessingPlant)}
        onClose={() => setAssessingPlant(null)}
        onSaveAssessment={handleSaveHealthAssessment}
      />

      {/* AI Plant Care Assistant Modal */}
      <PlantAssistantModal
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        plants={plants}
        allAssessments={healthAssessments}
      />

      {/* AI Plant Disease Diagnosis Modal */}
      <PlantDiagnosisModal
        plant={diagnosingPlant}
        isOpen={Boolean(diagnosingPlant)}
        onClose={() => setDiagnosingPlant(null)}
        plants={plants}
        onApplyHealthAssessment={handleSaveHealthAssessment}
      />

      {/* Vacation Mode Modal */}
      <ErrorBoundary fallbackTitle="Vacation Mode" onReset={() => setIsVacationModalOpen(false)}>
        {isVacationModalOpen && (
          <VacationModeModal
            isOpen={isVacationModalOpen}
            onClose={() => setIsVacationModalOpen(false)}
            plants={plants}
            vacationConfig={vacationConfig}
            onActivate={handleActivateVacation}
            onDeactivate={handleDeactivateVacation}
          />
        )}
      </ErrorBoundary>

      {/* Achievements & Badges Modal */}
      <ErrorBoundary fallbackTitle="Achievements & Badges" onReset={() => setIsAchievementsModalOpen(false)}>
        {isAchievementsModalOpen && (
          <AchievementsModal
            isOpen={isAchievementsModalOpen}
            onClose={() => setIsAchievementsModalOpen(false)}
            achievements={currentAchievements}
          />
        )}
      </ErrorBoundary>

      {/* Achievement Celebratory Toast */}
      <AchievementToast
        achievement={activeAchievementToast}
        onClose={() => setActiveAchievementToast(null)}
      />

      {/* Feedback Toast */}
      <Toast
        message={toastMessage}
        onClose={() => setToastMessage(null)}
      />

      {/* Peaceful Minimalist Footer */}
      <footer className="border-t border-stone-200/80 bg-white py-6 px-4 sm:px-6 lg:px-8 text-xs text-stone-500 hidden md:block">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sprout className="w-4 h-4 text-emerald-700" />
            <span className="font-semibold text-emerald-950 font-display">SproutCare</span>
            <span className="text-stone-300">·</span>
            <span>Peaceful Plant Care & Routine Reminder</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleResetSampleData}
              className="hover:text-emerald-800 transition-colors flex items-center gap-1 text-stone-400 hover:text-stone-600"
              title="Reset to default sample plants"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Sample Plants</span>
            </button>
            <span className="text-stone-300">·</span>
            <span>Natural growth, on your rhythm</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
