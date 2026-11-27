import React, { useState, useMemo } from 'react';
import {
  Sun,
  CloudRain,
  Wind,
  Snowflake,
  MapPin,
  AlertTriangle,
  Sparkles,
  Sprout,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { Plant } from '../../types/plant';
import { IndianSeasonId, KarnatakaClimateZoneId } from '../../types/seasonal';
import {
  INDIAN_SEASONS,
  INDIAN_SEASON_ORDER,
  KARNATAKA_CLIMATE_ZONES,
} from '../../data/indianSeasonalCare';
import {
  getCurrentIndianSeason,
  getPlantsRequiringSeasonalAttention,
} from '../../utils/seasonalCareEngine';
import { PlantIllustration } from '../plants/PlantIllustration';

interface SeasonalCareSectionProps {
  plants: Plant[];
  climateZone: KarnatakaClimateZoneId;
  onChangeClimateZone: (zone: KarnatakaClimateZoneId) => void;
  onOpenPlantDetail: (plant: Plant) => void;
}

const SEASON_STYLE: Record<
  IndianSeasonId,
  {
    icon: React.FC<{ className?: string }>;
    iconBg: string;
    headerTint: string;
    currentText: string;
  }
> = {
  summer: {
    icon: Sun,
    iconBg: 'bg-amber-100 text-amber-700 border-amber-200',
    headerTint: 'from-amber-50/70 via-white to-emerald-50/40',
    currentText: 'text-amber-800',
  },
  monsoon: {
    icon: CloudRain,
    iconBg: 'bg-sky-100 text-sky-700 border-sky-200',
    headerTint: 'from-sky-50/70 via-white to-emerald-50/40',
    currentText: 'text-sky-800',
  },
  'post-monsoon': {
    icon: Wind,
    iconBg: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    headerTint: 'from-emerald-50/70 via-white to-stone-50/50',
    currentText: 'text-emerald-800',
  },
  winter: {
    icon: Snowflake,
    iconBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    headerTint: 'from-indigo-50/60 via-white to-emerald-50/40',
    currentText: 'text-indigo-800',
  },
};

export const SeasonalCareSection: React.FC<SeasonalCareSectionProps> = ({
  plants,
  climateZone,
  onChangeClimateZone,
  onOpenPlantDetail,
}) => {
  const detectedSeason = useMemo(() => getCurrentIndianSeason(), []);
  const [selectedSeason, setSelectedSeason] = useState<IndianSeasonId>(detectedSeason);
  const [isExpanded, setIsExpanded] = useState(true);

  const seasonMeta = INDIAN_SEASONS[selectedSeason];
  const seasonStyle = SEASON_STYLE[selectedSeason];
  const SeasonIcon = seasonStyle.icon;

  const attentionPlants = useMemo(
    () => getPlantsRequiringSeasonalAttention(plants, selectedSeason, climateZone),
    [plants, selectedSeason, climateZone]
  );

  const isViewingCurrentSeason = selectedSeason === detectedSeason;

  return (
    <section
      aria-label="Seasonal Plant Care"
      className="bg-white rounded-xl border border-stone-200/90 shadow-xs overflow-hidden"
    >
      {/* Header Band */}
      <div
        className={`p-5 sm:p-6 bg-gradient-to-r ${seasonStyle.headerTint} ${
          isExpanded ? 'border-b border-stone-200/80' : ''
        } space-y-4`}
      >
        {/* Row 1: Title + Current Season Metadata (Left) & Climate Selector + Collapse (Right) */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5 min-w-0">
            <div
              className={`w-10 h-10 rounded-lg border flex items-center justify-center shrink-0 ${seasonStyle.iconBg}`}
            >
              <SeasonIcon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
                <h2 className="text-lg font-bold text-emerald-950 font-display leading-snug">
                  Seasonal Plant Care
                </h2>
                <span className={`text-xs font-semibold ${seasonStyle.currentText}`}>
                  {seasonMeta.name} ({seasonMeta.monthsLabel})
                </span>
                {isViewingCurrentSeason && (
                  <span className="text-[11px] font-semibold text-emerald-700">
                    · Current Season
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                {seasonMeta.kannadaName} · {seasonMeta.tagline}
              </p>
            </div>
          </div>

          {/* Right Controls: Climate Region Selector + Collapse Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 shrink-0 w-full lg:w-auto">
            <div className="flex items-center gap-2 h-9 bg-white border border-stone-200/90 rounded-lg px-3 flex-1 sm:flex-initial min-w-0">
              <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              <label htmlFor="seasonal-climate-zone" className="sr-only">
                Karnataka &amp; Indian Climate Region
              </label>
              <select
                id="seasonal-climate-zone"
                value={climateZone}
                onChange={(e) => onChangeClimateZone(e.target.value as KarnatakaClimateZoneId)}
                className="w-full sm:w-auto text-xs font-medium text-stone-800 bg-transparent focus:outline-none cursor-pointer truncate pr-1"
              >
                {Object.values(KARNATAKA_CLIMATE_ZONES).map((zone) => (
                  <option key={zone.id} value={zone.id}>
                    {zone.shortLabel}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => setIsExpanded((prev) => !prev)}
              className="inline-flex items-center justify-center gap-1.5 h-9 px-3 text-xs font-medium text-stone-700 hover:text-stone-950 bg-white hover:bg-stone-50 border border-stone-200/90 rounded-lg transition-colors whitespace-nowrap shrink-0"
              aria-expanded={isExpanded}
            >
              <span>{isExpanded ? 'Hide Details' : 'Show Details'}</span>
              {isExpanded ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Row 2: Equal-Width 4-Season Selector Grid (Zero Overflow on Mobile & Desktop) */}
        <div
          role="tablist"
          aria-label="Indian Seasons"
          className="grid grid-cols-2 sm:grid-cols-4 gap-2"
        >
          {INDIAN_SEASON_ORDER.map((seasonId) => {
            const meta = INDIAN_SEASONS[seasonId];
            const TabIcon = SEASON_STYLE[seasonId].icon;
            const isActive = selectedSeason === seasonId;
            return (
              <button
                key={seasonId}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setSelectedSeason(seasonId)}
                className={`flex items-center justify-center gap-1.5 h-9 px-2.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap min-w-0 ${
                  isActive
                    ? 'bg-emerald-900 text-white border-emerald-900 shadow-2xs'
                    : 'bg-white text-stone-700 border-stone-200/90 hover:bg-emerald-50/70 hover:text-emerald-950 hover:border-emerald-300'
                }`}
              >
                <TabIcon className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{meta.name}</span>
                <span
                  className={`text-[10px] hidden xl:inline shrink-0 ${
                    isActive ? 'text-emerald-200' : 'text-stone-400'
                  }`}
                >
                  {meta.monthsLabel.replace(' – ', '–')}
                </span>
              </button>
            );
          })}
        </div>

        {/* Row 3: Overview & Regional Context Note */}
        <div className="space-y-2">
          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
            {seasonMeta.overview}
          </p>
          <div className="flex items-start gap-2 pt-2 border-t border-stone-200/60 text-xs text-stone-600">
            <Info className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{seasonMeta.regionalNotes[climateZone]}</p>
          </div>
        </div>
      </div>

      {/* Expandable Content Body */}
      {isExpanded && (
        <div className="p-5 sm:p-6 space-y-6">
          {/* Subsection 1: Plants Requiring Special Attention */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <h3 className="text-sm font-semibold text-stone-900 font-display">
                  Plants Requiring Special Attention
                </h3>
                <span className="text-xs font-mono tabular-nums text-stone-500">
                  ({attentionPlants.length})
                </span>
              </div>
              <span className="text-xs text-stone-500">
                Select any plant for full seasonal care tips
              </span>
            </div>

            {attentionPlants.length === 0 ? (
              <div className="flex items-center gap-2.5 p-3.5 bg-emerald-50/60 border border-emerald-200/70 rounded-xl text-xs text-emerald-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>
                  All plants in your collection are comfortable during {seasonMeta.name}. Open any plant card to review its tailored seasonal care tips.
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 items-stretch">
                {attentionPlants.slice(0, 6).map(({ plant, advice }) => (
                  <button
                    key={plant.id}
                    type="button"
                    onClick={() => onOpenPlantDetail(plant)}
                    className="flex flex-col p-3.5 rounded-xl border border-stone-200/80 bg-stone-50/50 hover:bg-emerald-50/50 hover:border-emerald-300 text-left transition-colors group h-full"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 rounded-lg overflow-hidden border border-stone-200 shrink-0 bg-stone-100">
                        <PlantIllustration
                          type={plant.illustrationType}
                          imageUrl={plant.imageUrl}
                          className="w-full h-full object-cover"
                          alt={plant.name}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-stone-900 group-hover:text-emerald-950 truncate">
                          {plant.name}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] mt-0.5 truncate">
                          <span
                            className={`font-semibold ${
                              advice.attentionLevel === 'high'
                                ? 'text-amber-700'
                                : 'text-sky-700'
                            }`}
                          >
                            {advice.attentionLevel === 'high' ? 'High Focus' : 'Seasonal Focus'}
                          </span>
                          {advice.kannadaName && (
                            <>
                              <span aria-hidden="true" className="text-stone-300">·</span>
                              <span className="text-emerald-800 truncate">{advice.kannadaName}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-stone-600 mt-2.5 mb-3 line-clamp-2 leading-relaxed">
                      {advice.attentionReason}
                    </p>

                    <div className="mt-auto pt-3 flex items-center justify-between gap-2 text-[11px] text-stone-500 border-t border-stone-200/60">
                      <span className="truncate">
                        {plant.room} · {advice.category}
                      </span>
                      <span className="inline-flex items-center gap-0.5 text-emerald-700 font-semibold shrink-0 group-hover:translate-x-0.5 transition-transform">
                        Tips <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Subsection 2: Equal-Height Seasonal Care Tips & Recommended Activities */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch pt-2 border-t border-stone-100">
            {/* Seasonal Care Tips */}
            <div className="bg-stone-50/70 rounded-xl border border-stone-200/80 p-4 sm:p-5 flex flex-col">
              <div className="flex items-center gap-2 pb-3 border-b border-stone-200/60">
                <Sprout className="w-4 h-4 text-emerald-700 shrink-0" />
                <h3 className="text-sm font-semibold text-stone-900 font-display">
                  {seasonMeta.name} Care Tips
                </h3>
              </div>
              <ul className="space-y-2.5 pt-3 flex-1">
                {seasonMeta.generalTips.map((tip, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2.5 text-xs text-stone-700 leading-relaxed"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Recommended Gardening Activities */}
            <div className="bg-stone-50/70 rounded-xl border border-stone-200/80 p-4 sm:p-5 flex flex-col">
              <div className="flex items-center gap-2 pb-3 border-b border-stone-200/60">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                <h3 className="text-sm font-semibold text-stone-900 font-display">
                  Recommended Gardening Activities
                </h3>
              </div>
              <ul className="space-y-2.5 pt-3 flex-1">
                {seasonMeta.recommendedActivities.map((activity, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2.5 text-xs text-stone-700 leading-relaxed"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{activity}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
