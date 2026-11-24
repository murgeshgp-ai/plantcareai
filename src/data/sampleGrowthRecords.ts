import { GrowthRecord } from '../types/growth';
import { addDays, getTodayString } from '../utils/dateUtils';

const today = getTodayString();

export const INITIAL_GROWTH_RECORDS: GrowthRecord[] = [
  // Monstera Deliciosa (plant-1)
  {
    id: 'growth-m1',
    plantId: 'plant-1',
    date: addDays(today, -60),
    heightCm: 42,
    leafCount: 5,
    photoUrl: '/images/plants/monstera.jpg',
    notes: 'Brought home from botanical greenhouse. Healthy roots in peat moss.',
    createdAt: addDays(today, -60),
  },
  {
    id: 'growth-m2',
    plantId: 'plant-1',
    date: addDays(today, -30),
    heightCm: 48,
    leafCount: 6,
    notes: 'Gorgeous new fenestrated leaf unfurling with 4 perforations!',
    createdAt: addDays(today, -30),
  },
  {
    id: 'growth-m3',
    plantId: 'plant-1',
    date: addDays(today, -5),
    heightCm: 55,
    leafCount: 7,
    notes: 'Top aerial root reached the moss pole. Vigorous upward stem growth.',
    createdAt: addDays(today, -5),
  },

  // Fiddle Leaf Fig (plant-2)
  {
    id: 'growth-f1',
    plantId: 'plant-2',
    date: addDays(today, -90),
    heightCm: 74,
    leafCount: 12,
    photoUrl: '/images/plants/fig.jpg',
    notes: 'Repotted into 12-inch terracotta planter with organic potting mix.',
    createdAt: addDays(today, -90),
  },
  {
    id: 'growth-f2',
    plantId: 'plant-2',
    date: addDays(today, -45),
    heightCm: 79,
    leafCount: 13,
    notes: 'Bud sheath dropped; fresh glossy violin leaf hardening off nicely.',
    createdAt: addDays(today, -45),
  },
  {
    id: 'growth-f3',
    plantId: 'plant-2',
    date: addDays(today, -10),
    heightCm: 83,
    leafCount: 15,
    notes: 'Two new leaves sprouted together at the top crown.',
    createdAt: addDays(today, -10),
  },

  // Snake Plant (plant-3)
  {
    id: 'growth-s1',
    plantId: 'plant-3',
    date: addDays(today, -75),
    heightCm: 35,
    leafCount: 6,
    photoUrl: '/images/plants/snake.jpg',
    notes: 'Sturdy sword-like upright growth in bedroom window.',
    createdAt: addDays(today, -75),
  },
  {
    id: 'growth-s2',
    plantId: 'plant-3',
    date: addDays(today, -35),
    heightCm: 38,
    leafCount: 7,
    notes: 'A little pup emerged from the soil edge near rim.',
    createdAt: addDays(today, -35),
  },
  {
    id: 'growth-s3',
    plantId: 'plant-3',
    date: addDays(today, -8),
    heightCm: 41,
    leafCount: 8,
    notes: 'Pup has developed two distinct vertical shoots.',
    createdAt: addDays(today, -8),
  },

  // Peace Lily (plant-4)
  {
    id: 'growth-p1',
    plantId: 'plant-4',
    date: addDays(today, -40),
    heightCm: 28,
    leafCount: 9,
    photoUrl: '/images/plants/peacelily.jpg',
    notes: 'Positioned in soft morning light; foliage deep green and lush.',
    createdAt: addDays(today, -40),
  },
  {
    id: 'growth-p2',
    plantId: 'plant-4',
    date: addDays(today, -12),
    heightCm: 33,
    leafCount: 11,
    notes: 'Two elegant white spathes bloomed; leaf canopy filled out.',
    createdAt: addDays(today, -12),
  },
];
