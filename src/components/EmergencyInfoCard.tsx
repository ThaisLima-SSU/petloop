import { HeartPulse, Stethoscope, Phone, MapPin, AlertCircle, Microchip, Pencil } from 'lucide-react';
import type { Pet } from '@/lib/supabase';

type EmergencyInfoCardProps = {
  pet: Pet;
  readOnly?: boolean;
  onEdit?: () => void;
};

type FieldKey = 'vet_name' | 'vet_phone' | 'vet_address' | 'allergies' | 'microchip_number';

const FIELDS: { key: FieldKey; label: string; icon: typeof Stethoscope }[] = [
  { key: 'vet_name', label: 'Veterinarian', icon: Stethoscope },
  { key: 'vet_phone', label: 'Phone', icon: Phone },
  { key: 'vet_address', label: 'Clinic Address', icon: MapPin },
  { key: 'allergies', label: 'Allergies', icon: AlertCircle },
  { key: 'microchip_number', label: 'Microchip #', icon: Microchip },
];

export function EmergencyInfoCard({ pet, readOnly = false, onEdit }: EmergencyInfoCardProps) {
  const hasAnyInfo = FIELDS.some((f) => pet[f.key]);

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HeartPulse className="h-5 w-5 text-rose-500" strokeWidth={1.75} />
          <h3 className="text-sm font-bold uppercase tracking-wide text-gray-500">
            Emergency Info
          </h3>
        </div>
        {!readOnly && onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold text-gray-500 hover:bg-gray-50"
          >
            <Pencil className="h-3.5 w-3.5" strokeWidth={1.75} /> Edit
          </button>
        )}
      </div>

      {hasAnyInfo ? (
        <dl className="space-y-3.5">
          {FIELDS.map(({ key, label, icon: Icon }) => {
            const value = pet[key];
            if (!value) return null;
            return (
              <div key={key} className="flex items-start gap-3">
                <span className="mt-0.5 text-gray-400">
                  <Icon className="h-4 w-4" strokeWidth={1.75} />
                </span>
                <div className="min-w-0 flex-1">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    {label}
                  </dt>
                  <dd className="text-sm font-semibold text-gray-800">{value}</dd>
                </div>
              </div>
            );
          })}
        </dl>
      ) : (
        <div className="py-4 text-center">
          <p className="text-sm font-semibold text-gray-500">No emergency info added yet</p>
          {!readOnly && onEdit && (
            <p className="mt-1 text-xs text-gray-400">
              Tap Edit to add vet contacts, allergies, and microchip details.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
