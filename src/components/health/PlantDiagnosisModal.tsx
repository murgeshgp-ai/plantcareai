import React, { useState, useRef, useEffect } from 'react';
import { Plant } from '../../types/plant';
import { PlantDiagnosisResult, SeverityLevel, DiseaseCategory } from '../../types/diagnosis';
import { HealthAssessment, LeafCondition, PestCondition, SoilCondition, OverallAppearance } from '../../types/health';
import { diagnosePlant } from '../../services/aiApi';
import {
  X,
  Upload,
  Camera,
  Sparkles,
  Stethoscope,
  AlertTriangle,
  CheckCircle2,
  Info,
  RotateCcw,
  ShieldAlert,
  Leaf,
  Droplets,
  Bug,
  Sun,
  Check,
  RefreshCw,
  Image as ImageIcon,
} from 'lucide-react';

interface PlantDiagnosisModalProps {
  plant: Plant | null;
  isOpen: boolean;
  onClose: () => void;
  plants: Plant[];
  onApplyHealthAssessment?: (assessment: Omit<HealthAssessment, 'id' | 'createdAt'>) => void;
}

/**
 * Resizes an image file or data URL using HTML5 canvas to a maximum dimension
 * (e.g. 1280px) and 85% JPEG quality.
 */
async function resizeImageToMaxDimension(
  fileOrDataUrl: File | string,
  maxDimension = 1280,
  quality = 0.85
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      let { width, height } = img;
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, width);
      canvas.height = Math.max(1, height);
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(typeof fileOrDataUrl === 'string' ? fileOrDataUrl : '');
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      try {
        const resizedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(resizedDataUrl);
      } catch (e) {
        // Fallback if canvas security throws
        resolve(typeof fileOrDataUrl === 'string' ? fileOrDataUrl : '');
      }
    };

    img.onerror = (err) => reject(err);

    if (typeof fileOrDataUrl === 'string') {
      img.src = fileOrDataUrl;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (typeof e.target?.result === 'string') {
          img.src = e.target.result;
        }
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(fileOrDataUrl);
    }
  });
}

export const PlantDiagnosisModal: React.FC<PlantDiagnosisModalProps> = ({
  plant,
  isOpen,
  onClose,
  plants,
  onApplyHealthAssessment,
}) => {
  const [selectedPlantId, setSelectedPlantId] = useState<string>(plant?.id || plants[0]?.id || 'general');
  const [imagePreview, setImagePreview] = useState<string | null>(plant?.imageUrl || null);
  const [isResizing, setIsResizing] = useState(false);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [diagnosisResult, setDiagnosisResult] = useState<PlantDiagnosisResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showApplyConfirmation, setShowApplyConfirmation] = useState(false);
  const [appliedSuccessfully, setAppliedSuccessfully] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Sync selected plant when prop changes
  useEffect(() => {
    let active = true;
    if (plant) {
      setSelectedPlantId(plant.id);
      setDiagnosisResult(null);
      setErrorMessage(null);
      setShowApplyConfirmation(false);
      setAppliedSuccessfully(false);

      if (plant.imageUrl) {
        setImagePreview(plant.imageUrl);
        // Pre-convert to valid JPEG base64 via canvas
        resizeImageToMaxDimension(plant.imageUrl, 1280, 0.85)
          .then((b64) => {
            if (active && b64 && b64.startsWith('data:image/')) {
              setImagePreview(b64);
            }
          })
          .catch(() => {});
      } else {
        setImagePreview(null);
      }
    } else if (plants.length > 0 && selectedPlantId === 'general') {
      setSelectedPlantId(plants[0].id);
    }
    return () => {
      active = false;
    };
  }, [plant]);

  if (!isOpen) return null;

  const currentPlant = plants.find((p) => p.id === selectedPlantId);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsResizing(true);
      setErrorMessage(null);
      setDiagnosisResult(null);
      setShowApplyConfirmation(false);
      setAppliedSuccessfully(false);

      const resizedBase64 = await resizeImageToMaxDimension(file, 1280, 0.85);
      setImagePreview(resizedBase64);
    } catch (err) {
      console.error('Image resizing failed:', err);
      setErrorMessage('Could not process this image. Please select another photograph.');
    } finally {
      setIsResizing(false);
      // Reset input value so same file can be picked again if desired
      e.target.value = '';
    }
  };

  const handleUsePlantPhoto = async () => {
    if (!currentPlant?.imageUrl) return;
    try {
      setIsResizing(true);
      setErrorMessage(null);
      setDiagnosisResult(null);
      setShowApplyConfirmation(false);
      setAppliedSuccessfully(false);

      const resized = await resizeImageToMaxDimension(currentPlant.imageUrl, 1280, 0.85);
      setImagePreview(resized);
    } catch (err) {
      console.error('Could not load plant photo', err);
      setImagePreview(currentPlant.imageUrl);
    } finally {
      setIsResizing(false);
    }
  };

  const runDiagnosis = async () => {
    if (!imagePreview || isDiagnosing) return;

    setIsDiagnosing(true);
    setErrorMessage(null);
    setShowApplyConfirmation(false);
    setAppliedSuccessfully(false);

    try {
      let finalBase64 = imagePreview;

      // If the image is not a base64 data URL yet (e.g. it's a URL path), resize and convert via canvas
      if (!finalBase64.startsWith('data:image/')) {
        try {
          const converted = await resizeImageToMaxDimension(finalBase64, 1280, 0.85);
          if (converted && converted.startsWith('data:image/')) {
            finalBase64 = converted;
            setImagePreview(converted);
          }
        } catch (e) {
          console.warn('Canvas conversion before send failed, sending as-is:', e);
        }
      }

      const plantContext = currentPlant
        ? {
            name: currentPlant.name,
            species: currentPlant.species,
            room: currentPlant.room,
            light: currentPlant.light,
            wateringFrequencyDays: currentPlant.wateringFrequencyDays,
            lastWatered: currentPlant.lastWatered,
            notes: currentPlant.notes,
          }
        : undefined;

      const diagnosis = await diagnosePlant(finalBase64, plantContext);
      setDiagnosisResult(diagnosis);
    } catch (err: any) {
      console.error('Diagnosis error:', err);
      setErrorMessage(err.message || 'Unable to connect to the diagnosis service. Please try again.');
    } finally {
      setIsDiagnosing(false);
    }
  };

  // Convert diagnosis results into a proposed HealthAssessment to allow user confirmation
  const getProposedAssessment = (): Omit<HealthAssessment, 'id' | 'createdAt'> | null => {
    if (!diagnosisResult || !currentPlant) return null;

    let leafCondition: LeafCondition = 'healthy';
    let pestCondition: PestCondition = 'no-pests';
    let soilCondition: SoilCondition = 'normal';
    let overallAppearance: OverallAppearance = 'healthy';
    let score = 90;

    if (!diagnosisResult.hasIssue) {
      leafCondition = 'healthy';
      pestCondition = 'no-pests';
      overallAppearance = 'healthy';
      score = 92;
    } else {
      // Map category to leaf/pest condition
      if (diagnosisResult.category === 'pest') {
        pestCondition = diagnosisResult.severity === 'high' || diagnosisResult.severity === 'critical' 
          ? 'visible-pests' 
          : 'possible-pests';
      }
      if (diagnosisResult.category === 'fungal') {
        leafCondition = 'brown-spots';
      } else if (diagnosisResult.category === 'watering') {
        leafCondition = 'yellowing';
      } else if (diagnosisResult.category === 'nutrient') {
        leafCondition = 'yellowing';
      } else if (diagnosisResult.category === 'environmental') {
        leafCondition = 'wilting';
      }

      // Map severity to score
      switch (diagnosisResult.severity) {
        case 'low':
          score = 75;
          overallAppearance = 'average';
          break;
        case 'moderate':
          score = 60;
          overallAppearance = 'average';
          break;
        case 'high':
          score = 45;
          overallAppearance = 'poor';
          break;
        case 'critical':
          score = 25;
          overallAppearance = 'poor';
          break;
        default:
          score = 80;
      }
    }

    const today = new Date().toISOString().split('T')[0];

    return {
      plantId: currentPlant.id,
      assessedAt: today,
      leafCondition,
      pestCondition,
      soilCondition,
      overallAppearance,
      notes: `AI Diagnosis (${diagnosisResult.conditionName}): ${diagnosisResult.visibleSymptoms.slice(0, 2).join(', ')}`,
      score,
    };
  };

  const handleConfirmApply = () => {
    const proposed = getProposedAssessment();
    if (proposed && onApplyHealthAssessment) {
      onApplyHealthAssessment(proposed);
      setAppliedSuccessfully(true);
      setShowApplyConfirmation(false);
    }
  };

  const getSeverityBadgeClass = (severity: SeverityLevel) => {
    switch (severity) {
      case 'none':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'low':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'moderate':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'high':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'critical':
        return 'bg-red-200 text-red-900 border-red-300 font-bold';
      default:
        return 'bg-stone-100 text-stone-800 border-stone-200';
    }
  };

  const getCategoryIcon = (category: DiseaseCategory) => {
    switch (category) {
      case 'healthy':
        return <Leaf className="w-4 h-4 text-emerald-600" />;
      case 'pest':
        return <Bug className="w-4 h-4 text-rose-600" />;
      case 'watering':
        return <Droplets className="w-4 h-4 text-sky-600" />;
      case 'nutrient':
        return <Sparkles className="w-4 h-4 text-amber-600" />;
      case 'environmental':
        return <Sun className="w-4 h-4 text-orange-600" />;
      default:
        return <ShieldAlert className="w-4 h-4 text-stone-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/45 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      {/* Hidden file & camera inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      <div
        className="bg-white w-full max-w-3xl rounded-2xl border border-stone-200/90 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="diagnosis-modal-title"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-200/80 bg-stone-50/70 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-700 flex items-center justify-center text-white shadow-xs">
              <Stethoscope className="w-5 h-5 text-emerald-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="diagnosis-modal-title" className="text-base sm:text-lg font-bold text-stone-900 font-display">
                  AI Plant Disease Diagnosis
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-semibold text-emerald-800 bg-emerald-100 rounded-full">
                  Gemini Vision
                </span>
              </div>
              <p className="text-xs text-stone-500">
                Detect foliar diseases, pests, watering stress, and symptoms from a photo
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
          {/* Plant Selector Bar */}
          <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-emerald-950 font-medium">
              <Leaf className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>Plant to diagnose:</span>
            </div>

            <select
              value={selectedPlantId}
              onChange={(e) => {
                setSelectedPlantId(e.target.value);
                setDiagnosisResult(null);
                setErrorMessage(null);
                setShowApplyConfirmation(false);
                setAppliedSuccessfully(false);
              }}
              className="text-xs sm:text-sm bg-white border border-stone-200 text-stone-800 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 font-medium"
            >
              {plants.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}{p.species ? ` (${p.species})` : ''} · {p.room}
                </option>
              ))}
            </select>
          </div>

          {/* Photo Capture / Upload Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider">
                Plant Photograph
              </label>
              {isResizing && (
                <span className="text-xs text-emerald-700 animate-pulse font-medium">
                  Optimizing photo with HTML5 canvas...
                </span>
              )}
            </div>

            {imagePreview ? (
              <div className="relative rounded-2xl overflow-hidden border border-stone-200/80 bg-stone-900 group">
                <img
                  src={imagePreview}
                  alt="Plant preview for diagnosis"
                  className="w-full h-56 sm:h-64 object-cover object-center"
                />
                
                {/* Photo Actions Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2.5 p-4">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isDiagnosing}
                    className="px-3 py-2 bg-white/95 hover:bg-white text-stone-800 text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Upload New</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    disabled={isDiagnosing}
                    className="px-3 py-2 bg-white/95 hover:bg-white text-stone-800 text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center gap-1.5"
                  >
                    <Camera className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Take Photo</span>
                  </button>
                  {currentPlant?.imageUrl && imagePreview !== currentPlant.imageUrl && (
                    <button
                      type="button"
                      onClick={handleUsePlantPhoto}
                      disabled={isDiagnosing}
                      className="px-3 py-2 bg-white/95 hover:bg-white text-stone-800 text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center gap-1.5"
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Use Profile Photo</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-stone-200 rounded-2xl p-6 sm:p-8 text-center bg-stone-50/50 hover:bg-emerald-50/20 transition-colors">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Camera className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-semibold text-stone-800 mb-1">
                  Upload or snap a photo of the affected foliage
                </h3>
                <p className="text-xs text-stone-500 max-w-sm mx-auto mb-4">
                  For the most accurate analysis, capture a clear, well-lit close-up of the affected leaves, spots, or stems.
                </p>

                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-white border border-stone-200 hover:border-emerald-300 text-stone-700 text-xs font-semibold rounded-xl shadow-2xs hover:bg-emerald-50 transition-colors flex items-center gap-1.5"
                  >
                    <Upload className="w-4 h-4 text-emerald-700" />
                    <span>Upload Image</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Take Photo</span>
                  </button>
                  {currentPlant?.imageUrl && (
                    <button
                      type="button"
                      onClick={handleUsePlantPhoto}
                      className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
                    >
                      <ImageIcon className="w-4 h-4 text-stone-500" />
                      <span>Use Profile Photo</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Run Diagnosis Button */}
            {imagePreview && !diagnosisResult && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={runDiagnosis}
                  disabled={isDiagnosing || isResizing}
                  className="w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-semibold text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isDiagnosing ? (
                    <>
                      <div className="flex gap-1 items-center">
                        <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                        <span className="w-2 h-2 rounded-full bg-white animate-pulse [animation-delay:200ms]"></span>
                        <span className="w-2 h-2 rounded-full bg-white animate-pulse [animation-delay:400ms]"></span>
                      </div>
                      <span className="ml-1">Analyzing with Gemini AI Vision...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-emerald-200" />
                      <span>Diagnose Plant Health with AI Vision</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-3 shadow-2xs">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1">
                <p className="font-semibold text-rose-900">Diagnosis Incomplete</p>
                <p>{errorMessage}</p>
              </div>
              <button
                type="button"
                onClick={runDiagnosis}
                className="px-3 py-1 bg-white border border-rose-300 text-rose-700 hover:bg-rose-100 rounded-lg font-semibold text-xs transition-colors shrink-0 flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Retry</span>
              </button>
            </div>
          )}

          {/* DIAGNOSIS RESULTS DISPLAY */}
          {diagnosisResult && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Uncertainty Warning Banner (If confidence is low or image unclear) */}
              {diagnosisResult.uncertaintyWarning && (
                <div className="p-3.5 bg-amber-50 border border-amber-200/90 rounded-xl text-xs text-amber-900 flex items-start gap-3 shadow-2xs">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-amber-950 mb-0.5">Diagnostic Uncertainty Notice</span>
                    <span className="leading-relaxed">{diagnosisResult.uncertaintyWarning}</span>
                  </div>
                </div>
              )}

              {/* Main Result Card */}
              <div
                className={`p-5 rounded-2xl border ${
                  !diagnosisResult.isPlant
                    ? 'bg-stone-50 border-stone-200'
                    : !diagnosisResult.hasIssue
                    ? 'bg-emerald-50/70 border-emerald-200'
                    : 'bg-stone-50 border-stone-200'
                } shadow-xs space-y-4`}
              >
                {/* Header Row: Condition name, category icon, and status badges */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200/60 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-white border border-stone-200 flex items-center justify-center shadow-2xs">
                      {getCategoryIcon(diagnosisResult.category)}
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-stone-900 font-display">
                        {diagnosisResult.conditionName}
                      </h3>
                      <p className="text-xs text-stone-500 capitalize">
                        Category: {diagnosisResult.category}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg border shadow-2xs uppercase tracking-wide ${getSeverityBadgeClass(
                        diagnosisResult.severity
                      )}`}
                    >
                      Severity: {diagnosisResult.severity}
                    </span>
                    <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white border border-stone-200 text-stone-700 shadow-2xs capitalize">
                      Confidence: {diagnosisResult.confidence}
                    </span>
                  </div>
                </div>

                {/* Visible Symptoms */}
                {diagnosisResult.visibleSymptoms.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Leaf className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Visible Symptoms Identified</span>
                    </h4>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-stone-700">
                      {diagnosisResult.visibleSymptoms.map((symptom, idx) => (
                        <li key={idx} className="flex items-start gap-2 bg-white/80 p-2 rounded-lg border border-stone-200/60">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span className="capitalize">{symptom}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Possible Causes */}
                {diagnosisResult.possibleCauses.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 text-amber-600" />
                      <span>Probable Causes</span>
                    </h4>
                    <ul className="space-y-1 text-xs text-stone-700">
                      {diagnosisResult.possibleCauses.map((cause, idx) => (
                        <li key={idx} className="flex items-start gap-2 bg-white/80 p-2 rounded-lg border border-stone-200/60">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0"></span>
                          <span>{cause}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Treatment Steps */}
                {diagnosisResult.treatmentSteps.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Stethoscope className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Recommended Treatment Steps</span>
                    </h4>
                    <div className="space-y-1.5">
                      {diagnosisResult.treatmentSteps.map((step, idx) => (
                        <div key={idx} className="flex items-start gap-2.5 bg-white p-2.5 rounded-xl border border-stone-200/80 text-xs text-stone-800">
                          <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <span className="leading-relaxed">{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Prevention Tips */}
                {diagnosisResult.preventionTips.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Prevention & Future Routine</span>
                    </h4>
                    <ul className="space-y-1 text-xs text-stone-700">
                      {diagnosisResult.preventionTips.map((tip, idx) => (
                        <li key={idx} className="flex items-start gap-2 bg-white/80 p-2 rounded-lg border border-stone-200/60">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* HEALTH SCORE SYNCHRONIZATION (WITH USER REVIEW & APPROVAL RULE) */}
              {currentPlant && onApplyHealthAssessment && (
                <div className="border border-stone-200 rounded-xl p-4 bg-stone-50/60 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                        Update Plant Health Score
                      </h4>
                      <p className="text-xs text-stone-500">
                        Optionally record a health assessment based on this AI diagnosis for {currentPlant.name}.
                      </p>
                    </div>

                    {!appliedSuccessfully && !showApplyConfirmation && (
                      <button
                        type="button"
                        onClick={() => setShowApplyConfirmation(true)}
                        className="px-3.5 py-2 text-xs font-semibold text-emerald-900 bg-emerald-100/80 hover:bg-emerald-200/80 border border-emerald-300 rounded-lg shadow-2xs transition-colors whitespace-nowrap self-start sm:self-auto"
                      >
                        Review & Apply to Health Score
                      </button>
                    )}
                  </div>

                  {/* Explicit Confirmation Step */}
                  {showApplyConfirmation && (
                    <div className="bg-white border border-emerald-200 rounded-xl p-3.5 space-y-3 animate-in fade-in duration-150">
                      <div className="text-xs space-y-1">
                        <span className="font-bold text-emerald-950 block">Confirm Health Score Adjustment</span>
                        <p className="text-stone-600 leading-relaxed">
                          This will record a new assessment snapshot for <strong className="text-stone-800">{currentPlant.name}</strong>.
                          Proposed score: <strong className="text-emerald-800 font-mono">{getProposedAssessment()?.score}/100</strong>.
                          Your existing historical records will remain preserved.
                        </p>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={handleConfirmApply}
                          className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors flex items-center gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Confirm & Apply</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowApplyConfirmation(false)}
                          className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {appliedSuccessfully && (
                    <div className="p-2.5 bg-emerald-100/70 border border-emerald-300 text-emerald-900 rounded-lg text-xs font-semibold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>Health assessment successfully updated for {currentPlant.name}!</span>
                    </div>
                  )}
                </div>
              )}

              {/* Action buttons: Retest or Close */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setDiagnosisResult(null);
                    setAppliedSuccessfully(false);
                    setShowApplyConfirmation(false);
                  }}
                  className="px-3.5 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Analyze Another Photo</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-stone-800 hover:bg-stone-900 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors"
                >
                  Close Diagnosis
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
