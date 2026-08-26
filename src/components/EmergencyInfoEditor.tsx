import { useState } from 'react';
import { Check, Loader2, X, Stethoscope, Phone, MapPin, AlertCircle, Microchip } from 'lucide-react';
import type { Pet } from '@/lib/supabase';

type EmergencyInfoEditorProps = {
  pet: Pet;
  onSave: (updates: EmergencyInfoUpdates) => Promise<void>;
  onCancel: () => void;
};

export type EmergencyInfoUpdates = {
  vet_name: string;
  vet_phone: string;
  vet_address: string;
  allergies: string;
  microchip_number: string;
};

type FieldConfig = {
  key: keyof EmergencyInfoUpdates;
  label: string;
  icon: typeof Stethoscope;
  placeholder: string;
};

const FIELDS: FieldConfig[] = [
  { key: 'vet_name', label: 'Veterinarian', icon: Stethoscope, placeholder: 'Dr. Lena Park' },
  { key: 'vet_phone', label: 'Phone', icon: Phone, placeholder: '(415) 555-0142' },
  { key: 'vet_address', label: 'Clinic Address', icon: MapPin, placeholder: '418 Cedar Ave, San Mateo, CA' },
  { key: 'allergies', label: 'Allergies', icon: AlertCircle, placeholder: 'Chicken, grain' },
  { key: 'microchip_number', label: 'Microchip #', icon: Microchip, placeholder: '985141005678910' },
];

export function EmergencyInfoEditor({ pet, onSave, onCancel }: EmergencyInfoEditorProps) {
  const [values, setValues] = useState<EmergencyInfoUpdates>({
    vet_name: pet.vet_name ?? '',
    vet_phone: pet.vet_phone ?? '',
    vet_address: pet.vet_address ?? '',
    allergies: pet.allergies ?? '',
    microchip_number: pet.microchip_number ?? '',
  });
  const [saving, setSaving] = useState(false);

  function handleChange(key: keyof EmergencyInfoUpdates, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    await onSave(values);
    setSaving(false);
  }

  const fieldClass =
    'w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-800 font-semibold focus:border-forest-400 focus:outline-none';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 sm:items-center">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-cream-50 p-6 sm:rounded-3xl">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-extrabold text-forest-700">Edit Emergency Info</h3>
          <button
            type="button"
            onClick={onCancel}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          {FIELDS.map(({ key, label, icon: Icon, placeholder }) => (
            <label key={key} className="block">
              <span className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-gray-400">
                <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
                {label}
              </span>
              <input
                type="text"
                value={values[key]}
                onChange={(e) => handleChange(key, e.target.value)}
                placeholder={placeholder}
                className={fieldClass + ' font-normal'}
              />
            </label>
          ))}
        </div>

        <button
          type="button"
          disabled={saving}
          onClick={handleSave}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-forest-500 px-6 py-3.5 text-base font-extrabold text-white transition-colors hover:bg-forest-600 disabled:opacity-50"
        >
          {saving ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" /> Saving…
            </>
          ) : (
            <>
              <Check className="h-5 w-5" /> Save Changes
            </>
          )}
        </button>
      </div>
    </div>
  );
}
