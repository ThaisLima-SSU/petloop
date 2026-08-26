import { useState } from 'react';
import { Check, Loader2, X } from 'lucide-react';
import { PetAvatar, DOG_AVATARS, CAT_AVATARS } from '@/components/PetAvatar';
import { CareScheduleEditor } from '@/components/CareScheduleEditor';
import { getDefaultCareSchedule, type CareSchedule } from '@/lib/schedule';

type AddPetProps = {
  onSave: (pet: {
    name: string;
    species: string;
    avatarKey: string;
    careSchedule: CareSchedule;
  }) => Promise<void>;
  onCancel: () => void;
};

export function AddPet({ onSave, onCancel }: AddPetProps) {
  const [name, setName] = useState('');
  const [species, setSpecies] = useState<'Dog' | 'Cat'>('Dog');
  const [avatarKey, setAvatarKey] = useState<string>('dog-pointed');
  const [careSchedule, setCareSchedule] = useState<CareSchedule>(getDefaultCareSchedule());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const avatars = species === 'Dog' ? [...DOG_AVATARS] : [...CAT_AVATARS];

  function handleSpeciesChange(next: 'Dog' | 'Cat') {
    setSpecies(next);
    setAvatarKey(next === 'Dog' ? DOG_AVATARS[0] : CAT_AVATARS[0]);
  }

  async function handleSave() {
    if (!name.trim()) {
      setError('Please enter a name.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave({ name: name.trim(), species, avatarKey, careSchedule });
    } catch {
      setError('Could not add that pet. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  const fieldClass =
    'w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-800 font-semibold focus:border-forest-400 focus:outline-none';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 sm:items-center">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-cream-50 p-6 sm:rounded-3xl">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-extrabold text-forest-700">Add New Pet</h3>
          <button
            type="button"
            onClick={onCancel}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Name */}
        <label className="mb-5 block">
          <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-400">
            Pet Name
          </span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Bella"
            className={fieldClass + ' font-normal'}
          />
        </label>

        {/* Type */}
        <div className="mb-5">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400">Type</p>
          <div className="grid grid-cols-2 gap-3">
            {(['Dog', 'Cat'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => handleSpeciesChange(s)}
                className={`rounded-xl border-2 py-3 text-sm font-bold transition-all ${
                  species === s
                    ? 'border-forest-500 bg-forest-50 text-forest-600'
                    : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Avatar picker */}
        <div className="mb-5">
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-gray-400">
            Choose Avatar
          </p>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {avatars.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setAvatarKey(key)}
                className={`flex flex-col items-center gap-1 rounded-xl border-2 p-2 transition-all ${
                  avatarKey === key
                    ? 'border-forest-500 bg-forest-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <PetAvatar avatarKey={key} species={species} size={40} />
              </button>
            ))}
          </div>
        </div>

        {/* Care Schedule */}
        <div className="mb-6">
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-gray-400">
            Care Schedule
          </p>
          <CareScheduleEditor value={careSchedule} onChange={setCareSchedule} />
        </div>

        {error && (
          <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {error}
          </p>
        )}

        <button
          type="button"
          disabled={saving}
          onClick={handleSave}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-forest-500 px-6 py-3.5 text-base font-extrabold text-white transition-colors hover:bg-forest-600 disabled:opacity-50"
        >
          {saving ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" /> Adding…
            </>
          ) : (
            <>
              <Check className="h-5 w-5" /> Add Pet
            </>
          )}
        </button>
      </div>
    </div>
  );
}
