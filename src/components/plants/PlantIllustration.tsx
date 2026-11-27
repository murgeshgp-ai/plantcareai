import React, { useState, useEffect } from 'react';
import { Plant } from '../../types/plant';
import { Sprout } from 'lucide-react';

interface PlantIllustrationProps {
  type: Plant['illustrationType'];
  imageUrl?: string;
  className?: string;
  alt?: string;
}

export const DEFAULT_PLANT_PHOTOS: Record<Plant['illustrationType'], string> = {
  monstera: '/images/plants/monstera.jpg',
  fig: '/images/plants/fig.jpg',
  snake: '/images/plants/snake.jpg',
  peacelily: '/images/plants/peacelily.jpg',
  pothos: '/images/plants/pothos.jpg',
  calathea: '/images/plants/calathea.jpg',
  succulent: '/images/plants/succulent.jpg',
  generic: '/images/plants/generic.jpg',
};

export const PlantIllustration: React.FC<PlantIllustrationProps> = ({
  type,
  imageUrl,
  className = 'w-full h-48',
  alt = 'Plant photograph',
}) => {
  const [hasCustomError, setHasCustomError] = useState(false);
  const [hasDefaultError, setHasDefaultError] = useState(false);

  useEffect(() => {
    setHasCustomError(false);
    setHasDefaultError(false);
  }, [imageUrl, type]);

  // If user provided an imageUrl and it hasn't failed, show it; otherwise use the realistic botanical photo
  const defaultPhoto = DEFAULT_PLANT_PHOTOS[type] || DEFAULT_PLANT_PHOTOS.generic;
  const isUsingCustom = Boolean(imageUrl && !hasCustomError);
  const currentSrc = isUsingCustom ? imageUrl : (!hasDefaultError ? defaultPhoto : null);

  if (currentSrc) {
    return (
      <div className={`relative overflow-hidden bg-stone-100 ${className}`}>
        <img
          src={currentSrc}
          alt={alt}
          loading="lazy"
          onError={() => {
            if (isUsingCustom) {
              setHasCustomError(true);
            } else {
              setHasDefaultError(true);
            }
          }}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
        />
      </div>
    );
  }

  // Graceful fallback with gentle botanical aesthetic
  return (
    <div className={`relative overflow-hidden flex flex-col items-center justify-center bg-gradient-to-b from-emerald-50/80 via-stone-50 to-emerald-100/50 text-emerald-900 ${className}`}>
      <div className="w-12 h-12 rounded-full bg-white/90 border border-emerald-200 shadow-2xs flex items-center justify-center mb-1">
        <Sprout className="w-6 h-6 text-emerald-700" />
      </div>
      <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-800/80">
        {type}
      </span>
    </div>
  );
};
