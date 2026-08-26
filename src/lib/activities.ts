import {
  Utensils,
  Footprints,
  Moon,
  Pill,
  Droplet,
  PawPrint,
  Bath,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import type { ActivityType } from '@/lib/supabase';

export type ActivityMeta = {
  type: ActivityType;
  label: string;
  icon: LucideIcon;
};

export const ACTIVITIES: ActivityMeta[] = [
  { type: 'fed', label: 'Fed', icon: Utensils },
  { type: 'walked', label: 'Walked', icon: Footprints },
  { type: 'pooped', label: 'Pooped', icon: PawPrint },
  { type: 'peed', label: 'Peed', icon: Droplet },
  { type: 'slept', label: 'Slept', icon: Moon },
  { type: 'meds', label: 'Meds', icon: Pill },
  { type: 'bath', label: 'Bath', icon: Bath },
  { type: 'brushed_teeth', label: 'Brushed Teeth', icon: Sparkles },
];

export const ACTIVITY_MAP: Record<ActivityType, ActivityMeta> = ACTIVITIES.reduce(
  (acc, a) => {
    acc[a.type] = a;
    return acc;
  },
  {} as Record<ActivityType, ActivityMeta>,
);
