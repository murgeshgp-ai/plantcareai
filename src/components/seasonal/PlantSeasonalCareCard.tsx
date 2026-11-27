import React, { useState, useMemo } from 'react';
import {
  Sun,
  CloudRain,
  Wind,
  Snowflake,
  Droplets,
  SunMedium,
  Sprout,
  Sparkles,
  Scissors,
  Bug,
  ShieldAlert,
  Info,
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
  getPlantSeasonalCare,
} from '../../utils/seasonalCareEngine';

interface PlantSeasonalCareCardProps {
  plant: Plant;
  climateZone: KarnatakaClimateZoneId;
}

const SEASON_ICONS: Record<IndianSeasonId, React.FC<{ className?: string }>> = {
  summer: Sun,
  monsoon: CloudRain,
  'post-monsoon': Wind,
  winter: Snowflake,
};

export const PlantSeasonalCareCard: React.FC<PlantSeasonalCareCardProps> = ({
  plant,
  climateZone,
}) => {
  const currentSeason = useMemo(() => getCurrentIndianSeason(), []);
  const [selectedSeason, setSelectedSeason] = useState<IndianSeasonId>(currentSeason);

  const advice = useMemo(
    () => getPlantSeasonalCare(plant, selectedSeason, climateZone),
    [plant, selectedSeason, climateZone]
  );

  const seasonMeta = INDIAN_SEASONS[selectedSeason];
  const zoneMeta = KARNATAKA_CLIMATE_ZONES[climateZone];
  const SeasonIcon = SEASON_ICONS[selectedSeason];

  const guidanceRows = [
    {
      label: 'Watering Frequency',
      value: advice.watering,
      icon: Droplets,
      iconColor: 'text-sky-600',
      iconBg: 'bg-sky-50',
    },
    {
      label: 'Sunlight Exposure',
      value: advice.sunlight,
      icon: SunMedium,
      iconColor: 'text-amber-600',
      iconBg: 'bg-amber-50',
    },
    {
      label: 'Soil Moisture',
      value: advice.soilMoisture,
      icon: Sprout,
      iconColor: 'text-emerald-700',
      iconBg: 'bg-emerald-50',
    },
    {
      label: 'Fertilizer',
      value: advice.fertilizer,
      icon: Sparkles,
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-50',
    },
    {
      label: 'Pruning',
      value: advice.pruning,
      icon: Scissors,
      iconColor: 'text-amber-700',
      iconBg: 'bg-amber-50',
    },
    {
      label: 'Pest & Disease Prevention',
      value: advice.pestAndDisease,
      icon: Bug,
      iconColor: 'text-rose-600',
      iconBg: 'bg-rose-50',
    },
    {
      label: 'Heat & Rain Protection',
      value: advice.heatAndRainProtection,
      icon: ShieldAlert,
      iconColor: 'text-indigo-600',
      iconBg: 'bg-indigo-50',
    },
  ];

  return (
    <div className="p-4 sm:p-5 rounded-2xl border border-emerald-200/80 bg-emerald-50/35 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-200/60 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center justify-center shrink-0">
            <SeasonIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-emerald-950 font-display flex items-center gap-1.5 flex-wrap">
              <span>Seasonal Care Tips</span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white border border-emerald-200 text-emerald-800">
                {seasonMeta.name} ({seasonMeta.monthsLabel})
              </span>
            </h3>
            <p className="text-[11px] text-stone-500 mt-0.5">
              Tailored for {advice.category} · {zoneMeta.shortLabel}
            </p>
          </div>
        </div>

        <span
          className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border self-start sm:self-auto ${
            advice.attentionLevel === 'high'
              ? 'bg-amber-50 text-amber-800 border-amber-200'
              : advice.attentionLevel === 'moderate'
              ? 'bg-sky-50 text-sky-800 border-sky-200'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}
        >
          {advice.attentionLevel === 'high'
            ? 'Needs Extra Attention'
            : advice.attentionLevel === 'moderate'
            ? 'Seasonal Check Advised'
            : 'Comfortable Season'}
        </span>
      </div>

      {/* Compact Season Selector */}
      <div className="flex flex-wrap gap-1.5">
        {INDIAN_SEASON_ORDER.map((seasonId) => {
          const meta = INDIAN_SEASONS[seasonId];
          const isActive = selectedSeason === seasonId;
          return (
            <button
              key={seasonId}
              type="button"
              onClick={() => setSelectedSeason(seasonId)}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-lg border transition-colors ${
                isActive
                  ? 'bg-emerald-800 text-white border-emerald-800'
                  : 'bg-white text-stone-600 border-stone-200 hover:bg-emerald-50 hover:text-emerald-900'
              }`}
            >
              {meta.name}
              {seasonId === currentSeason ? ' · Now' : ''}
            </button>
          );
        })}
      </div>

      {/* Attention Summary */}
      <div className="p-3 bg-white rounded-xl border border-stone-200/70 text-xs text-stone-700 leading-relaxed">
        <span className="font-semibold text-emerald-950">Seasonal Focus: </span>
        {advice.attentionReason}
      </div>

      {/* 7 Seasonal Care Aspects */}
      <div className="grid grid-cols-1 gap-2">
        {guidanceRows.map((row) => {
          const Icon = row.icon;
          return (
            <div
              key={row.label}
              className="flex items-start gap-2.5 p-2.5 bg-white/95 rounded-xl border border-stone-200/70"
            >
              <div
                className={`w-7 h-7 rounded-lg ${row.iconBg} ${row.iconColor} flex items-center justify-center shrink-0 mt-0.5`}
              >
                <Icon className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-semibold text-stone-900">
                  {row.label}
                </div>
                <p className="text-xs text-stone-600 leading-relaxed mt-0.5">
                  {row.value}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Honest Disclaimer */}
      <div className="flex items-start gap-1.5 text-[10px] text-stone-500 leading-normal">
        <Info className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
        <span>
          General seasonal guidance for {zoneMeta.shortLabel} ({seasonMeta.kannadaName}). Adjust for sudden local heatwaves or rain spells; your existing care schedule is never modified automatically.
        </span>
      </div>
    </div>
  );
};
