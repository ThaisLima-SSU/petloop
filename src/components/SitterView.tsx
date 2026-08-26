import { useState } from 'react';
import { Clock, Plus, PawPrint } from 'lucide-react';
import type { ActivityType, LogWithUser, Pet, Schedule } from '@/lib/supabase';
import { ACTIVITY_MAP } from '@/lib/activities';
import { ALL_ACTIVITY_TYPES, careScheduleFromDb, getScheduledTypesForToday } from '@/lib/schedule';
import { EmergencyInfoCard } from '@/components/EmergencyInfoCard';
import { SitterLogModal } from '@/components/SitterLogModal';

type SitterViewProps = {
  pet: Pet | null;
  schedules: Schedule[];
  expiresAt: string;
  userId: string;
  sitterName: string;
  logs: LogWithUser[];
  onLogCare: (entry: { petId: string; userId: string; type: ActivityType; note: string; createdAt: string }) => Promise<void>;
};

function formatExpiration(iso: string) {
  return new Date(iso).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function formatScheduleTime(time: string) {
  const [hours, minutes] = time.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function SitterView({ pet, schedules, expiresAt, userId, sitterName, logs, onLogCare }: SitterViewProps) {
  const [showLogModal, setShowLogModal] = useState(false);

  if (!pet) return <p className="mt-16 text-center text-gray-400">This sitter link is not available.</p>;

  const petSchedules = schedules.filter((schedule) => schedule.pet_id === pet.id);
  const careSchedule = careScheduleFromDb(petSchedules);
  const scheduledToday = new Set(getScheduledTypesForToday(careSchedule));
  const visibleTypes = ALL_ACTIVITY_TYPES.filter(
    (type) => scheduledToday.has(type) && careSchedule[type].visibleToSitter,
  );
  const visibleLogs = logs.filter((log) => careSchedule[log.type]?.visibleToSitter);

  return (
    <div className="space-y-5">
      <header className="text-center">
        <p className="text-xs font-bold uppercase tracking-wide text-gray-400">Sitter access</p>
        <h2 className="text-xl font-extrabold text-forest-700">{pet.name}</h2>
      </header>

      <div className="flex items-center justify-center gap-2 rounded-xl border border-forest-100 bg-forest-50 px-4 py-2.5">
        <Clock className="h-4 w-4 text-forest-500" strokeWidth={1.75} />
        <p className="text-sm font-semibold text-forest-600">Access expires: {formatExpiration(expiresAt)}</p>
      </div>

      <EmergencyInfoCard pet={pet} readOnly />

      <section className="rounded-2xl border border-gray-200 bg-white p-5">
        <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-gray-500">Today's Schedule</h3>
        <div className="space-y-4">
          {visibleTypes.map((type) => {
            const meta = ACTIVITY_MAP[type];
            const Icon = meta?.icon ?? PawPrint;
            const rows = petSchedules.filter((item) => item.type === type && item.active);
            const times = rows
              .map((row) => row.time_of_day)
              .filter((time): time is string => time !== null)
              .map(formatScheduleTime);
            const scheduleText = times.length > 0 ? times.join(', ') : 'Scheduled today';
            const medicationLabel = type === 'meds' ? rows.find((row) => row.med_label)?.med_label : null;
            return (
              <div key={type} className="flex items-start gap-3">
                <span className="mt-0.5 text-gray-400"><Icon className="h-4 w-4" strokeWidth={1.75} /></span>
                <div className="flex-1">
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-400">{meta?.label ?? type}</p>
                  <p className="mt-1 text-sm font-medium text-gray-700">{medicationLabel ? `${scheduleText} — ${medicationLabel}` : scheduleText}</p>
                </div>
              </div>
            );
          })}
          {visibleTypes.length === 0 && <p className="text-sm text-gray-400">No sitter-visible care scheduled today.</p>}
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5">
        <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-gray-500">Today's Activity</h3>
        {visibleLogs.length === 0 ? (
          <p className="text-sm text-gray-400">Nothing logged yet today.</p>
        ) : (
          <ul className="space-y-3">
            {visibleLogs.map((log) => {
              const meta = ACTIVITY_MAP[log.type];
              const Icon = meta?.icon ?? Plus;
              return (
                <li key={log.id} className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-200 text-gray-700">
                    <Icon className="h-4 w-4" strokeWidth={1.75} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-gray-800">{meta?.label ?? log.type}</p>
                    {log.note && <p className="truncate text-sm text-gray-400">{log.note}</p>}
                    <p className="text-xs text-gray-400">by {log.users?.name ?? sitterName}</p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-gray-400">{new Date(log.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <p className="px-4 text-center text-xs text-gray-400">Limited access: Cannot view settings, household members, or billing.</p>

      {visibleTypes.length > 0 && (
        <button type="button" onClick={() => setShowLogModal(true)} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-forest-500 px-6 py-3.5 text-base font-extrabold text-white transition-colors hover:bg-forest-600">
          <Plus className="h-5 w-5" /> Log Care
        </button>
      )}

      {showLogModal && (
        <SitterLogModal
          pet={pet}
          userId={userId}
          visibleTypes={visibleTypes}
          onSave={onLogCare}
          onCancel={() => setShowLogModal(false)}
        />
      )}
    </div>
  );
}
