import { useCallback, useEffect, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  PawPrint,
  Pencil,
  Trash2,
  Check,
  Loader2,
  X,
} from 'lucide-react';
import { supabase, type Pet, type LogWithUser, type ActivityType } from '@/lib/supabase';
import { ACTIVITIES, ACTIVITY_MAP } from '@/lib/activities';
import { PetSwitcher } from '@/components/PetSwitcher';
import { groupLogs } from '@/lib/logs';

type HistoryProps = {
  pets: Pet[];
  pet: Pet | null;
  onPetChange: (petId: string) => void;
  canDelete?: boolean;
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function toLocalDateInput(d: Date) {
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

function toLocalDateTimeInput(d: Date) {
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

function dayRange(dateStr: string) {
  const start = new Date(dateStr + 'T00:00:00');
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start: start.toISOString(), end: end.toISOString() };
}

export function History({ pets, pet, onPetChange, canDelete = true }: HistoryProps) {
  const [date, setDate] = useState(toLocalDateInput(new Date()));
  const [logs, setLogs] = useState<LogWithUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<LogWithUser | null>(null);
  const [editingGroup, setEditingGroup] = useState<LogWithUser[] | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingGroup, setDeletingGroup] = useState<LogWithUser[] | null>(null);

  const loadLogs = useCallback(async (petId: string, dateStr: string) => {
    setLoading(true);
    const { start, end } = dayRange(dateStr);
    const { data, error } = await supabase
      .from('logs')
      .select('id, pet_id, user_id, type, note, created_at, users(name)')
      .eq('pet_id', petId)
      .gte('created_at', start)
      .lt('created_at', end)
      .order('created_at', { ascending: false });
    if (!error && data) {
      setLogs(data as unknown as LogWithUser[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (pet) loadLogs(pet.id, date);
  }, [pet, date, loadLogs]);

  function shiftDay(delta: number) {
    const d = new Date(date + 'T00:00:00');
    d.setDate(d.getDate() + delta);
    setDate(toLocalDateInput(d));
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from('logs').delete().eq('id', id);
    if (!error && pet) {
      setDeletingId(null);
      loadLogs(pet.id, date);
    }
  }

  async function handleDeleteGroup(group: LogWithUser[]) {
    const ids = group.map((l) => l.id);
    const { error } = await supabase.from('logs').delete().in('id', ids);
    if (!error && pet) {
      setDeletingGroup(null);
      loadLogs(pet.id, date);
    }
  }

  async function handleEditSave(updated: {
    id: string;
    type: ActivityType;
    note: string;
    created_at: string;
  }) {
    const { error } = await supabase
      .from('logs')
      .update({
        type: updated.type,
        note: updated.note || null,
        created_at: updated.created_at,
      })
      .eq('id', updated.id);
    if (!error && pet) {
      setEditing(null);
      loadLogs(pet.id, date);
    }
  }

  async function handleGroupEditSave(updated: {
    kept: { id: string; type: ActivityType }[];
    note: string;
    created_at: string;
    removedIds: string[];
  }) {
    const createdAt = updated.created_at;
    const noteValue = updated.note || null;

    for (const item of updated.kept) {
      const { error } = await supabase
        .from('logs')
        .update({ type: item.type, note: noteValue, created_at: createdAt })
        .eq('id', item.id);
      if (error) {
        return;
      }
    }

    if (updated.removedIds.length > 0) {
      const { error } = await supabase.from('logs').delete().in('id', updated.removedIds);
      if (error) return;
    }

    if (pet) {
      setEditingGroup(null);
      loadLogs(pet.id, date);
    }
  }

  const prettyDate = new Date(date + 'T00:00:00').toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  if (!pet) {
    return <p className="mt-16 text-center text-gray-400">No pet selected.</p>;
  }

  const groups = groupLogs(logs);

  return (
    <div className="space-y-6">
      <PetSwitcher pets={pets} activePet={pet} onPetChange={onPetChange} />

      {/* Date picker */}
      <section className="rounded-2xl border border-gray-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => shiftDay(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-gray-300"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
              History
            </p>
            <p className="text-lg font-extrabold text-forest-700">{prettyDate}</p>
          </div>
          <button
            type="button"
            onClick={() => shiftDay(1)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-gray-300"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-3">
          <input
            type="date"
            value={date}
            max={toLocalDateInput(new Date())}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 focus:border-forest-400 focus:outline-none"
          />
        </div>
      </section>

      {/* Logs */}
      <section>
        {loading ? (
          <p className="mt-8 text-center text-sm text-gray-400">Loading…</p>
        ) : logs.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center">
            <p className="font-semibold text-gray-600">No activity logged on this date</p>
            <p className="mt-1 text-sm text-gray-400">
              Pick another date or log something new from the Log tab.
            </p>
          </div>
        ) : (
          <ul className="space-y-2.5">
            {groups.map((group) => {
              if (group.length === 1) {
                const log = group[0];
                const meta = ACTIVITY_MAP[log.type];
                const Icon = meta?.icon ?? PawPrint;
                return (
                  <li
                    key={log.id}
                    className="rounded-2xl border border-gray-200 bg-white p-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-200 text-gray-700">
                        <Icon className="h-4.5 w-4.5" strokeWidth={1.75} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-gray-800">{meta?.label ?? log.type}</p>
                        {log.note && (
                          <p className="truncate text-sm text-gray-400">{log.note}</p>
                        )}
                        <p className="text-xs text-gray-400">
                          by {log.users?.name ?? 'Someone'}
                        </p>
                      </div>
                      <span className="shrink-0 text-sm font-semibold text-gray-400">
                        {formatTime(log.created_at)}
                      </span>
                    </div>
                    <div className="mt-3 flex gap-2 border-t border-gray-100 pt-3">
                      <button
                        type="button"
                        onClick={() => setEditing(log)}
                        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-gray-500 hover:bg-gray-50"
                      >
                        <Pencil className="h-3.5 w-3.5" strokeWidth={1.75} /> Edit
                      </button>
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => setDeletingId(log.id)}
                          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-rose-500 hover:bg-rose-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} /> Delete
                        </button>
                      )}
                    </div>
                  </li>
                );
              }
              const note = group.find((l) => l.note)?.note;
              const userName = group[0].users?.name ?? 'Someone';
              const labels = group.map((l) => ACTIVITY_MAP[l.type]?.label ?? l.type);
              return (
                <li
                  key={group.map((l) => l.id).join('-')}
                  className="rounded-2xl border border-gray-200 bg-white p-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex shrink-0 flex-wrap gap-1.5">
                      {group.map((log) => {
                        const meta = ACTIVITY_MAP[log.type];
                        const Icon = meta?.icon ?? PawPrint;
                        return (
                          <div
                            key={log.id}
                            className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-700"
                          >
                            <Icon className="h-4.5 w-4.5" strokeWidth={1.75} />
                          </div>
                        );
                      })}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-gray-800">{labels.join(', ')}</p>
                      {note && (
                        <p className="truncate text-sm text-gray-400">{note}</p>
                      )}
                      <p className="text-xs text-gray-400">by {userName}</p>
                    </div>
                    <span className="shrink-0 text-sm font-semibold text-gray-400">
                      {formatTime(group[0].created_at)}
                    </span>
                  </div>
                  <div className="mt-3 flex gap-2 border-t border-gray-100 pt-3">
                    <button
                      type="button"
                      onClick={() => setEditingGroup(group)}
                      className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-gray-500 hover:bg-gray-50"
                    >
                      <Pencil className="h-3.5 w-3.5" strokeWidth={1.75} /> Edit
                    </button>
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => setDeletingGroup(group)}
                        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-rose-500 hover:bg-rose-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} /> Delete
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Edit modal (single entry) */}
      {editing && (
        <EditModal
          log={editing}
          onSave={handleEditSave}
          onCancel={() => setEditing(null)}
        />
      )}

      {/* Edit modal (group) */}
      {editingGroup && (
        <GroupEditModal
          group={editingGroup}
          onSave={handleGroupEditSave}
          onCancel={() => setEditingGroup(null)}
        />
      )}

      {/* Delete confirmation (single) */}
      {deletingId && (
        <ConfirmModal
          message="Delete this log entry?"
          onConfirm={() => handleDelete(deletingId)}
          onCancel={() => setDeletingId(null)}
        />
      )}

      {/* Delete confirmation (group) */}
      {deletingGroup && (
        <ConfirmModal
          message={`Delete these ${deletingGroup.length} entries (${deletingGroup
            .map((l) => ACTIVITY_MAP[l.type]?.label ?? l.type)
            .join(', ')}) logged at ${formatTime(deletingGroup[0].created_at)}?`}
          onConfirm={() => handleDeleteGroup(deletingGroup)}
          onCancel={() => setDeletingGroup(null)}
        />
      )}
    </div>
  );
}

function EditModal({
  log,
  onSave,
  onCancel,
}: {
  log: LogWithUser;
  onSave: (updated: {
    id: string;
    type: ActivityType;
    note: string;
    created_at: string;
  }) => Promise<void>;
  onCancel: () => void;
}) {
  const [type, setType] = useState<ActivityType>(log.type);
  const [note, setNote] = useState(log.note ?? '');
  const [time, setTime] = useState(() =>
    toLocalDateTimeInput(new Date(log.created_at)),
  );
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await onSave({
      id: log.id,
      type,
      note: note.trim(),
      created_at: new Date(time).toISOString(),
    });
    setSaving(false);
  }

  const fieldClass =
    'w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-800 font-semibold focus:border-forest-400 focus:outline-none';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 sm:items-center">
      <div className="w-full max-w-lg rounded-t-3xl bg-cream-50 p-6 sm:rounded-3xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-extrabold text-forest-700">Edit Entry</h3>
          <button
            type="button"
            onClick={onCancel}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400">
            Activity
          </p>
          <div className="grid grid-cols-3 gap-3">
            {ACTIVITIES.map((a) => {
              const Icon = a.icon;
              const active = type === a.type;
              return (
                <button
                  key={a.type}
                  type="button"
                  onClick={() => setType(a.type)}
                  className="flex flex-col items-center gap-1.5"
                >
                  <span
                    className={`flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all ${
                      active
                        ? 'border-forest-500 bg-forest-50 text-forest-600'
                        : 'border-gray-200 bg-white text-gray-700'
                    }`}
                  >
                    <Icon className="h-5 w-5" strokeWidth={1.75} />
                  </span>
                  <span
                    className={`text-xs font-bold ${
                      active ? 'text-forest-600' : 'text-gray-500'
                    }`}
                  >
                    {a.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <label className="mb-4 block">
          <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-400">
            Note
          </span>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className={fieldClass + ' font-normal'}
          />
        </label>

        <label className="mb-5 block">
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

        <button
          type="button"
          disabled={saving}
          onClick={handleSave}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-forest-500 px-6 py-3.5 text-base font-extrabold text-white transition-colors hover:bg-forest-600 disabled:opacity-50"
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

function GroupEditModal({
  group,
  onSave,
  onCancel,
}: {
  group: LogWithUser[];
  onSave: (updated: {
    kept: { id: string; type: ActivityType }[];
    note: string;
    created_at: string;
    removedIds: string[];
  }) => Promise<void>;
  onCancel: () => void;
}) {
  const [keptTypes, setKeptTypes] = useState<Map<string, ActivityType>>(
    () => new Map(group.map((l) => [l.id, l.type])),
  );
  const [note, setNote] = useState(() => group.find((l) => l.note)?.note ?? '');
  const [time, setTime] = useState(() =>
    toLocalDateTimeInput(new Date(group[0].created_at)),
  );
  const [saving, setSaving] = useState(false);

  function removeEntry(id: string) {
    setKeptTypes((prev) => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    const kept: { id: string; type: ActivityType }[] = [];
    const removedIds: string[] = [];
    for (const log of group) {
      if (keptTypes.has(log.id)) {
        kept.push({ id: log.id, type: keptTypes.get(log.id)! });
      } else {
        removedIds.push(log.id);
      }
    }
    await onSave({
      kept,
      note: note.trim(),
      created_at: new Date(time).toISOString(),
      removedIds,
    });
    setSaving(false);
  }

  const canSave = keptTypes.size > 0 && !saving;

  const fieldClass =
    'w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-800 font-semibold focus:border-forest-400 focus:outline-none';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 sm:items-center">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-cream-50 p-6 sm:rounded-3xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-extrabold text-forest-700">Edit Entries</h3>
          <button
            type="button"
            onClick={onCancel}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400">
            Tasks in this entry
          </p>
          <p className="mb-3 text-xs text-gray-400">
            Tap the X on a task to remove it from this group.
          </p>
          <div className="space-y-2">
            {group.map((log) => {
              const meta = ACTIVITY_MAP[log.type];
              const Icon = meta?.icon ?? PawPrint;
              const kept = keptTypes.has(log.id);
              return (
                <div
                  key={log.id}
                  className={`flex items-center gap-3 rounded-xl border p-3 transition-all ${
                    kept
                      ? 'border-gray-200 bg-white'
                      : 'border-gray-100 bg-gray-50 opacity-50'
                  }`}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-200 text-gray-700">
                    <Icon className="h-4 w-4" strokeWidth={1.75} />
                  </div>
                  <span className="flex-1 text-sm font-bold text-gray-700">
                    {meta?.label ?? log.type}
                  </span>
                  {kept && (
                    <button
                      type="button"
                      onClick={() => removeEntry(log.id)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-rose-50 hover:text-rose-500"
                    >
                      <X className="h-4 w-4" strokeWidth={1.75} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <label className="mb-4 block">
          <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-400">
            Note
          </span>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className={fieldClass + ' font-normal'}
          />
        </label>

        <label className="mb-5 block">
          <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-400">
            Time (applies to all tasks)
          </span>
          <input
            type="datetime-local"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className={fieldClass}
          />
        </label>

        <button
          type="button"
          disabled={!canSave}
          onClick={handleSave}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-forest-500 px-6 py-3.5 text-base font-extrabold text-white transition-colors hover:bg-forest-600 disabled:cursor-not-allowed disabled:opacity-50"
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

function ConfirmModal({
  message,
  onConfirm,
  onCancel,
}: {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 sm:items-center">
      <div className="w-full max-w-lg rounded-t-3xl bg-cream-50 p-6 text-center sm:rounded-3xl">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-rose-200 text-rose-500">
          <Trash2 className="h-6 w-6" strokeWidth={1.75} />
        </div>
        <p className="text-lg font-bold text-gray-800">{message}</p>
        <p className="mt-1 text-sm text-gray-400">This cannot be undone.</p>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-2xl border border-gray-200 bg-white px-6 py-3 text-sm font-bold text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-2xl bg-rose-500 px-6 py-3 text-sm font-extrabold text-white hover:bg-rose-600"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
