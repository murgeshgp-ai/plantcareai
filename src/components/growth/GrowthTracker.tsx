import React, { useState } from 'react';
import { Plant } from '../../types/plant';
import { GrowthRecord } from '../../types/growth';
import { getGrowthRecordsForPlant, calculateGrowthStatistics } from '../../utils/growthStorage';
import { formatDatePretty } from '../../utils/dateUtils';
import { GrowthChart } from './GrowthChart';
import { GrowthRecordFormModal } from './GrowthRecordFormModal';
import { PlantIllustration } from '../plants/PlantIllustration';
import {
  TrendingUp,
  Ruler,
  Leaf,
  Calendar,
  Plus,
  Pencil,
  Trash2,
  Info,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Sparkles,
  MapPin,
  ExternalLink,
} from 'lucide-react';

interface GrowthTrackerProps {
  plants: Plant[];
  selectedPlantId?: string;
  onSelectPlantId: (plantId: string) => void;
  growthRecords: GrowthRecord[];
  onAddGrowthRecord: (recordData: Omit<GrowthRecord, 'id' | 'createdAt'>) => void;
  onUpdateGrowthRecord: (record: GrowthRecord) => void;
  onDeleteGrowthRecord: (recordId: string) => void;
  onNavigateToDashboard?: () => void;
}

export const GrowthTracker: React.FC<GrowthTrackerProps> = ({
  plants,
  selectedPlantId,
  onSelectPlantId,
  growthRecords,
  onAddGrowthRecord,
  onUpdateGrowthRecord,
  onDeleteGrowthRecord,
  onNavigateToDashboard,
}) => {
  // Determine currently active plant
  const currentPlant = plants.find((p) => p.id === selectedPlantId) || plants[0] || null;

  // Form modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<GrowthRecord | null>(null);
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  if (!currentPlant) {
    return (
      <div className="bg-white rounded-2xl border border-stone-200/80 p-12 text-center max-w-md mx-auto my-12 shadow-xs">
        <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto mb-3">
          <TrendingUp className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-stone-900 font-display">No Plants in Collection</h3>
        <p className="text-xs text-stone-500 mt-1 mb-5">
          Add plants to your collection first to start tracking height, leaves, and milestones.
        </p>
        {onNavigateToDashboard && (
          <button
            onClick={onNavigateToDashboard}
            className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs"
          >
            Go to Dashboard
          </button>
        )}
      </div>
    );
  }

  // Chronologically sorted records (oldest to newest)
  const plantRecords = getGrowthRecordsForPlant(growthRecords, currentPlant.id);
  const stats = calculateGrowthStatistics(plantRecords);

  const handleOpenAddModal = () => {
    setEditingRecord(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (record: GrowthRecord) => {
    setEditingRecord(record);
    setIsModalOpen(true);
  };

  const handleSaveRecord = (
    data: Omit<GrowthRecord, 'id' | 'createdAt'>,
    existingId?: string
  ) => {
    if (existingId) {
      const original = growthRecords.find((r) => r.id === existingId);
      if (original) {
        onUpdateGrowthRecord({
          ...original,
          ...data,
          updatedAt: new Date().toISOString(),
        });
      }
    } else {
      onAddGrowthRecord(data);
    }
  };

  const handleDeleteClick = (id: string) => {
    if (deleteConfirmId === id) {
      onDeleteGrowthRecord(id);
      setDeleteConfirmId(null);
    } else {
      setDeleteConfirmId(id);
      setTimeout(() => {
        setDeleteConfirmId((curr) => (curr === id ? null : curr));
      }, 4000);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-150">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-stone-200/80 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-100/70 text-emerald-900 text-xs font-medium mb-2">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-700" />
            <span>Growth Tracker</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-emerald-950 font-display">
            Plant Growth Tracker
          </h1>
          <p className="mt-1 text-sm text-stone-600 max-w-xl">
            Monitor height progress, leaf development, and photographic milestones across your collection.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 rounded-lg shadow-xs transition-colors whitespace-nowrap self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Record Growth</span>
        </button>
      </div>

      {/* Plant Selector Bar */}
      <div className="bg-white rounded-xl border border-stone-200/80 p-3 shadow-xs">
        <div className="flex items-center justify-between gap-2 px-2 pb-2 border-b border-stone-100 text-xs font-medium text-stone-500">
          <span>Select Plant to Track:</span>
          <span className="font-mono text-[11px] text-stone-400">
            {plants.length} {plants.length === 1 ? 'plant' : 'plants'}
          </span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pt-2 pb-1 no-scrollbar">
          {plants.map((plant) => {
            const isSelected = plant.id === currentPlant.id;
            const count = growthRecords.filter((r) => r.plantId === plant.id).length;
            return (
              <button
                key={plant.id}
                onClick={() => onSelectPlantId(plant.id)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all shrink-0 border ${
                  isSelected
                    ? 'bg-emerald-50 border-emerald-600/60 shadow-xs'
                    : 'bg-stone-50/70 hover:bg-stone-100 border-stone-200/70'
                }`}
              >
                <div className="w-8 h-8 rounded-md overflow-hidden bg-stone-100 shrink-0 border border-stone-200/60">
                  <PlantIllustration
                    type={plant.illustrationType}
                    imageUrl={plant.imageUrl}
                    className="w-full h-full object-cover"
                    alt={plant.name}
                  />
                </div>
                <div className="min-w-0">
                  <div className={`text-xs font-semibold truncate ${isSelected ? 'text-emerald-950' : 'text-stone-800'}`}>
                    {plant.name}
                  </div>
                  <div className="text-[10px] text-stone-500 flex items-center gap-1 font-mono">
                    <span>{count} {count === 1 ? 'record' : 'records'}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Plant Profile Banner */}
      <div className="bg-white rounded-xl border border-stone-200/80 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-stone-200 shrink-0 shadow-xs">
            <PlantIllustration
              type={currentPlant.illustrationType}
              imageUrl={currentPlant.imageUrl}
              className="w-full h-full object-cover"
              alt={currentPlant.name}
            />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-stone-900 font-display">
                {currentPlant.name}
              </h2>
              <span className="text-xs bg-stone-100 text-stone-700 px-2 py-0.5 rounded-md border border-stone-200 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-emerald-700" />
                <span>{currentPlant.room}</span>
              </span>
            </div>
            {currentPlant.species && (
              <p className="text-xs italic text-stone-500 mt-0.5">
                {currentPlant.species}
              </p>
            )}
            <div className="mt-2 text-xs text-stone-500 flex items-center gap-2 font-mono">
              <span>Light: {currentPlant.light}</span>
              <span className="text-stone-300">·</span>
              <span>Water every {currentPlant.wateringFrequencyDays}d</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenAddModal}
            className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Record New Measurement</span>
          </button>
        </div>
      </div>

      {/* Growth Statistics Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-stone-900 uppercase tracking-wider">
            Growth Statistics
          </h3>
          {plantRecords.length > 0 && (
            <span className="text-xs font-mono text-stone-500">
              Tracking since {formatDatePretty(plantRecords[0].date)}
            </span>
          )}
        </div>

        {!stats.hasEnoughData && (
          <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-900 flex items-start gap-3">
            <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-semibold block">Insufficient Growth Data</span>
              <p className="text-amber-800 leading-relaxed">
                {stats.message}
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* 1. Current Recorded Height */}
          <div className="p-4 bg-white rounded-xl border border-stone-200/80 shadow-xs flex flex-col justify-between">
            <div className="text-[11px] font-medium text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
              <Ruler className="w-3.5 h-3.5 text-emerald-700" />
              <span>Current Height</span>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold font-mono tabular-nums text-emerald-950">
                {stats.currentHeight !== null ? `${stats.currentHeight} cm` : '—'}
              </div>
              <div className="text-[11px] text-stone-400 mt-0.5">
                {plantRecords.length > 0 ? formatDatePretty(plantRecords[plantRecords.length - 1].date) : 'No data'}
              </div>
            </div>
          </div>

          {/* 2. Previous Recorded Height */}
          <div className="p-4 bg-white rounded-xl border border-stone-200/80 shadow-xs flex flex-col justify-between">
            <div className="text-[11px] font-medium text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-stone-500" />
              <span>Previous Height</span>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold font-mono tabular-nums text-stone-800">
                {stats.previousHeight !== null ? `${stats.previousHeight} cm` : '—'}
              </div>
              <div className="text-[11px] text-stone-400 mt-0.5">
                {plantRecords.length >= 2 ? formatDatePretty(plantRecords[plantRecords.length - 2].date) : 'Requires 2 records'}
              </div>
            </div>
          </div>

          {/* 3. Total Height Increase */}
          <div className="p-4 bg-white rounded-xl border border-stone-200/80 shadow-xs flex flex-col justify-between">
            <div className="text-[11px] font-medium text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-700" />
              <span>Total Growth</span>
            </div>
            <div className="mt-2">
              <div className="flex items-center gap-1.5">
                <span className={`text-2xl font-bold font-mono tabular-nums ${
                  stats.totalHeightIncrease !== null && stats.totalHeightIncrease > 0
                    ? 'text-emerald-700'
                    : stats.totalHeightIncrease !== null && stats.totalHeightIncrease < 0
                    ? 'text-red-600'
                    : 'text-stone-700'
                }`}>
                  {stats.totalHeightIncrease !== null
                    ? `${stats.totalHeightIncrease > 0 ? '+' : ''}${stats.totalHeightIncrease} cm`
                    : '—'}
                </span>
                {stats.totalHeightIncrease !== null && stats.totalHeightIncrease > 0 && (
                  <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                )}
                {stats.totalHeightIncrease !== null && stats.totalHeightIncrease < 0 && (
                  <ArrowDownRight className="w-4 h-4 text-red-600" />
                )}
              </div>
              <div className="text-[11px] text-stone-400 mt-0.5">
                {stats.totalHeightIncrease !== null ? 'Since initial baseline' : 'Requires 2 records'}
              </div>
            </div>
          </div>

          {/* 4. Current Leaf Count */}
          <div className="p-4 bg-white rounded-xl border border-stone-200/80 shadow-xs flex flex-col justify-between">
            <div className="text-[11px] font-medium text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
              <Leaf className="w-3.5 h-3.5 text-emerald-700" />
              <span>Current Leaves</span>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold font-mono tabular-nums text-emerald-950">
                {stats.currentLeafCount !== null ? `${stats.currentLeafCount}` : '—'}
              </div>
              <div className="text-[11px] text-stone-400 mt-0.5">
                {stats.currentLeafCount !== null ? 'Total active leaves' : 'No data'}
              </div>
            </div>
          </div>

          {/* 5. Total Leaf Count Change */}
          <div className="p-4 bg-white rounded-xl border border-stone-200/80 shadow-xs flex flex-col justify-between col-span-2 sm:col-span-1">
            <div className="text-[11px] font-medium text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
              <span>Leaf Change</span>
            </div>
            <div className="mt-2">
              <div className="flex items-center gap-1.5">
                <span className={`text-2xl font-bold font-mono tabular-nums ${
                  stats.totalLeafCountChange !== null && stats.totalLeafCountChange > 0
                    ? 'text-emerald-700'
                    : stats.totalLeafCountChange !== null && stats.totalLeafCountChange < 0
                    ? 'text-amber-700'
                    : 'text-stone-700'
                }`}>
                  {stats.totalLeafCountChange !== null
                    ? `${stats.totalLeafCountChange > 0 ? '+' : ''}${stats.totalLeafCountChange}`
                    : '—'}
                </span>
                {stats.totalLeafCountChange !== null && stats.totalLeafCountChange > 0 && (
                  <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                )}
                {stats.totalLeafCountChange !== null && stats.totalLeafCountChange === 0 && (
                  <Minus className="w-4 h-4 text-stone-400" />
                )}
              </div>
              <div className="text-[11px] text-stone-400 mt-0.5">
                {stats.totalLeafCountChange !== null ? 'New leaves emerged' : 'Requires 2 records'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Growth Visualization (Chart) */}
      <div className="space-y-3">
        <GrowthChart records={plantRecords} plantName={currentPlant.name} />
      </div>

      {/* Growth History Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-stone-900 uppercase tracking-wider">
            Growth History ({plantRecords.length})
          </h3>
          {plantRecords.length > 0 && (
            <span className="text-xs text-stone-500">
              Sorted chronologically
            </span>
          )}
        </div>

        {plantRecords.length === 0 ? (
          <div className="bg-white rounded-xl border border-stone-200/80 p-8 text-center flex flex-col items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-stone-100 text-stone-500 flex items-center justify-center mb-2">
              <Calendar className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-stone-800">No History Records</p>
            <p className="text-xs text-stone-500 mt-1 max-w-sm">
              Tap &ldquo;Record Growth&rdquo; above to log the current height and leaf count for {currentPlant.name}.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-stone-200/80 divide-y divide-stone-100 shadow-xs overflow-hidden">
            {plantRecords.map((record, idx) => {
              const prev = idx > 0 ? plantRecords[idx - 1] : null;
              const heightDelta = prev ? Number((record.heightCm - prev.heightCm).toFixed(1)) : null;
              const leafDelta = prev ? record.leafCount - prev.leafCount : null;

              return (
                <div
                  key={record.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-stone-50/50 transition-colors"
                >
                  {/* Left: Date, measurements, and photo */}
                  <div className="flex items-start gap-4">
                    {/* Optional photo thumbnail or milestone badge */}
                    {record.photoUrl ? (
                      <button
                        type="button"
                        onClick={() => setPreviewPhotoUrl(record.photoUrl || null)}
                        className="w-14 h-14 rounded-lg overflow-hidden border border-stone-200 shrink-0 group relative cursor-pointer"
                        title="Click to view photo"
                      >
                        <img
                          src={record.photoUrl}
                          alt="Growth photo"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </div>
                      </button>
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-100 shrink-0 flex flex-col items-center justify-center font-mono">
                        <span className="text-[10px] text-emerald-600 font-semibold uppercase">Step</span>
                        <span className="text-sm font-bold">#{idx + 1}</span>
                      </div>
                    )}

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-stone-900 font-mono">
                          {formatDatePretty(record.date)}
                        </span>
                        <span className="text-xs text-stone-400 font-mono">({record.date})</span>

                        {idx === 0 && (
                          <span className="text-[10px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full font-medium">
                            Initial Baseline
                          </span>
                        )}
                      </div>

                      {/* Height & Leaves with deltas */}
                      <div className="flex items-center gap-3 text-xs text-stone-700">
                        <span className="flex items-center gap-1 font-mono font-medium">
                          <Ruler className="w-3.5 h-3.5 text-emerald-700" />
                          <span>{record.heightCm} cm</span>
                          {heightDelta !== null && (
                            <span className={`text-[11px] ${
                              heightDelta > 0 ? 'text-emerald-700 font-semibold' : heightDelta < 0 ? 'text-red-600' : 'text-stone-400'
                            }`}>
                              ({heightDelta > 0 ? `+${heightDelta}` : heightDelta} cm)
                            </span>
                          )}
                        </span>

                        <span className="text-stone-300">·</span>

                        <span className="flex items-center gap-1 font-mono font-medium">
                          <Leaf className="w-3.5 h-3.5 text-emerald-700" />
                          <span>{record.leafCount} leaves</span>
                          {leafDelta !== null && (
                            <span className={`text-[11px] ${
                              leafDelta > 0 ? 'text-emerald-700 font-semibold' : leafDelta < 0 ? 'text-amber-700' : 'text-stone-400'
                            }`}>
                              ({leafDelta > 0 ? `+${leafDelta}` : leafDelta})
                            </span>
                          )}
                        </span>
                      </div>

                      {/* Notes snippet */}
                      {record.notes && (
                        <p className="text-xs text-stone-600 italic mt-1 pt-1 border-t border-stone-100">
                          &ldquo;{record.notes}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(record)}
                      className="px-2.5 py-1.5 text-xs font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors flex items-center gap-1"
                      aria-label="Edit record"
                    >
                      <Pencil className="w-3.5 h-3.5 text-stone-500" />
                      <span>Edit</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteClick(record.id)}
                      className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1 ${
                        deleteConfirmId === record.id
                          ? 'bg-red-600 text-white hover:bg-red-700'
                          : 'text-red-600 hover:text-red-700 hover:bg-red-50'
                      }`}
                      aria-label="Delete record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{deleteConfirmId === record.id ? 'Confirm?' : 'Delete'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Record Growth Form Modal */}
      <GrowthRecordFormModal
        plant={currentPlant}
        recordToEdit={editingRecord}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveRecord}
      />

      {/* Photo Lightbox Preview Modal */}
      {previewPhotoUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreviewPhotoUrl(null)}
        >
          <div className="relative max-w-2xl max-h-[85vh] bg-stone-900 rounded-2xl overflow-hidden p-2 shadow-2xl">
            <img
              src={previewPhotoUrl}
              alt="Plant Growth Milestone"
              className="max-h-[75vh] w-auto mx-auto object-contain rounded-xl"
            />
            <div className="text-center py-2 text-xs text-stone-300">
              Click anywhere to close
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
