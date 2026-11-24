import React, { useState } from 'react';
import { Plant } from '../types/plant';
import { 
  HealthAssessment, 
  LeafCondition, 
  PestCondition, 
  SoilCondition, 
  OverallAppearance 
} from '../types/health';
import { calculateConditionScore } from '../utils/healthCalculator';
import { HealthScoreBadge } from './HealthScoreBadge';
import { getTodayString } from '../utils/dateUtils';
import { 
  X, 
  Check, 
  Leaf, 
  Bug, 
  Droplet, 
  Sparkles, 
  Calendar, 
  FileText, 
  AlertCircle,
  HelpCircle
} from 'lucide-react';

interface HealthAssessmentModalProps {
  plant: Plant | null;
  latestAssessment?: HealthAssessment | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveAssessment: (assessment: Omit<HealthAssessment, 'id' | 'createdAt'>) => void;
}

export const HealthAssessmentModal: React.FC<HealthAssessmentModalProps> = ({
  plant,
  latestAssessment,
  isOpen,
  onClose,
  onSaveAssessment,
}) => {
  if (!isOpen || !plant) return null;

  const today = getTodayString();
  const [assessedAt, setAssessedAt] = useState<string>(latestAssessment?.assessedAt || today);
  const [leafCondition, setLeafCondition] = useState<LeafCondition>(
    latestAssessment?.leafCondition || 'healthy'
  );
  const [pestCondition, setPestCondition] = useState<PestCondition>(
    latestAssessment?.pestCondition || 'no-pests'
  );
  const [soilCondition, setSoilCondition] = useState<SoilCondition>(
    latestAssessment?.soilCondition || 'normal'
  );
  const [overallAppearance, setOverallAppearance] = useState<OverallAppearance>(
    latestAssessment?.overallAppearance || 'healthy'
  );
  const [notes, setNotes] = useState<string>(latestAssessment?.notes || '');

  // Calculate live preview score of the condition observation
  const previewScore = calculateConditionScore(
    leafCondition,
    pestCondition,
    soilCondition,
    overallAppearance
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveAssessment({
      plantId: plant.id,
      assessedAt,
      leafCondition,
      pestCondition,
      soilCondition,
      overallAppearance,
      notes: notes.trim() || undefined,
      score: previewScore,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/45 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className="bg-white w-full max-w-xl rounded-2xl border border-stone-200/90 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="health-modal-title"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-stone-200/80 bg-stone-50/60 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              <h2 id="health-modal-title" className="text-lg font-bold text-stone-900 font-display">
                Health Assessment
              </h2>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Evaluate physical symptoms for <span className="font-semibold text-emerald-950">{plant.name}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 rounded-full transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Observation Score Preview Banner */}
        <div className="px-6 py-3.5 bg-emerald-50/60 border-b border-emerald-100 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <HealthScoreBadge score={previewScore} size="sm" />
            <div>
              <div className="text-xs font-semibold text-emerald-950">
                Condition Observation Score: {previewScore}/100
              </div>
              <div className="text-[11px] text-emerald-800">
                Accounts for 40% of the total plant health score
              </div>
            </div>
          </div>
          <div className="text-[11px] text-stone-500 italic hidden sm:block">
            Updates in real time
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Assessment Date */}
          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-stone-500" />
              <span>Assessment Date</span>
            </label>
            <input
              type="date"
              value={assessedAt}
              max={today}
              onChange={(e) => setAssessedAt(e.target.value)}
              className="w-full sm:w-48 px-3 py-2 text-sm bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 text-stone-800"
              required
            />
          </div>

          {/* 1. Leaf Condition */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
              <Leaf className="w-4 h-4 text-emerald-700" />
              <span>1. Leaf Condition</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { id: 'healthy', label: 'Healthy', desc: 'Vibrant, firm, normal color' },
                { id: 'yellowing', label: 'Yellowing', desc: 'Pale, chlorotic leaves' },
                { id: 'brown-spots', label: 'Brown spots', desc: 'Crispy edges or blemishes' },
                { id: 'wilting', label: 'Wilting', desc: 'Drooping, limp foliage' },
              ].map((opt) => (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => setLeafCondition(opt.id as LeafCondition)}
                  className={`p-3 text-left rounded-xl border text-xs transition-all flex flex-col justify-between ${
                    leafCondition === opt.id
                      ? 'border-emerald-700 bg-emerald-50/80 text-emerald-950 font-medium ring-1 ring-emerald-700'
                      : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300 hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold">{opt.label}</span>
                    {leafCondition === opt.id && <Check className="w-3.5 h-3.5 text-emerald-700" />}
                  </div>
                  <span className="text-[10px] text-stone-500 leading-tight">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Pest Condition */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
              <Bug className="w-4 h-4 text-emerald-700" />
              <span>2. Pest Condition</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {[
                { id: 'no-pests', label: 'No pests', desc: 'Clean foliage and stems' },
                { id: 'possible-pests', label: 'Possible pests', desc: 'Sticky residue, mild webbing' },
                { id: 'visible-pests', label: 'Visible pests', desc: 'Active mites, scale, or bugs' },
              ].map((opt) => (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => setPestCondition(opt.id as PestCondition)}
                  className={`p-3 text-left rounded-xl border text-xs transition-all flex flex-col justify-between ${
                    pestCondition === opt.id
                      ? 'border-emerald-700 bg-emerald-50/80 text-emerald-950 font-medium ring-1 ring-emerald-700'
                      : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300 hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold">{opt.label}</span>
                    {pestCondition === opt.id && <Check className="w-3.5 h-3.5 text-emerald-700" />}
                  </div>
                  <span className="text-[10px] text-stone-500 leading-tight">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 3. Soil Condition */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
              <Droplet className="w-4 h-4 text-emerald-700" />
              <span>3. Soil Condition</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {[
                { id: 'normal', label: 'Normal', desc: 'Appropriately damp/aerated' },
                { id: 'moist', label: 'Moist', desc: 'Consistently wet or damp' },
                { id: 'too-dry', label: 'Too dry', desc: 'Pulling from edges, parched' },
              ].map((opt) => (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => setSoilCondition(opt.id as SoilCondition)}
                  className={`p-3 text-left rounded-xl border text-xs transition-all flex flex-col justify-between ${
                    soilCondition === opt.id
                      ? 'border-emerald-700 bg-emerald-50/80 text-emerald-950 font-medium ring-1 ring-emerald-700'
                      : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300 hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold">{opt.label}</span>
                    {soilCondition === opt.id && <Check className="w-3.5 h-3.5 text-emerald-700" />}
                  </div>
                  <span className="text-[10px] text-stone-500 leading-tight">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 4. Overall Appearance */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-700" />
              <span>4. Overall Appearance</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {[
                { id: 'healthy', label: 'Healthy', desc: 'Upright, thriving foliage' },
                { id: 'average', label: 'Average', desc: 'Moderate vitality, steady' },
                { id: 'poor', label: 'Poor', desc: 'Stunted, weak, or stressed' },
              ].map((opt) => (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => setOverallAppearance(opt.id as OverallAppearance)}
                  className={`p-3 text-left rounded-xl border text-xs transition-all flex flex-col justify-between ${
                    overallAppearance === opt.id
                      ? 'border-emerald-700 bg-emerald-50/80 text-emerald-950 font-medium ring-1 ring-emerald-700'
                      : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300 hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold">{opt.label}</span>
                    {overallAppearance === opt.id && <Check className="w-3.5 h-3.5 text-emerald-700" />}
                  </div>
                  <span className="text-[10px] text-stone-500 leading-tight">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Notes field */}
          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-stone-500" />
              <span>Observation Notes (Optional)</span>
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Noticed slight edge browning on lower leaves after radiator was turned on..."
              className="w-full px-3 py-2 text-xs bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 text-stone-800 placeholder:text-stone-400"
            />
          </div>

          {/* Wellness Disclaimer */}
          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/80 text-[11px] text-stone-500 flex items-start gap-2">
            <HelpCircle className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
            <p>
              <strong className="text-stone-700">Educational Wellness Disclaimer:</strong> This score is a guideline to help organize indoor plant care and identify early environmental stress. It is not an automated pathological laboratory diagnosis.
            </p>
          </div>

          {/* Action buttons */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-stone-200/80">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200/70 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Save Assessment</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
