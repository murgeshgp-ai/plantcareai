import React, { useState } from 'react';
import { GrowthRecord } from '../../types/growth';
import { formatDatePretty } from '../../utils/dateUtils';
import { TrendingUp, Ruler } from 'lucide-react';

interface GrowthChartProps {
  records: GrowthRecord[]; // Chronologically sorted (oldest to newest)
  plantName: string;
}

export const GrowthChart: React.FC<GrowthChartProps> = ({ records, plantName }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (records.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-stone-200/80 p-8 text-center flex flex-col items-center justify-center min-h-[260px]">
        <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3">
          <TrendingUp className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-semibold text-stone-800">No Growth Measurements Yet</h4>
        <p className="text-xs text-stone-500 max-w-sm mt-1">
          Add your first height and leaf count measurement to begin tracking {plantName}&apos;s progress over time.
        </p>
      </div>
    );
  }

  // Chart dimensions & SVG viewBox
  const width = 640;
  const height = 240;
  const padding = { top: 30, right: 30, bottom: 40, left: 50 };

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Single record special view
  if (records.length === 1) {
    const single = records[0];
    return (
      <div className="bg-white rounded-xl border border-stone-200/80 p-6 flex flex-col items-center justify-center min-h-[240px]">
        <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mb-2">
          <Ruler className="w-5 h-5" />
        </div>
        <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Initial Baseline</span>
        <div className="text-2xl font-bold font-mono text-emerald-950 mt-1">
          {single.heightCm} cm
        </div>
        <div className="text-xs text-stone-500 mt-0.5">
          {single.leafCount} leaves recorded on {formatDatePretty(single.date)}
        </div>
        <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-50 rounded-lg border border-stone-200/70 text-xs text-stone-600">
          <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
          <span>Record a second measurement to unlock the growth trajectory curve.</span>
        </div>
      </div>
    );
  }

  // Calculate scales for 2+ records
  const heights = records.map((r) => r.heightCm);
  const minHeight = Math.max(0, Math.floor(Math.min(...heights) * 0.85));
  const maxHeight = Math.ceil(Math.max(...heights) * 1.15);
  const heightRange = maxHeight - minHeight || 1;

  const points = records.map((record, index) => {
    const x = padding.left + (index / (records.length - 1)) * chartWidth;
    const y = padding.top + chartHeight - ((record.heightCm - minHeight) / heightRange) * chartHeight;
    return { x, y, record, index };
  });

  // SVG path for line
  const linePath = points.reduce((path, pt, idx) => {
    return idx === 0 ? `M ${pt.x} ${pt.y}` : `${path} L ${pt.x} ${pt.y}`;
  }, '');

  // SVG path for filled area under line
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${points[0].x} ${padding.top + chartHeight} Z`;

  // Horizontal grid ticks (4 levels)
  const gridTicks = [0, 0.33, 0.66, 1].map((pct) => {
    const value = Math.round(minHeight + pct * heightRange);
    const y = padding.top + chartHeight - pct * chartHeight;
    return { value, y };
  });

  return (
    <div className="bg-white rounded-xl border border-stone-200/80 p-5 shadow-xs relative">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-700" />
          <h3 className="text-sm font-semibold text-stone-900 font-display">Height Growth Trend</h3>
        </div>
        <span className="text-xs font-mono text-stone-500">
          {records.length} measurements · {records[0].heightCm}cm to {records[records.length - 1].heightCm}cm
        </span>
      </div>

      <div className="relative w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto max-h-64 overflow-visible font-sans"
        >
          <defs>
            <linearGradient id="growthAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
              <stop offset="90%" stopColor="#10b981" stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {/* Grid lines & Y-axis labels */}
          {gridTicks.map((tick, i) => (
            <g key={i}>
              <line
                x1={padding.left}
                y1={tick.y}
                x2={width - padding.right}
                y2={tick.y}
                stroke="#e5e7eb"
                strokeDasharray="3 3"
                strokeWidth="1"
              />
              <text
                x={padding.left - 8}
                y={tick.y + 4}
                textAnchor="end"
                className="text-[10px] fill-stone-400 font-mono font-medium"
              >
                {tick.value} cm
              </text>
            </g>
          ))}

          {/* Area fill */}
          <path d={areaPath} fill="url(#growthAreaGradient)" />

          {/* Trend line */}
          <path
            d={linePath}
            fill="none"
            stroke="#059669"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* X-axis labels and points */}
          {points.map((pt) => {
            const isHovered = hoveredIndex === pt.index;
            return (
              <g key={pt.record.id} className="cursor-pointer">
                {/* Vertical hover indicator */}
                {isHovered && (
                  <line
                    x1={pt.x}
                    y1={padding.top}
                    x2={pt.x}
                    y2={padding.top + chartHeight}
                    stroke="#059669"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                  />
                )}

                {/* Data point circle */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 6 : 4.5}
                  fill={isHovered ? '#047857' : '#10b981'}
                  stroke="#ffffff"
                  strokeWidth="2"
                  className="transition-all duration-150"
                  onMouseEnter={() => setHoveredIndex(pt.index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />

                {/* X-axis date label */}
                <text
                  x={pt.x}
                  y={height - 12}
                  textAnchor="middle"
                  className={`text-[10px] font-mono transition-colors ${
                    isHovered ? 'fill-emerald-800 font-bold' : 'fill-stone-400'
                  }`}
                >
                  {formatDatePretty(pt.record.date)}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip Box */}
        {hoveredIndex !== null && points[hoveredIndex] && (
          <div
            className="absolute z-10 pointer-events-none bg-stone-900/90 text-white text-xs rounded-lg px-3 py-2 shadow-lg backdrop-blur-xs transform -translate-x-1/2 -translate-y-full mb-2"
            style={{
              left: `${(points[hoveredIndex].x / width) * 100}%`,
              top: `${(points[hoveredIndex].y / height) * 100}%`,
            }}
          >
            <div className="font-semibold text-emerald-300">
              {formatDatePretty(points[hoveredIndex].record.date)}
            </div>
            <div className="flex items-center gap-2 mt-0.5 font-mono">
              <span>{points[hoveredIndex].record.heightCm} cm</span>
              <span className="text-stone-400">·</span>
              <span>{points[hoveredIndex].record.leafCount} leaves</span>
            </div>
            {points[hoveredIndex].record.notes && (
              <div className="text-[11px] text-stone-300 mt-1 max-w-[180px] truncate italic">
                &ldquo;{points[hoveredIndex].record.notes}&rdquo;
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
