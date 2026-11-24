import React, { useState, useRef, useMemo } from 'react';
import { Plant, LightRequirement } from '../../types/plant';
import { getTodayString } from '../../utils/dateUtils';
import { searchPlantCatalog, PlantCatalogItem } from '../../data/plantDatabase';
import { identifyPlant, AiApiError, PlantIdentificationResult } from '../../services/aiApi';
import { 
  Upload, 
  X, 
  Check, 
  Sprout, 
  Droplets, 
  Sparkles, 
  Scissors, 
  SunMedium, 
  Loader2, 
  AlertCircle, 
  Camera, 
  CheckCircle2, 
  Sliders, 
  Info,
  RefreshCw,
  Edit3,
  Search,
  ChevronRight
} from 'lucide-react';

interface AddPlantProps {
  onAddPlant: (newPlant: Plant) => void;
  onCancel: () => void;
}

type AddMode = 'ai' | 'manual';

type IdentificationResult = PlantIdentificationResult;

const COMMON_SPECIES = [
  { 
    name: 'Monstera Deliciosa', 
    species: 'Monstera deliciosa', 
    light: 'Bright indirect' as LightRequirement, 
    water: 7, 
    fertilize: 21, 
    prune: 60, 
    type: 'monstera' as const,
    room: 'Living Room',
    imageUrl: '/images/plants/monstera.jpg',
    notes: 'Likes high ambient humidity and bright indirect light. Wipe large fenestrated leaves monthly with a damp cloth to encourage photosynthesis.',
  },
  { 
    name: 'Golden Pothos', 
    species: 'Epipremnum aureum', 
    light: 'Medium indirect' as LightRequirement, 
    water: 7, 
    fertilize: 28, 
    prune: 60, 
    type: 'pothos' as const,
    room: 'Kitchen',
    imageUrl: '/images/plants/pothos.jpg',
    notes: 'Fast-growing trailing vine. Tolerant of low light and occasional missed waterings. Trim vine tips regularly to promote full, bushier foliage.',
  },
  { 
    name: 'Snake Plant', 
    species: 'Sansevieria trifasciata', 
    light: 'Low light' as LightRequirement, 
    water: 14, 
    fertilize: 45, 
    prune: 120, 
    type: 'snake' as const,
    room: 'Bedroom',
    imageUrl: '/images/plants/snake.jpg',
    notes: 'Extremely resilient architectural houseplant. Allow soil to dry completely between waterings. Thrives in almost any lighting from low to bright direct.',
  },
  { 
    name: 'Peace Lily', 
    species: 'Spathiphyllum wallisii', 
    light: 'Medium indirect' as LightRequirement, 
    water: 5, 
    fertilize: 20, 
    prune: 45, 
    type: 'peacelily' as const,
    room: 'Home Office',
    imageUrl: '/images/plants/peacelily.jpg',
    notes: 'Graceful white blooms and glossy leaves. Droops slightly when thirsty as a gentle reminder. Keep away from harsh direct sun and drafty air vents.',
  },
  { 
    name: 'Fiddle Leaf Fig', 
    species: 'Ficus lyrata', 
    light: 'Bright indirect' as LightRequirement, 
    water: 10, 
    fertilize: 30, 
    prune: 90, 
    type: 'fig' as const,
    room: 'Balcony Room',
    imageUrl: '/images/plants/fig.jpg',
    notes: 'Needs consistent bright filtered light. Allow top 2 inches of soil to dry before watering. Sensitive to being moved or cold air drafts.',
  },
  { 
    name: 'Calathea Orbifolia', 
    species: 'Goeppertia orbifolia', 
    light: 'Medium indirect' as LightRequirement, 
    water: 4, 
    fertilize: 21, 
    prune: 60, 
    type: 'calathea' as const,
    room: 'Bathroom',
    imageUrl: '/images/plants/calathea.jpg',
    notes: 'Striking round leaves with silver stripes. Requires high humidity and distilled or rainwater. Avoid direct sunlight which can scorch its leaves.',
  },
];

const SAMPLE_TEST_PHOTOS = [
  {
    name: 'Monstera Deliciosa',
    url: '/images/plants/monstera.jpg',
  },
  {
    name: 'Fiddle Leaf Fig',
    url: '/images/plants/fig.jpg',
  },
  {
    name: 'Snake Plant',
    url: '/images/plants/snake.jpg',
  },
  {
    name: 'Calathea Orbifolia',
    url: '/images/plants/calathea.jpg',
  },
];

export const AddPlant: React.FC<AddPlantProps> = ({ onAddPlant, onCancel }) => {
  const [mode, setMode] = useState<AddMode>('ai');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formSectionRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Form State - preserved and never wiped on AI failure
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('');
  const [room, setRoom] = useState('Living Room');
  const [light, setLight] = useState<LightRequirement>('Bright indirect');
  const [wateringDays, setWateringDays] = useState(7);
  const [fertilizingDays, setFertilizingDays] = useState(28);
  const [pruningDays, setPruningDays] = useState(60);
  const [lastWatered, setLastWatered] = useState(getTodayString());
  const [notes, setNotes] = useState('');
  const [illustrationType, setIllustrationType] = useState<Plant['illustrationType']>('generic');
  
  // Image State
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSuccess, setIsSuccess] = useState(false);

  // AI Identification & Retry State
  const [isIdentifying, setIsIdentifying] = useState(false);
  const [retryAttempt, setRetryAttempt] = useState(1);
  const [loadingStatusText, setLoadingStatusText] = useState('Analyzing plant photograph with Gemini AI vision...');
  const [aiResult, setAiResult] = useState<IdentificationResult | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [failedAfterRetries, setFailedAfterRetries] = useState(false);

  // Search & Catalog / Preset State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [catalogNotice, setCatalogNotice] = useState<string | null>(null);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return searchPlantCatalog(searchQuery);
  }, [searchQuery]);

  // Helper to handle uploaded image file
  const handleImageFile = (file: File) => {
    if (isIdentifying) return; // Prevent changing image mid-flight

    if (!file.type.startsWith('image/')) {
      setErrors((prev) => ({ ...prev, image: 'Please choose a valid image file (JPG, PNG, WebP).' }));
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, image: 'Image size should be less than 15MB.' }));
      return;
    }

    setErrors((prev) => {
      const copy = { ...prev };
      delete copy.image;
      return copy;
    });
    setAiError(null);
    setFailedAfterRetries(false);

    const reader = new FileReader();
    reader.onload = (e) => {
      if (typeof e.target?.result === 'string') {
        setImagePreview(e.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (isIdentifying) return;
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleImageFile(file);
    }
  };

  const removePhoto = () => {
    if (isIdentifying) return; // Prevent removing photo mid-flight
    setImagePreview(null);
    setAiResult(null);
    setAiError(null);
    setFailedAfterRetries(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Convert remote image url to base64 for sample testing
  const selectSamplePhoto = async (url: string) => {
    if (isIdentifying) return;
    try {
      setAiError(null);
      setAiResult(null);
      setFailedAfterRetries(false);
      const res = await fetch(url);
      const blob = await res.blob();
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setImagePreview(reader.result);
        }
      };
      reader.readAsDataURL(blob);
    } catch (e) {
      console.error('Failed to load sample image', e);
      setImagePreview(url);
    }
  };

  // Execute Gemini AI plant identification with automatic 3-attempt retry
  const handleIdentifyPlant = async () => {
    // Prevent multiple simultaneous identification requests
    if (isIdentifying) return;

    if (!imagePreview) {
      setErrors((prev) => ({ ...prev, image: 'Please upload a plant photograph first.' }));
      return;
    }

    setIsIdentifying(true);
    setAiError(null);
    setFailedAfterRetries(false);
    setRetryAttempt(1);
    setLoadingStatusText('Connecting to Gemini AI vision...');

    const MAX_ATTEMPTS = 3;
    let lastFriendlyMessage = '';

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        setRetryAttempt(attempt);

        if (attempt === 1) {
          setLoadingStatusText('Analyzing plant foliage, leaves, and patterns with Gemini AI vision...');
        } else {
          setLoadingStatusText(
            `Service temporarily busy. Retrying identification (attempt ${attempt} of ${MAX_ATTEMPTS})...`
          );
          // Short delay between attempts for backoff
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        }

        // --- CALL CENTRALIZED AI API SERVICE ---
        const result: IdentificationResult = await identifyPlant(imagePreview);

        if (!result.isPlant) {
          setAiError(
            result.careNotes ||
              "Gemini AI could not detect clear plant leaves or foliage in this image. You can still customize the details below."
          );
        }

        setAiResult(result);

        // Prepopulate form fields with suggested data (only updating on success!)
        if (result.commonName) setName(result.commonName);
        if (result.botanicalName) setSpecies(result.botanicalName);
        if (['Low light', 'Medium indirect', 'Bright indirect', 'Direct sunlight'].includes(result.light)) {
          setLight(result.light as LightRequirement);
        }
        if (result.wateringDays) setWateringDays(result.wateringDays);
        if (result.fertilizingDays) setFertilizingDays(result.fertilizingDays);
        if (result.pruningDays) setPruningDays(result.pruningDays);
        if (result.careNotes) setNotes(result.careNotes);
        if (result.illustrationType) setIllustrationType(result.illustrationType);

        setErrors({});
        setIsIdentifying(false);
        return; // Finished successfully!
      } catch (err: any) {
        console.warn(`Identification attempt ${attempt} error:`, err);
        lastFriendlyMessage = err?.message || 'Temporary service issue. Please try again.';

        const isTemporary = err instanceof AiApiError ? err.isTemporary : true;
        if (attempt < MAX_ATTEMPTS && isTemporary) {
          continue; // Retry loop
        }
        break;
      }
    }

    // --- ALL RETRIES EXHAUSTED ---
    // 1. Keep the uploaded photograph in imagePreview (never clear it!)
    // 2. Keep all existing form data untouched (never clear form data!)
    // 3. Show friendly message and offer to enter details manually
    setFailedAfterRetries(true);
    setAiError(
      lastFriendlyMessage ||
        'The plant identification service is currently experiencing high demand. Your photo has been preserved above — you can easily enter the plant details manually below and save it to your collection.'
    );
    setIsIdentifying(false);
  };

  const handleFocusForm = () => {
    formSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => {
      nameInputRef.current?.focus();
    }, 300);
  };

  const applyPreset = (preset: typeof COMMON_SPECIES[0]) => {
    setName(preset.name);
    setSpecies(preset.species);
    setLight(preset.light as LightRequirement);
    setWateringDays(preset.water);
    setFertilizingDays(preset.fertilize);
    setPruningDays(preset.prune);
    setIllustrationType(preset.type);
    setRoom(preset.room);
    setNotes(preset.notes); // Overwrites notes cleanly with no stale values
    setImagePreview(preset.imageUrl); // Overwrites photograph cleanly
    setSelectedPreset(preset.name);
    setErrors({});
    setAiError(null);
    setAiResult(null);
    setFailedAfterRetries(false);
    setCatalogNotice(`Populated preset details for "${preset.name}". You can review and edit below.`);
  };

  const applyCatalogItem = (item: PlantCatalogItem) => {
    setName(item.name);
    setSpecies(item.species);
    setLight(item.light);
    setWateringDays(item.wateringDays);
    setFertilizingDays(item.fertilizingDays);
    setPruningDays(item.pruningDays);
    setIllustrationType(item.illustrationType);
    setRoom(item.roomDefault || 'Living Room');
    setNotes(item.careNotes); // Overwrites notes cleanly with no stale values
    setImagePreview(item.imageUrl); // Overwrites photograph cleanly
    setSelectedPreset(item.name);
    setSearchQuery('');
    setIsSearchFocused(false);
    setErrors({});
    setAiError(null);
    setAiResult(null);
    setFailedAfterRetries(false);
    setCatalogNotice(`Populated details for "${item.name}" (${item.species}). You can review and edit below.`);
    setMode('manual');
    setTimeout(() => {
      formSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Please enter a plant name.';
    if (!species.trim()) newErrors.species = 'Please enter or select a species.';
    if (wateringDays < 1) newErrors.watering = 'Watering frequency must be at least 1 day.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const newPlant: Plant = {
      id: `plant-${Date.now()}`,
      name: name.trim(),
      species: species.trim(),
      room,
      light,
      imageUrl: imagePreview || undefined,
      illustrationType: illustrationType || 'generic',
      wateringFrequencyDays: wateringDays,
      fertilizingFrequencyDays: fertilizingDays,
      pruningFrequencyDays: pruningDays,
      lastWatered: lastWatered || getTodayString(),
      lastFertilized: getTodayString(),
      lastPruned: getTodayString(),
      health: 'thriving',
      notes: notes.trim() || undefined,
      difficulty: wateringDays <= 4 ? 'Demanding' : wateringDays <= 10 ? 'Moderate' : 'Easy',
      createdAt: getTodayString(),
    };

    setIsSuccess(true);
    setTimeout(() => {
      onAddPlant(newPlant);
    }, 400);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Editorial Header */}
      <div className="border-b border-stone-200/80 pb-5">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-emerald-950 font-display">
          Add New Plant
        </h1>
        <p className="mt-1 text-sm text-stone-600">
          Search our botanical catalog, identify a plant automatically using Gemini AI vision, or add details manually.
        </p>
      </div>

      {/* Dedicated Plant Search Bar Section */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Search className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-semibold text-stone-900 font-display">
              Search Plant Catalog
            </h2>
          </div>
          <span className="text-xs text-stone-500">
            Search 28+ house & garden species (e.g. Tulip, Monstera, Fiddle Leaf)
          </span>
        </div>

        <div className="relative">
          <div className="flex items-center gap-2 px-3.5 py-2.5 bg-stone-50/80 border border-stone-200/90 rounded-xl focus-within:bg-white focus-within:border-emerald-700 focus-within:ring-2 focus-within:ring-emerald-700/20 transition-all">
            <Search className="w-4 h-4 text-stone-400 shrink-0" />
            <input
              type="text"
              placeholder="Type common name (e.g. Tulip, Snake Plant) or botanical genus (e.g. Tulipa, Ficus)..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchFocused(true);
              }}
              onFocus={() => setIsSearchFocused(true)}
              className="flex-1 bg-transparent text-sm text-stone-900 placeholder:text-stone-400 outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                }}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-md transition-colors"
                aria-label="Clear search input"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Search Results Dropdown Overlay */}
          {isSearchFocused && searchQuery.trim().length > 0 && (
            <>
              <div 
                className="fixed inset-0 z-20" 
                onClick={() => setIsSearchFocused(false)} 
              />
              <div className="absolute left-0 right-0 mt-2 z-30 bg-white rounded-xl border border-stone-200 shadow-xl overflow-hidden max-h-96 overflow-y-auto">
                {searchResults.length > 0 ? (
                  <div className="divide-y divide-stone-100">
                    <div className="px-3.5 py-2 bg-stone-50/90 text-[11px] font-semibold text-stone-500 uppercase tracking-wider flex items-center justify-between">
                      <span>Matching Plant Suggestions ({searchResults.length})</span>
                      <span>Click to auto-populate form</span>
                    </div>
                    {searchResults.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => applyCatalogItem(item)}
                        className="w-full px-3.5 py-3 flex items-center justify-between gap-3 text-left hover:bg-emerald-50/70 active:bg-emerald-100/60 transition-colors group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = '/images/plants/generic.jpg';
                            }}
                            className="w-12 h-12 rounded-lg object-cover border border-stone-200 shrink-0 group-hover:scale-105 transition-transform"
                          />
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-stone-900 group-hover:text-emerald-950 flex items-center gap-2">
                              <span>{item.name}</span>
                              <span className="text-[10px] font-medium text-emerald-800 bg-emerald-50 border border-emerald-200/60 px-1.5 py-0.2 rounded">
                                {item.difficulty}
                              </span>
                            </div>
                            <div className="text-xs font-mono italic text-emerald-700 truncate">
                              {item.species}
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-[11px] text-stone-500">
                              <span className="flex items-center gap-1">
                                <SunMedium className="w-3 h-3 text-amber-600" />
                                {item.light}
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Droplets className="w-3 h-3 text-sky-600" />
                                Water every {item.wateringDays}d
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="shrink-0 flex items-center gap-1 text-xs font-medium text-emerald-700 group-hover:translate-x-0.5 transition-transform">
                          <span>Select</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center space-y-2">
                    <div className="w-10 h-10 mx-auto rounded-full bg-stone-100 text-stone-400 flex items-center justify-center">
                      <Search className="w-5 h-5" />
                    </div>
                    <div className="text-sm font-semibold text-stone-800">
                      No matching plants found for "{searchQuery}"
                    </div>
                    <p className="text-xs text-stone-500 max-w-sm mx-auto">
                      Try searching by common name (e.g., Tulip, Snake Plant, Fern) or botanical genus (e.g., Tulipa, Ficus, Sansevieria). You can also add plant details manually below.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setIsSearchFocused(false);
                      }}
                      className="mt-1 px-3 py-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
                    >
                      Clear search
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Popular Plants Quick Fill Buttons directly under search */}
        <div className="pt-2 border-t border-stone-100 space-y-2">
          <div className="flex items-center justify-between text-xs text-stone-600">
            <span className="font-medium flex items-center gap-1.5 text-emerald-950">
              <Sprout className="w-3.5 h-3.5 text-emerald-700" />
              <span>Popular Plants Quick Fill:</span>
            </span>
            <span className="text-[11px] text-stone-400">Click to fill form instantly</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {COMMON_SPECIES.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => {
                  applyPreset(preset);
                  setMode('manual');
                }}
                className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-all ${
                  selectedPreset === preset.name
                    ? 'bg-emerald-900 text-white border-emerald-900 shadow-xs'
                    : 'bg-stone-50 text-emerald-950 hover:bg-emerald-50 hover:border-emerald-300 border-stone-200/80'
                }`}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        {/* Catalog notice banner if preset/catalog selected */}
        {catalogNotice && (
          <div className="flex items-center justify-between p-3 bg-emerald-50/90 border border-emerald-200/80 rounded-xl text-xs text-emerald-900 animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>{catalogNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setCatalogNotice(null)}
              className="text-emerald-700 hover:text-emerald-900 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      <div className="border-t border-stone-200/60 pt-2">
        <div className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-3">
          Or Choose How to Add:
        </div>
      </div>

      {/* 2 Options Switcher Tabs */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            disabled={isIdentifying}
            onClick={() => setMode('ai')}
            className={`flex-1 flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${
              mode === 'ai'
                ? 'bg-emerald-900 text-white border-emerald-900 shadow-sm ring-2 ring-emerald-900/20'
                : 'bg-white text-stone-700 border-stone-200 hover:border-emerald-600/60 hover:bg-stone-50/80'
            } ${isIdentifying ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  mode === 'ai' ? 'bg-emerald-800 text-emerald-200' : 'bg-emerald-50 text-emerald-700'
                }`}
              >
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-semibold flex items-center gap-2">
                  <span>Identify Plant Using AI</span>
                  <span
                    className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded ${
                      mode === 'ai' ? 'bg-emerald-700 text-emerald-100' : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    Gemini Vision
                  </span>
                </div>
                <div className={`text-xs mt-0.5 ${mode === 'ai' ? 'text-emerald-200' : 'text-stone-500'}`}>
                  Upload a photo & auto-suggest schedules
                </div>
              </div>
            </div>
            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
              mode === 'ai' ? 'border-white bg-white text-emerald-900' : 'border-stone-300'
            }`}>
              {mode === 'ai' && <div className="w-2 h-2 rounded-full bg-emerald-900" />}
            </div>
          </button>

          <button
            type="button"
            disabled={isIdentifying}
            onClick={() => setMode('manual')}
            className={`flex-1 flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${
              mode === 'manual'
                ? 'bg-emerald-900 text-white border-emerald-900 shadow-sm ring-2 ring-emerald-900/20'
                : 'bg-white text-stone-700 border-stone-200 hover:border-emerald-600/60 hover:bg-stone-50/80'
            } ${isIdentifying ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  mode === 'manual' ? 'bg-emerald-800 text-emerald-200' : 'bg-stone-100 text-stone-700'
                }`}
              >
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-semibold">
                  Add Plant Manually
                </div>
                <div className={`text-xs mt-0.5 ${mode === 'manual' ? 'text-emerald-200' : 'text-stone-500'}`}>
                  Enter details and custom schedule yourself
                </div>
              </div>
            </div>
            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
              mode === 'manual' ? 'border-white bg-white text-emerald-900' : 'border-stone-300'
            }`}>
              {mode === 'manual' && <div className="w-2 h-2 rounded-full bg-emerald-900" />}
            </div>
          </button>
        </div>

      {/* OPTION 1: IDENTIFY PLANT USING AI */}
      {mode === 'ai' && (
        <div className="space-y-6">
          {/* Step 1: Upload Photograph Card */}
          <div className="bg-white p-6 rounded-xl border border-stone-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
                  Step 1
                </span>
                <h2 className="text-base font-semibold text-stone-900 font-display">
                  Upload Plant Photograph
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  Take a photo of leaves, stem, or overall pot, or upload an image from your device.
                </p>
              </div>

              {imagePreview && (
                <button
                  type="button"
                  disabled={isIdentifying}
                  onClick={removePhoto}
                  className="text-xs font-medium text-stone-500 hover:text-red-600 disabled:opacity-40 disabled:pointer-events-none transition-colors flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Remove photo</span>
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={isIdentifying}
              className="hidden"
              id="ai-plant-photo-input"
            />

            {imagePreview ? (
              <div className="space-y-4">
                <div className="relative rounded-xl overflow-hidden border border-stone-200/90 bg-stone-100 max-w-md mx-auto group">
                  <img
                    src={imagePreview}
                    alt="Plant to identify"
                    className="w-full h-64 object-cover"
                  />

                  {/* Clean Loading State Overlay while identifying */}
                  {isIdentifying && (
                    <div className="absolute inset-0 bg-emerald-950/70 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center text-white transition-opacity">
                      {/* Scanning animation bar */}
                      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-pulse" />
                      
                      <div className="relative mb-3.5">
                        <div className="w-14 h-14 rounded-full border-2 border-emerald-400/40 border-t-emerald-300 animate-spin flex items-center justify-center" />
                        <Sparkles className="w-6 h-6 text-emerald-300 absolute inset-0 m-auto animate-pulse" />
                      </div>
                      
                      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-300 bg-emerald-900/80 px-2.5 py-0.5 rounded-full border border-emerald-700/50 mb-2">
                        <span>Attempt {retryAttempt} of 3</span>
                      </div>

                      <span className="text-sm font-semibold tracking-wide">
                        {loadingStatusText}
                      </span>
                      <span className="text-xs text-emerald-200/80 mt-1.5 max-w-xs">
                        Detecting botanical species, sunlight exposure, and ideal care schedules...
                      </span>
                    </div>
                  )}

                  {!isIdentifying && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3.5 py-1.5 text-xs font-semibold text-white bg-black/70 hover:bg-black/90 rounded-lg backdrop-blur-xs flex items-center gap-1.5"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        Change Photo
                      </button>
                      <button
                        type="button"
                        onClick={removePhoto}
                        className="p-1.5 text-white bg-red-600/80 hover:bg-red-600 rounded-lg"
                        title="Remove photo"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Identify Plant Trigger Button with Clean State */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleIdentifyPlant}
                    disabled={isIdentifying}
                    aria-busy={isIdentifying}
                    className="w-full sm:w-auto px-7 py-3 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 disabled:bg-emerald-800/80 disabled:cursor-not-allowed rounded-xl shadow-xs transition-all flex items-center justify-center gap-2"
                  >
                    {isIdentifying ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-emerald-200" />
                        <span>Identifying with Gemini AI (Attempt {retryAttempt}/3)...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-emerald-200" />
                        <span>{failedAfterRetries ? 'Retry Identification' : 'Identify Plant'}</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isIdentifying}
                    className="w-full sm:w-auto px-4 py-3 text-xs sm:text-sm font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 disabled:opacity-50 disabled:pointer-events-none rounded-xl transition-colors"
                  >
                    Choose Different Photo
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (!isIdentifying) setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => !isIdentifying && fileInputRef.current?.click()}
                  className={`cursor-pointer border-2 border-dashed rounded-xl p-8 sm:p-10 text-center transition-all ${
                    isDragging
                      ? 'border-emerald-600 bg-emerald-50/50'
                      : 'border-stone-200 hover:border-emerald-500 hover:bg-emerald-50/30'
                  }`}
                >
                  <div className="w-14 h-14 mx-auto rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3">
                    <Upload className="w-7 h-7" />
                  </div>
                  <div className="text-sm font-semibold text-stone-900">
                    Click to upload a plant photograph
                  </div>
                  <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                    Supports JPG, PNG, WebP up to 15MB. Or drag and drop your plant photo here.
                  </p>
                </div>

                {/* Quick Sample Photos for Testing */}
                <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200/80">
                  <div className="text-xs font-medium text-stone-600 mb-2 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Or test instantly with a sample plant photo:</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {SAMPLE_TEST_PHOTOS.map((sample) => (
                      <button
                        key={sample.name}
                        type="button"
                        disabled={isIdentifying}
                        onClick={() => selectSamplePhoto(sample.url)}
                        className="flex items-center gap-2 p-1.5 rounded-lg border border-stone-200 hover:border-emerald-500 bg-white text-left transition-colors group disabled:opacity-50"
                      >
                        <img
                          src={sample.url}
                          alt={sample.name}
                          className="w-9 h-9 rounded object-cover group-hover:scale-105 transition-transform"
                        />
                        <span className="text-xs font-medium text-stone-800 line-clamp-1">
                          {sample.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {errors.image && (
              <p className="text-xs text-red-600 flex items-center gap-1.5 mt-2">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{errors.image}</span>
              </p>
            )}

            {/* Friendly Error Banner with Guidance & Fallback options */}
            {aiError && (
              <div className="p-4 bg-amber-50/90 border border-amber-200/90 rounded-xl text-xs text-amber-900 space-y-3">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1 flex-1">
                    <div className="font-semibold text-amber-950 text-sm">
                      {failedAfterRetries ? 'Identification Service Temporarily Busy' : 'Plant Detection Notice'}
                    </div>
                    <div className="text-amber-900 leading-relaxed">{aiError}</div>
                  </div>
                </div>

                {/* Action shortcuts when identification fails */}
                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-amber-200/60">
                  <button
                    type="button"
                    onClick={handleFocusForm}
                    className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white font-medium rounded-lg text-xs flex items-center gap-1.5 shadow-2xs transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Enter Plant Details Manually Below</span>
                  </button>

                  <button
                    type="button"
                    disabled={isIdentifying}
                    onClick={handleIdentifyPlant}
                    className="px-3 py-1.5 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 font-medium rounded-lg text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <RefreshCw className="w-3 h-3 text-amber-700" />
                    <span>Try Identifying Again</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* AI Identification Result Banner */}
          {aiResult && (
            <div className="bg-gradient-to-br from-emerald-50/90 to-stone-50 p-6 rounded-xl border border-emerald-200 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-emerald-600" />
                      <span>Identified with Gemini AI</span>
                    </div>
                    <h3 className="text-xl font-bold text-emerald-950 font-display">
                      {aiResult.commonName}
                    </h3>
                    <p className="text-xs font-mono italic text-emerald-700">
                      {aiResult.botanicalName}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs px-2.5 py-1 bg-white border border-emerald-200 text-emerald-800 font-semibold rounded-full shadow-2xs">
                    {aiResult.confidence} Confidence
                  </span>
                </div>
              </div>

              {/* Quick AI Care Recommendations Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 bg-white rounded-lg border border-emerald-100/80 shadow-2xs">
                  <div className="text-[11px] font-semibold text-stone-500 uppercase flex items-center gap-1">
                    <SunMedium className="w-3 h-3 text-amber-600" />
                    <span>Sunlight</span>
                  </div>
                  <div className="text-xs font-bold text-stone-900 mt-1">
                    {aiResult.light}
                  </div>
                </div>

                <div className="p-3 bg-white rounded-lg border border-emerald-100/80 shadow-2xs">
                  <div className="text-[11px] font-semibold text-stone-500 uppercase flex items-center gap-1">
                    <Droplets className="w-3 h-3 text-sky-600" />
                    <span>Watering</span>
                  </div>
                  <div className="text-xs font-bold text-stone-900 mt-1">
                    Every {aiResult.wateringDays} days
                  </div>
                </div>

                <div className="p-3 bg-white rounded-lg border border-emerald-100/80 shadow-2xs">
                  <div className="text-[11px] font-semibold text-stone-500 uppercase flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    <span>Fertilizing</span>
                  </div>
                  <div className="text-xs font-bold text-stone-900 mt-1">
                    Every {aiResult.fertilizingDays} days
                  </div>
                </div>

                <div className="p-3 bg-white rounded-lg border border-emerald-100/80 shadow-2xs">
                  <div className="text-[11px] font-semibold text-stone-500 uppercase flex items-center gap-1">
                    <Scissors className="w-3 h-3 text-stone-600" />
                    <span>Pruning</span>
                  </div>
                  <div className="text-xs font-bold text-stone-900 mt-1">
                    Every {aiResult.pruningDays} days
                  </div>
                </div>
              </div>

              {aiResult.careNotes && (
                <div className="text-xs text-stone-600 bg-white/80 p-3 rounded-lg border border-emerald-100">
                  <span className="font-semibold text-emerald-950">Botanist Care Note: </span>
                  {aiResult.careNotes}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Review and Edit Plant Details & Care Schedules */}
          <div ref={formSectionRef} className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-emerald-50/70 border border-emerald-200/60 rounded-xl text-xs text-emerald-900">
              <Info className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>
                {aiResult 
                  ? "Step 2: Review and customize the suggested information below before saving to your collection."
                  : failedAfterRetries
                  ? "Your photograph is saved above. Enter the plant details below to save it to your collection."
                  : "Upload a photo above to auto-fill these fields, or fill them directly."}
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Plant Details */}
              <div className="bg-white p-6 rounded-xl border border-stone-200/80 shadow-xs space-y-5">
                <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                  <h2 className="text-base font-semibold text-stone-900 font-display">
                    {aiResult ? 'Review & Edit Plant Details' : 'Plant Details'}
                  </h2>
                  {aiResult && (
                    <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      Pre-filled with AI suggestions
                    </span>
                  )}
                  {failedAfterRetries && (
                    <span className="text-xs font-medium text-stone-600 bg-stone-100 px-2 py-0.5 rounded">
                      Photo preserved · Manual entry
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Common Name */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                      Common Plant Name *
                    </label>
                    <input
                      ref={nameInputRef}
                      type="text"
                      placeholder="e.g. Monstera Deliciosa, Swiss Cheese Plant"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm bg-white border border-stone-200/90 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 text-stone-900 placeholder:text-stone-400"
                    />
                    {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
                  </div>

                  {/* Botanical Species */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                      Botanical / Scientific Species *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Monstera deliciosa"
                      value={species}
                      onChange={(e) => setSpecies(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm bg-white border border-stone-200/90 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 text-stone-900 placeholder:text-stone-400"
                    />
                    {errors.species && <p className="text-xs text-red-600 mt-1">{errors.species}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Room Location */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                      Room Location
                    </label>
                    <select
                      value={room}
                      onChange={(e) => setRoom(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm bg-white border border-stone-200/90 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 text-stone-900"
                    >
                      <option value="Living Room">Living Room</option>
                      <option value="Bedroom">Bedroom</option>
                      <option value="Kitchen">Kitchen</option>
                      <option value="Balcony Room">Balcony Room</option>
                      <option value="Home Office">Home Office</option>
                      <option value="Bathroom">Bathroom</option>
                      <option value="Patio">Patio</option>
                      <option value="Hallway">Hallway</option>
                    </select>
                  </div>

                  {/* Sunlight Exposure */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                      Sunlight Exposure {aiResult ? '(Suggested)' : ''}
                    </label>
                    <select
                      value={light}
                      onChange={(e) => setLight(e.target.value as LightRequirement)}
                      className="w-full px-3.5 py-2 text-sm bg-white border border-stone-200/90 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 text-stone-900"
                    >
                      <option value="Low light">Low light (tolerates shade)</option>
                      <option value="Medium indirect">Medium indirect sunlight</option>
                      <option value="Bright indirect">Bright indirect sunlight</option>
                      <option value="Direct sunlight">Direct full sunlight</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Care Schedules & Intervals */}
              <div className="bg-white p-6 rounded-xl border border-stone-200/80 shadow-xs space-y-5">
                <h2 className="text-base font-semibold text-stone-900 border-b border-stone-100 pb-3 font-display">
                  Care Schedules & Intervals
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Watering */}
                  <div className="p-3.5 rounded-lg border border-stone-200/70 bg-stone-50/50 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-700">
                      <Droplets className="w-4 h-4 text-sky-600" />
                      <span>Watering Frequency</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-stone-500">Every</span>
                      <input
                        type="number"
                        min="1"
                        max="90"
                        value={wateringDays}
                        onChange={(e) => setWateringDays(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-16 px-2 py-1 text-sm font-mono tabular-nums bg-white border border-stone-200 rounded text-center focus:outline-none focus:ring-1 focus:ring-emerald-700"
                      />
                      <span className="text-xs text-stone-500">days</span>
                    </div>
                  </div>

                  {/* Fertilizing */}
                  <div className="p-3.5 rounded-lg border border-stone-200/70 bg-stone-50/50 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-700">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      <span>Fertilizing Frequency</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-stone-500">Every</span>
                      <input
                        type="number"
                        min="7"
                        max="365"
                        value={fertilizingDays}
                        onChange={(e) => setFertilizingDays(Math.max(1, parseInt(e.target.value) || 7))}
                        className="w-16 px-2 py-1 text-sm font-mono tabular-nums bg-white border border-stone-200 rounded text-center focus:outline-none focus:ring-1 focus:ring-emerald-700"
                      />
                      <span className="text-xs text-stone-500">days</span>
                    </div>
                  </div>

                  {/* Pruning */}
                  <div className="p-3.5 rounded-lg border border-stone-200/70 bg-stone-50/50 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-700">
                      <Scissors className="w-4 h-4 text-amber-700" />
                      <span>Pruning Frequency</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-stone-500">Every</span>
                      <input
                        type="number"
                        min="14"
                        max="365"
                        value={pruningDays}
                        onChange={(e) => setPruningDays(Math.max(1, parseInt(e.target.value) || 14))}
                        className="w-16 px-2 py-1 text-sm font-mono tabular-nums bg-white border border-stone-200 rounded text-center focus:outline-none focus:ring-1 focus:ring-emerald-700"
                      />
                      <span className="text-xs text-stone-500">days</span>
                    </div>
                  </div>
                </div>

                {/* Date Last Watered */}
                <div className="pt-2">
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                    Date Last Watered
                  </label>
                  <input
                    type="date"
                    value={lastWatered}
                    onChange={(e) => setLastWatered(e.target.value)}
                    className="px-3.5 py-2 text-sm bg-white border border-stone-200/90 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 text-stone-900"
                  />
                  <p className="text-xs text-stone-500 mt-1">
                    Your first watering reminder will be calculated starting from this date.
                  </p>
                </div>
              </div>

              {/* Care Notes */}
              <div className="bg-white p-6 rounded-xl border border-stone-200/80 shadow-xs space-y-3">
                <label className="block text-sm font-semibold text-stone-900">
                  Plant Notes & Preferences (Editable)
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Sensitive to dry air, mist weekly, prefers warm ambient temperatures..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-stone-200/90 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 text-stone-900 placeholder:text-stone-400"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-4 py-2.5 text-xs sm:text-sm font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSuccess || isIdentifying}
                  className="px-6 py-2.5 text-xs sm:text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 disabled:bg-emerald-600 rounded-lg shadow-xs transition-colors flex items-center gap-2"
                >
                  {isSuccess ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Saved Plant!</span>
                    </>
                  ) : (
                    <span>Save to Collection</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* OPTION 2: ADD PLANT MANUALLY */}
      {mode === 'manual' && (
        <div className="space-y-6">
          {/* Quick Species Presets */}
          <div className="p-4 bg-emerald-50/70 border border-emerald-100/90 rounded-xl space-y-2.5">
            <div className="text-xs font-semibold text-emerald-900 flex items-center gap-1.5">
              <Sprout className="w-3.5 h-3.5 text-emerald-700" />
              <span>Quick fill from popular plants:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {COMMON_SPECIES.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-all ${
                    selectedPreset === preset.name
                      ? 'bg-emerald-900 text-white border-emerald-900 shadow-xs'
                      : 'bg-white text-emerald-950 hover:bg-emerald-100 hover:text-emerald-900 border-emerald-200/60 shadow-xs'
                  }`}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Section 1: Photograph Upload */}
            <div className="bg-white p-6 rounded-xl border border-stone-200/80 shadow-xs space-y-4">
              <div>
                <label className="block text-sm font-semibold text-stone-900">
                  Plant Photograph (Optional)
                </label>
                <p className="text-xs text-stone-500 mt-0.5">
                  Snap a picture or upload an image file from your computer or phone.
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="manual-plant-photo-input"
              />

              {imagePreview ? (
                <div className="relative rounded-xl overflow-hidden border border-stone-200/90 group bg-stone-100 max-w-sm">
                  <img
                    src={imagePreview}
                    alt="Plant preview"
                    className="w-full h-56 object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-black/60 hover:bg-black/80 rounded-md backdrop-blur-xs"
                    >
                      Change Photo
                    </button>
                    <button
                      type="button"
                      onClick={removePhoto}
                      className="p-1.5 text-white bg-red-600/80 hover:bg-red-600 rounded-md"
                      aria-label="Remove photo"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`cursor-pointer border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                    isDragging
                      ? 'border-emerald-600 bg-emerald-50/50'
                      : 'border-stone-200 hover:border-emerald-500 hover:bg-stone-50/60'
                  }`}
                >
                  <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div className="text-sm font-semibold text-stone-900">
                    Click to upload a photograph
                  </div>
                  <p className="text-xs text-stone-500 mt-1">
                    PNG, JPG or WebP up to 15MB · or drag and drop here
                  </p>
                </div>
              )}

              {errors.image && (
                <p className="text-xs text-red-600">{errors.image}</p>
              )}
            </div>

            {/* Section 2: Basic Plant Information */}
            <div className="bg-white p-6 rounded-xl border border-stone-200/80 shadow-xs space-y-5">
              <h2 className="text-base font-semibold text-stone-900 border-b border-stone-100 pb-3 font-display">
                Plant Details
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Plant Nickname / Common Name */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                    Plant Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Monty, Swiss Cheese Plant"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-white border border-stone-200/90 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 text-stone-900 placeholder:text-stone-400"
                  />
                  {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
                </div>

                {/* Botanical Species */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                    Botanical / Species *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Monstera deliciosa"
                    value={species}
                    onChange={(e) => setSpecies(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-white border border-stone-200/90 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 text-stone-900 placeholder:text-stone-400"
                  />
                  {errors.species && <p className="text-xs text-red-600 mt-1">{errors.species}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Room Location */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                    Room Location
                  </label>
                  <select
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-white border border-stone-200/90 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 text-stone-900"
                  >
                    <option value="Living Room">Living Room</option>
                    <option value="Bedroom">Bedroom</option>
                    <option value="Kitchen">Kitchen</option>
                    <option value="Balcony Room">Balcony Room</option>
                    <option value="Home Office">Home Office</option>
                    <option value="Bathroom">Bathroom</option>
                    <option value="Patio">Patio</option>
                    <option value="Hallway">Hallway</option>
                  </select>
                </div>

                {/* Sunlight Exposure */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                    Sunlight Exposure
                  </label>
                  <select
                    value={light}
                    onChange={(e) => setLight(e.target.value as LightRequirement)}
                    className="w-full px-3.5 py-2 text-sm bg-white border border-stone-200/90 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 text-stone-900"
                  >
                    <option value="Low light">Low light (tolerates shade)</option>
                    <option value="Medium indirect">Medium indirect sunlight</option>
                    <option value="Bright indirect">Bright indirect sunlight</option>
                    <option value="Direct sunlight">Direct full sunlight</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 3: Care Frequency & Schedule */}
            <div className="bg-white p-6 rounded-xl border border-stone-200/80 shadow-xs space-y-5">
              <h2 className="text-base font-semibold text-stone-900 border-b border-stone-100 pb-3 font-display">
                Care Schedules & Intervals
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Watering Frequency */}
                <div className="p-3.5 rounded-lg border border-stone-200/70 bg-stone-50/50 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-700">
                    <Droplets className="w-4 h-4 text-sky-600" />
                    <span>Watering</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-stone-500">Every</span>
                    <input
                      type="number"
                      min="1"
                      max="90"
                      value={wateringDays}
                      onChange={(e) => setWateringDays(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-16 px-2 py-1 text-sm font-mono tabular-nums bg-white border border-stone-200 rounded text-center focus:outline-none focus:ring-1 focus:ring-emerald-700"
                    />
                    <span className="text-xs text-stone-500">days</span>
                  </div>
                </div>

                {/* Fertilizing Frequency */}
                <div className="p-3.5 rounded-lg border border-stone-200/70 bg-stone-50/50 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-700">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>Fertilizing</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-stone-500">Every</span>
                    <input
                      type="number"
                      min="7"
                      max="365"
                      value={fertilizingDays}
                      onChange={(e) => setFertilizingDays(Math.max(1, parseInt(e.target.value) || 7))}
                      className="w-16 px-2 py-1 text-sm font-mono tabular-nums bg-white border border-stone-200 rounded text-center focus:outline-none focus:ring-1 focus:ring-emerald-700"
                    />
                    <span className="text-xs text-stone-500">days</span>
                  </div>
                </div>

                {/* Pruning Frequency */}
                <div className="p-3.5 rounded-lg border border-stone-200/70 bg-stone-50/50 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-700">
                    <Scissors className="w-4 h-4 text-amber-700" />
                    <span>Pruning</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-stone-500">Every</span>
                    <input
                      type="number"
                      min="14"
                      max="365"
                      value={pruningDays}
                      onChange={(e) => setPruningDays(Math.max(1, parseInt(e.target.value) || 14))}
                      className="w-16 px-2 py-1 text-sm font-mono tabular-nums bg-white border border-stone-200 rounded text-center focus:outline-none focus:ring-1 focus:ring-emerald-700"
                    />
                    <span className="text-xs text-stone-500">days</span>
                  </div>
                </div>
              </div>

              {/* Last Watered Date */}
              <div className="pt-2">
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                  Date Last Watered
                </label>
                <input
                  type="date"
                  value={lastWatered}
                  onChange={(e) => setLastWatered(e.target.value)}
                  className="px-3.5 py-2 text-sm bg-white border border-stone-200/90 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 text-stone-900"
                />
                <p className="text-xs text-stone-500 mt-1">
                  Next watering will be automatically calculated starting from this date.
                </p>
              </div>
            </div>

            {/* Section 4: Care Notes */}
            <div className="bg-white p-6 rounded-xl border border-stone-200/80 shadow-xs space-y-3">
              <label className="block text-sm font-semibold text-stone-900">
                Plant Notes & Care Preferences (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Sensitive to dry air, mist weekly, enjoys morning sun on the balcony..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-white border border-stone-200/90 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 text-stone-900 placeholder:text-stone-400"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2.5 text-xs sm:text-sm font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSuccess}
                className="px-6 py-2.5 text-xs sm:text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 disabled:bg-emerald-600 rounded-lg shadow-xs transition-colors flex items-center gap-2"
              >
                {isSuccess ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Saved Plant!</span>
                  </>
                ) : (
                  <span>Save to Collection</span>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
