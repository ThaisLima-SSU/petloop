import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type UserRole = 'Owner' | 'Caregiver' | 'Sitter';

export type User = {
  id: string;
  name: string;
  role: UserRole;
  created_at: string;
};

export type Pet = {
  id: string;
  name: string;
  species: string;
  avatar_key: string | null;
  created_at: string;
  vet_name: string | null;
  vet_phone: string | null;
  vet_address: string | null;
  allergies: string | null;
  microchip_number: string | null;
};

export type ActivityType = 'fed' | 'walked' | 'pooped' | 'peed' | 'slept' | 'meds' | 'bath' | 'brushed_teeth';

export type Log = {
  id: string;
  pet_id: string;
  user_id: string;
  type: ActivityType;
  note: string | null;
  created_at: string;
};

export type LogWithUser = Log & {
  users: Pick<User, 'name'> | null;
};

export type Schedule = {
  id: string;
  pet_id: string;
  type: ActivityType;
  label: string | null;
  med_label: string | null;
  time_of_day: string | null;
  frequency: string;
  weekdays: string | null;
  active: boolean;
  note: string | null;
  visible_to_sitter: boolean;
  created_at: string;
};

export type SitterAccess = {
  pet_id: string;
  expires_at: string;
};
