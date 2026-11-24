import React, { useState, useEffect } from 'react';
import { GrowthRecord } from '../../types/growth';
import { Plant } from '../../types/plant';
import { getTodayString } from '../../utils/dateUtils';
import { X, Upload, Image as ImageIcon, Trash2, Calendar, Ruler, Leaf, AlertCircle } from 'lucide-react';

interface GrowthRecordFormModalProps {
  plant: Plant;
  recordToEdit?: GrowthRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (recordData: Omit<GrowthRecord, 'id' | 'createdAt'>, existingId?: string) => void;
}

export const GrowthRecordFormModal: React.FC<GrowthRecordFormModalProps> = ({
  plant,
  recordToEdit,
  isOpen,
  onClose,
  onSave,
}) => {
  const [date, setDate] = useState(getTodayString());
  const [heightCm, setHeightCm] = useState<string>('');
  const [leafCount, setLeafCount] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (recordToEdit) {
      setDate(recordToEdit.date);
      setHeightCm(recordToEdit.heightCm.toString());
      setLeafCount(recordToEdit.leafCount.toString());
      setNotes(recordToEdit.notes || '');
      setPhotoUrl(recordToEdit.photoUrl);
    } else {
      setDate(getTodayString());
      setHeightCm('');
      setLeafCount('');
      setNotes('');
      setPhotoUrl(undefined);
    }
    setError(null);
  }, [recordToEdit, isOpen]);

  if (!isOpen) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please choose a valid image file (JPG, PNG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Please choose an image under 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setPhotoUrl(event.target?.result as string);
      setError(null);
    };
    reader.onerror = () => {
      setError('Failed to read image file.');
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPhotoUrl(undefined);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedHeight = parseFloat(heightCm);
    const parsedLeaves = parseInt(leafCount, 10);

    if (!date) {
      setError('Please select a recording date.');
      return;
    }

    if (isNaN(parsedHeight) || parsedHeight <= 0) {
      setError('Please enter a valid plant height greater than 0 cm.');
      return;
    }

    if (isNaN(parsedLeaves) || parsedLeaves < 0) {
      setError('Please enter a valid leaf count (0 or more).');
      return;
    }

    onSave(
      {
        plantId: plant.id,
        date,
        heightCm: Number(parsedHeight.toFixed(1)),
        leafCount: parsedLeaves,
        photoUrl: photoUrl || undefined,
        notes: notes.trim() || undefined,
      },
      recordToEdit?.id
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/45 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className="bg-white w-full max-w-lg rounded-2xl border border-stone-200/90 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="growth-form-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200/80 bg-stone-50/70">
          <div>
            <h3 id="growth-form-title" className="text-base font-bold text-stone-900 font-display">
              {recordToEdit ? 'Edit Growth Record' : 'Record Plant Growth'}
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              {plant.name} <span className="text-stone-300">·</span> {plant.species}
            </p>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 text-stone-400 hover:text-stone-600 rounded-lg hover:bg-stone-200/50 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Recording Date */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-700" />
              <span>Recording Date</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600/40 focus:border-emerald-600"
              required
            />
          </div>

          {/* Measurements Row: Height & Leaf Count */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5 flex items-center gap-1.5">
                <Ruler className="w-3.5 h-3.5 text-emerald-700" />
                <span>Height (cm)</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0.5"
                  max="1000"
                  placeholder="e.g. 45.5"
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600/40 focus:border-emerald-600 pr-10 font-mono"
                  required
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-stone-400">
                  cm
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5 flex items-center gap-1.5">
                <Leaf className="w-3.5 h-3.5 text-emerald-700" />
                <span>Number of Leaves</span>
              </label>
              <input
                type="number"
                step="1"
                min="0"
                max="5000"
                placeholder="e.g. 8"
                value={leafCount}
                onChange={(e) => setLeafCount(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600/40 focus:border-emerald-600 font-mono"
                required
              />
            </div>
          </div>

          {/* Plant Condition Notes */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Condition & Growth Notes <span className="text-stone-400 font-normal">(optional)</span>
            </label>
            <textarea
              rows={2}
              placeholder="e.g., New vibrant leaf unfurled this week, root system expanding well."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600/40 focus:border-emerald-600 resize-none text-stone-800"
            />
          </div>

          {/* Optional Plant Photograph */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5 flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-emerald-700" />
              <span>Plant Photograph <span className="text-stone-400 font-normal">(optional)</span></span>
            </label>

            {photoUrl ? (
              <div className="relative rounded-lg border border-stone-200 overflow-hidden bg-stone-50 flex items-center gap-3 p-2">
                <img
                  src={photoUrl}
                  alt="Growth milestone"
                  className="w-16 h-16 object-cover rounded-md border border-stone-200 shrink-0"
                />
                <div className="flex-1 min-w-0 text-xs">
                  <p className="font-medium text-stone-800 truncate">Photo attached</p>
                  <p className="text-stone-400 text-[11px]">Milestone image for this measurement</p>
                </div>
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                  title="Remove photo"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-stone-300 hover:border-emerald-600 rounded-lg p-4 cursor-pointer bg-stone-50/50 hover:bg-emerald-50/30 transition-colors">
                <Upload className="w-5 h-5 text-stone-400 mb-1" />
                <span className="text-xs font-medium text-stone-600">
                  Upload a photo of this measurement
                </span>
                <span className="text-[11px] text-stone-400 mt-0.5">PNG, JPG, or WebP up to 5MB</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 rounded-lg shadow-xs transition-colors"
            >
              {recordToEdit ? 'Save Changes' : 'Save Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
