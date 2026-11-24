import React from 'react';
import { HealthLabel } from '../../types/health';
import { getHealthLabel, getHealthBadgeColors } from '../../utils/healthCalculator';

interface HealthScoreBadgeProps {
  score: number;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showLabel?: boolean;
  labelPosition?: 'bottom' | 'right';
  className?: string;
  scoreDelta?: number | null;
}

export const HealthScoreBadge: React.FC<HealthScoreBadgeProps> = ({
  score,
  size = 'md',
  showLabel = false,
  labelPosition = 'right',
  className = '',
  scoreDelta,
}) => {
  const safeScore = Math.max(0, Math.min(100, Math.round(score)));
  const label: HealthLabel = getHealthLabel(safeScore);
  const colors = getHealthBadgeColors(safeScore);

  // Dimension settings
  const sizeMap = {
    xs: { dim: 28, stroke: 3, radius: 10.5, font: 'text-[10px]', subFont: 'text-[8px]' },
    sm: { dim: 36, stroke: 3.5, radius: 13.5, font: 'text-xs font-bold', subFont: 'text-[9px]' },
    md: { dim: 48, stroke: 4.5, radius: 18, font: 'text-sm font-bold', subFont: 'text-[10px]' },
    lg: { dim: 68, stroke: 6, radius: 26, font: 'text-lg font-bold', subFont: 'text-xs' },
    xl: { dim: 88, stroke: 7.5, radius: 34, font: 'text-2xl font-bold', subFont: 'text-sm' },
  };

  const { dim, stroke, radius, font } = sizeMap[size];
  const center = dim / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (safeScore / 100) * circumference;

  const ring = (
    <div className="relative inline-flex items-center justify-center shrink-0">
      <svg
        width={dim}
        height={dim}
        className="transform -rotate-90"
        viewBox={`0 0 ${dim} ${dim}`}
        aria-hidden="true"
      >
        {/* Track circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke="#e7e5e4" /* stone-200 */
          strokeWidth={stroke}
          fill="transparent"
        />
        {/* Progress indicator circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke={colors.stroke}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      {/* Center numerical score */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`font-mono tabular-nums leading-none ${font} ${colors.text}`}>
          {safeScore}
        </span>
      </div>
    </div>
  );

  if (!showLabel) {
    return <div className={`inline-flex items-center ${className}`}>{ring}</div>;
  }

  return (
    <div
      className={`inline-flex ${
        labelPosition === 'bottom' ? 'flex-col items-center gap-1.5' : 'flex-row items-center gap-2.5'
      } ${className}`}
    >
      {ring}
      <div className={labelPosition === 'bottom' ? 'text-center' : 'text-left'}>
        <div className={`text-xs font-semibold ${colors.text} leading-tight`}>
          {label}
        </div>
        <div className="text-[10px] text-stone-500 font-medium">
          Health Score
          {scoreDelta !== undefined && scoreDelta !== null && scoreDelta !== 0 && (
            <span
              className={`ml-1 font-mono font-semibold ${
                scoreDelta > 0 ? 'text-emerald-700' : 'text-rose-600'
              }`}
            >
              {scoreDelta > 0 ? `+${scoreDelta}` : scoreDelta}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
