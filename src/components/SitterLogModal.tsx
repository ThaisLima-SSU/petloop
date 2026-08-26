import { useState } from 'react';
import { Check, Loader2, X } from 'lucide-react';
import type { ActivityType, Pet } from '@/lib/supabase';
import { ACTIVITIES } from '@/lib/activities';

type SitterLogModalProps = {
  pet: Pet;
  userId: string;
  visibleTypes: ActivityType[];
  onSave: (entry: { petId: string; userId: string; type: ActivityType; note: string; createdAt: string }) => Promise<void>;
  onCancel: () => void;
};

function nowLocalValue() {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

export function SitterLogModal({ pet, userId, visibleTypes, onSave, onCancel }: SitterLogModalProps) {
  const [type, setType] = useState<ActivityType>(visibleTypes[0] ?? 'fed');
  const [note, setNote] = useState('');
  const [time, setTime] = useState(nowLocalValue);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await onSave({ petId: pet.id, userId, type, note: note.trim(), createdAt: new Date(time).toISOString() });
      onCancel();
    } catch {
      setError('Could not log care. Please try again.');
      setSaving(false);
    }
  }

  const fieldClass = 'w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-800 font-semibold focus:border-forest-400 focus:outline-none';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 sm:items-center">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-cream-50 p-6 sm:rounded-3xl">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-gray-400">Log care for</p>
            <h3 className="text-lg font-extrabold text-forest-700">{pet.name}</h3>
          </div>
          <button type="button" onClick={onCancel} className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mb-3 text-xs font-bold uppercase tracking-wide text-gray-400">What happened?</p>
        <div className="mb-5 grid grid-cols-3 gap-3">
          {ACTIVITIES.filter((activity) => visibleTypes.includes(activity.type)).map((activity) => {
            const Icon = activity.icon;
            const active = type === activity.type;
            return (
              <button key={activity.type} type="button" onClick={() => setType(activity.type)} className="flex flex-col items-center gap-1.5">
                <span className={`flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all ${active ? 'border-forest-500 bg-forest-50 text-forest-600' : 'border-gray-200 bg-white text-gray-700'}`}>
                  <Icon className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <span className={`text-xs font-bold ${active ? 'text-forest-600' : 'text-gray-500'}`}>{activity.label}</span>
              </button>
            );
          })}
        </div>

        <label className="mb-4 block">
          <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-400">Note (optional)</span>
          <input type="text" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Anything worth noting" className={fieldClass + ' font-normal'} />
        </label>
        <label className="mb-5 block">
          <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-400">Time</span>
          <input type="datetime-local" value={time} onChange={(event) => setTime(event.target.value)} className={fieldClass} />
        </label>

        {error && <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</p>}
        <button type="button" disabled={saving} onClick={handleSave} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-forest-500 px-6 py-3.5 text-base font-extrabold text-white hover:bg-forest-600 disabled:opacity-50">
          {saving ? <><Loader2 className="h-5 w-5 animate-spin" /> Saving…</> : <><Check className="h-5 w-5" /> Save Care Log</>}
        </button>
      </div>
    </div>
  );
}
