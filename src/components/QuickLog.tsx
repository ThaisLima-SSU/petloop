import { useState, useMemo, useEffect } from 'react';
import { Check, Loader2 } from 'lucide-react';
import type { Pet, User, ActivityType, Schedule } from '@/lib/supabase';
import { ACTIVITIES } from '@/lib/activities';
import { careScheduleFromDb, getScheduledTypesForToday } from '@/lib/schedule';

type QuickLogProps = {
  pets: Pet[];
  users: User[];
  schedules: Schedule[];
  activePetId: string | null;
  onPetChange: (petId: string) => void;
  onSave: (entry: {
    petId: string;
    userId: string;
    type: ActivityType;
    note: string;
    createdAt: string;
  }) => Promise<void>;
  onSaved: () => void;
  initialActivityType?: ActivityType | null;
  initialSelectionKey?: number;
};

function nowLocalValue() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export function QuickLog({ pets, users, schedules, activePetId, onPetChange, onSave, onSaved, initialActivityType = null, initialSelectionKey = 0 }: QuickLogProps) {
  const [userId, setUserId] = useState(users[0]?.id ?? '');
  const [selectedTypes, setSelectedTypes] = useState<Set<ActivityType>>(new Set());
  const [note, setNote] = useState('');
  const [time, setTime] = useState(nowLocalValue);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const petId = activePetId ?? pets[0]?.id ?? '';

  useEffect(() => {
    setSelectedTypes(initialActivityType ? new Set([initialActivityType]) : new Set());
  }, [petId, initialActivityType, initialSelectionKey]);

  const scheduledTypes = useMemo(() => {
    const petSchedules = schedules.filter((s) => s.pet_id === petId);
    const careSchedule = careScheduleFromDb(petSchedules);
    return new Set(getScheduledTypesForToday(careSchedule));
  }, [schedules, petId]);

  const canSave = petId && userId && selectedTypes.size > 0 && !saving;

  function toggleType(type: ActivityType) {
    setSelectedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }

  async function handleSave() {
    if (selectedTypes.size === 0 || !petId || !userId) return;
    setSaving(true);
    setError(null);
    try {
      const createdAt = new Date(time).toISOString();
      for (const type of selectedTypes) {
        await onSave({
          petId,
          userId,
          type,
          note: note.trim(),
          createdAt,
        });
      }
      setSelectedTypes(new Set());
      setNote('');
      setTime(nowLocalValue());
      onSaved();
    } catch {
      setError('Could not save that entry. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  const fieldClass =
    'w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-800 font-semibold focus:border-forest-400 focus:outline-none';

  return (
    <div className="space-y-6">
      {/* Pet + user pickers */}
      <section className="rounded-2xl border border-gray-200 bg-white p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-400">
              Pet
            </span>
            <select
              className={fieldClass}
              value={petId}
              onChange={(e) => onPetChange(e.target.value)}
            >
              {pets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-400">
              Logged by
            </span>
            <select
              className={fieldClass}
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {/* Activity buttons */}
      <section>
        <h3 className="mb-4 px-1 text-xs font-bold uppercase tracking-wide text-gray-400">
          What happened?
        </h3>
        <div className="grid grid-cols-3 gap-4">
          {ACTIVITIES.map((a) => {
            const Icon = a.icon;
            const active = selectedTypes.has(a.type);
            const scheduled = scheduledTypes.has(a.type);
            return (
              <button
                key={a.type}
                type="button"
                disabled={!scheduled}
                onClick={() => scheduled && toggleType(a.type)}
                className={`flex flex-col items-center gap-2 ${!scheduled ? 'cursor-not-allowed' : ''}`}
              >
                <span
                  className={`flex h-16 w-16 items-center justify-center rounded-full border-2 transition-all ${
                    !scheduled
                      ? 'border-gray-100 bg-gray-50 text-gray-300'
                      : active
                        ? 'border-forest-500 bg-forest-50 text-forest-600'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-6 w-6" strokeWidth={1.75} />
                </span>
                <span
                  className={`text-sm font-bold ${
                    !scheduled ? 'text-gray-300' : active ? 'text-forest-600' : 'text-gray-600'
                  }`}
                >
                  {a.label}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Note + time */}
      <section className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5">
        <label className="block">
          <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-400">
            Note (optional)
          </span>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Half a cup of kibble…"
            className={fieldClass + ' font-normal'}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-400">
            Time
          </span>
          <input
            type="datetime-local"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className={fieldClass}
          />
        </label>
      </section>

      {error && (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {error}
        </p>
      )}

      <button
        type="button"
        disabled={!canSave}
        onClick={handleSave}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-forest-500 px-6 py-4 text-base font-extrabold text-white transition-colors hover:bg-forest-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {saving ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" /> Saving…
          </>
        ) : (
          <>
            <Check className="h-5 w-5" /> Save Log Entry
          </>
        )}
      </button>
    </div>
  );
}
