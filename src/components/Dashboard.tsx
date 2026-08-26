import { useState } from 'react';
import { Clock } from 'lucide-react';
import { PawPrint } from 'lucide-react';
import type { Pet, LogWithUser, Schedule } from '@/lib/supabase';
import { ACTIVITY_MAP } from '@/lib/activities';
import { ProgressRing } from '@/components/ProgressRing';
import { PetAvatar } from '@/components/PetAvatar';
import { PetSwitcher } from '@/components/PetSwitcher';
import { EmergencyInfoCard } from '@/components/EmergencyInfoCard';
import { EmergencyInfoEditor, type EmergencyInfoUpdates } from '@/components/EmergencyInfoEditor';
import { groupLogs } from '@/lib/logs';
import {
  careScheduleFromDb,
  getDailyGoal,
  getCompletedCount,
  getDueItems,
} from '@/lib/schedule';

type DashboardProps = {
  pets: Pet[];
  activePet: Pet | null;
  logs: LogWithUser[];
  schedules: Schedule[];
  loading: boolean;
  onPetChange: (petId: string) => void;
  onAddPet: () => void;
  onSaveEmergencyInfo: (petId: string, updates: EmergencyInfoUpdates) => Promise<void>;
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function formatTimeOfDay(timeStr: string) {
  const [h, m] = timeStr.split(':').map(Number);
  const date = new Date();
  date.setHours(h, m, 0, 0);
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function Dashboard({ pets, activePet, logs, schedules, loading, onPetChange, onAddPet, onSaveEmergencyInfo }: DashboardProps) {
  const [showEmergencyEditor, setShowEmergencyEditor] = useState(false);
  const petSchedules = schedules.filter((s) => s.pet_id === activePet?.id);
  const careSchedule = careScheduleFromDb(petSchedules);
  const goal = getDailyGoal(careSchedule);
  const completed = getCompletedCount(logs, goal);
  const dueItems = getDueItems(petSchedules, careSchedule, logs);

  if (loading) {
    return <p className="mt-16 text-center text-gray-400">Loading today's care…</p>;
  }

  if (!activePet) {
    return (
      <div className="mt-16 text-center">
        <p className="mb-4 text-gray-400">No pets in your household yet.</p>
        <button
          type="button"
          onClick={onAddPet}
          className="rounded-2xl bg-forest-500 px-6 py-3 text-sm font-extrabold text-white hover:bg-forest-600"
        >
          Add Your First Pet
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PetSwitcher pets={pets} activePet={activePet} onPetChange={onPetChange} onAddPet={onAddPet} />

      {/* Progress card */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="flex items-center gap-5">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2.5">
              <span className="text-gray-500">
                <PetAvatar avatarKey={activePet.avatar_key} name={activePet.name} species={activePet.species} size={32} />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Today's care
                </p>
                <h2 className="text-xl font-extrabold text-forest-700">{activePet.name}</h2>
              </div>
            </div>
            <p className="mt-1 pl-12 text-sm text-gray-400">{activePet.species}</p>
          </div>
          <ProgressRing completed={completed} goal={goal} petName={activePet.name} petId={activePet.id} />
        </div>
      </section>

      {/* Due soon / overdue items */}
      {dueItems.length > 0 && (
        <section>
          <h3 className="mb-3 px-1 text-xs font-bold uppercase tracking-wide text-amber-600">
            Due Soon
          </h3>
          <ul className="space-y-2.5">
            {dueItems.map((item, idx) => {
              const meta = ACTIVITY_MAP[item.type];
              const Icon = meta?.icon ?? PawPrint;
              return (
                <li
                  key={`${item.type}-${idx}`}
                  className={`flex animate-due-pulse items-center gap-4 rounded-2xl border bg-white p-4 ${
                    item.status === 'overdue'
                      ? 'border-amber-300'
                      : 'border-amber-200'
                  }`}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-amber-200 text-amber-600">
                    <Icon className="h-4.5 w-4.5" strokeWidth={1.75} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-amber-700">{item.label}</p>
                    <p className="flex items-center gap-1 text-xs text-amber-600">
                      <Clock className="h-3 w-3" strokeWidth={1.75} />
                      {formatTimeOfDay(item.timeOfDay)}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${
                      item.status === 'overdue'
                        ? 'bg-amber-500 text-white'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {item.status === 'overdue' ? 'Overdue' : 'Due Soon'}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Activity log */}
      <section>
        <h3 className="mb-3 px-1 text-xs font-bold uppercase tracking-wide text-gray-400">
          Today's activity
        </h3>

        {logs.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center">
            <p className="font-semibold text-gray-700">Nothing logged yet today</p>
            <p className="mt-1 text-sm text-gray-400">
              Tap the Log tab to add {activePet.name}'s first entry.
            </p>
          </div>
        ) : (
          <ul className="space-y-2.5">
            {groupLogs(logs).map((group) => {
              if (group.length === 1) {
                const log = group[0];
                const meta = ACTIVITY_MAP[log.type];
                const Icon = meta?.icon ?? PawPrint;
                return (
                  <li
                    key={log.id}
                    className="flex animate-log-in items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-200 text-gray-700">
                      <Icon className="h-4.5 w-4.5" strokeWidth={1.75} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-gray-800">{meta?.label ?? log.type}</p>
                      {log.note && (
                        <p className="truncate text-sm text-gray-400">{log.note}</p>
                      )}
                      <p className="text-xs text-gray-400">by {log.users?.name ?? 'Someone'}</p>
                    </div>
                    <span className="shrink-0 text-sm font-semibold text-gray-400">
                      {formatTime(log.created_at)}
                    </span>
                  </li>
                );
              }
              const note = group.find((l) => l.note)?.note;
              const userName = group[0].users?.name ?? 'Someone';
              const labels = group.map((l) => ACTIVITY_MAP[l.type]?.label ?? l.type);
              return (
                <li
                  key={group.map((l) => l.id).join('-')}
                  className="flex animate-log-in items-start gap-4 rounded-2xl border border-gray-200 bg-white p-4"
                >
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
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Emergency info card */}
      <EmergencyInfoCard pet={activePet} onEdit={() => setShowEmergencyEditor(true)} />

      {showEmergencyEditor && activePet && (
        <EmergencyInfoEditor
          pet={activePet}
          onSave={async (updates) => {
            await onSaveEmergencyInfo(activePet.id, updates);
            setShowEmergencyEditor(false);
          }}
          onCancel={() => setShowEmergencyEditor(false)}
        />
      )}
    </div>
  );
}
