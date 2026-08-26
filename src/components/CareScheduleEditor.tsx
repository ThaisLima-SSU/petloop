import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { ACTIVITIES } from '@/lib/activities';
import type { ActivityType } from '@/lib/supabase';
import {
  type CareSchedule,
  type TaskScheduleConfig,
  ALL_ACTIVITY_TYPES,
  SIMPLE_TYPES,
  WEEKDAY_LABELS,
  getDefaultCareSchedule,
} from '@/lib/schedule';

type CareScheduleEditorProps = {
  value: CareSchedule;
  onChange: (value: CareSchedule) => void;
};

const TIME_FIELD_TYPES: ActivityType[] = ['fed', 'walked', 'meds'];

function Toggle({ enabled }: { enabled: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border p-0.5 transition-colors ${
        enabled ? 'border-forest-600 bg-forest-500' : 'border-gray-300 bg-gray-200'
      }`}
    >
      <span
        className={`h-5 w-5 rounded-full bg-white shadow-md ring-1 ring-black/10 transition-transform ${
          enabled ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </span>
  );
}

export function CareScheduleEditor({ value, onChange }: CareScheduleEditorProps) {
  function updateTask(type: ActivityType, updates: Partial<TaskScheduleConfig>) {
    onChange({ ...value, [type]: { ...value[type], ...updates } });
  }

  return (
    <div className="space-y-2">
      {ALL_ACTIVITY_TYPES.map((type) => {
        const meta = ACTIVITIES.find((activity) => activity.type === type);
        const config = value[type];
        const Icon = meta?.icon;
        const isSimple = SIMPLE_TYPES.includes(type);
        const isBath = type === 'bath';
        const isMultiTime = type === 'fed' || type === 'walked';
        const showTimeField = TIME_FIELD_TYPES.includes(type);

        return (
          <div
            key={type}
            className={`rounded-xl border p-3 transition-colors ${
              config.enabled ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50/50'
            }`}
          >
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => updateTask(type, { enabled: !config.enabled })}
                className="flex min-w-0 flex-1 items-center justify-between"
                aria-pressed={config.enabled}
              >
                <div className="flex items-center gap-2.5">
                  {Icon && (
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-full border ${
                        config.enabled
                          ? 'border-gray-200 text-forest-500'
                          : 'border-gray-200 text-gray-300'
                      }`}
                    >
                      <Icon className="h-4 w-4" strokeWidth={1.75} />
                    </span>
                  )}
                  <span className={`text-left text-sm font-bold ${config.enabled ? 'text-gray-700' : 'text-gray-400'}`}>
                    {meta?.label ?? type}
                  </span>
                </div>
                <Toggle enabled={config.enabled} />
              </button>
              <label className="flex shrink-0 items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-gray-400">
                <input
                  type="checkbox"
                  checked={config.visibleToSitter}
                  onChange={(event) => updateTask(type, { visibleToSitter: event.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-forest-500 accent-forest-500 focus:ring-forest-400"
                />
                <span className="hidden sm:inline">Visible to Sitter</span>
                <span className="sm:hidden">Sitter</span>
              </label>
            </div>

            {config.enabled && !isSimple && (
              <div className="mt-3 pl-10">
                {isMultiTime ? (
                  <>
                    <div className="mb-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => updateTask(type, { frequency: 'daily' })}
                        className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${config.frequency === 'daily' ? 'bg-forest-50 text-forest-600' : 'text-gray-400 hover:bg-gray-50'}`}
                      >
                        Every day
                      </button>
                      <button
                        type="button"
                        onClick={() => updateTask(type, { frequency: 'specific-hours', times: config.times.length > 0 ? config.times : ['12:00'] })}
                        className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${config.frequency === 'specific-hours' ? 'bg-forest-50 text-forest-600' : 'text-gray-400 hover:bg-gray-50'}`}
                      >
                        Specific hours
                      </button>
                    </div>
                    {config.frequency === 'specific-hours' ? (
                      <div className="space-y-2">
                        {config.times.map((time, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <input
                              type="time"
                              value={time}
                              onChange={(event) => {
                                const times = [...config.times];
                                times[index] = event.target.value;
                                updateTask(type, { times });
                              }}
                              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-semibold text-gray-800 focus:border-forest-400 focus:outline-none"
                            />
                            {config.times.length > 1 && (
                              <button
                                type="button"
                                onClick={() => updateTask(type, { times: config.times.filter((_, itemIndex) => itemIndex !== index) })}
                                className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100"
                                aria-label="Remove time"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                        {config.times.length < 4 && (
                          <button
                            type="button"
                            onClick={() => updateTask(type, { times: [...config.times, '12:00'] })}
                            className="flex items-center gap-1 text-xs font-bold text-forest-600 hover:text-forest-700"
                          >
                            <Plus className="h-3.5 w-3.5" strokeWidth={2} /> Add another time
                          </button>
                        )}
                      </div>
                    ) : (
                      <TimeField value={config.timeOfDay ?? ''} onChange={(timeOfDay) => updateTask(type, { timeOfDay })} />
                    )}
                  </>
                ) : isBath ? (
                  <>
                    <div className="mb-2 flex gap-2">
                      <FrequencyButton active={config.frequency === 'daily'} onClick={() => updateTask(type, { frequency: 'daily' })}>
                        Every day
                      </FrequencyButton>
                      <FrequencyButton active={config.frequency === 'specific-days'} onClick={() => updateTask(type, { frequency: 'specific-days' })}>
                        Custom
                      </FrequencyButton>
                    </div>
                    {config.frequency === 'specific-days' && (
                      <>
                        <div className="mb-3 flex flex-wrap gap-1">
                          {WEEKDAY_LABELS.map((label, index) => (
                            <button
                              key={label}
                              type="button"
                              onClick={() => {
                                const weekdays = [...config.weekdays];
                                weekdays[index] = !weekdays[index];
                                updateTask(type, { weekdays });
                              }}
                              className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold transition-colors ${config.weekdays[index] ? 'bg-forest-500 text-white' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                              aria-pressed={config.weekdays[index]}
                            >
                              {label[0]}
                            </button>
                          ))}
                        </div>
                        <TimeField value={config.timeOfDay ?? ''} onChange={(timeOfDay) => updateTask(type, { timeOfDay })} />
                      </>
                    )}
                    <label className="mt-3 block">
                      <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-400">Note (optional)</span>
                      <input
                        type="text"
                        value={config.note ?? ''}
                        onChange={(event) => updateTask(type, { note: event.target.value || null })}
                        placeholder="e.g., Groomer — Fluffy Paws on Main St"
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-semibold text-gray-800 placeholder:text-gray-400 focus:border-forest-400 focus:outline-none"
                      />
                    </label>
                  </>
                ) : (
                  <>
                    <div className="mb-2 flex gap-2">
                      <FrequencyButton active={config.frequency === 'daily'} onClick={() => updateTask(type, { frequency: 'daily' })}>
                        Every day
                      </FrequencyButton>
                      <FrequencyButton active={config.frequency === 'specific-days'} onClick={() => updateTask(type, { frequency: 'specific-days' })}>
                        Specific days
                      </FrequencyButton>
                    </div>
                    {config.frequency === 'specific-days' && (
                      <div className="mb-3 flex flex-wrap gap-1">
                        {WEEKDAY_LABELS.map((label, index) => (
                          <button
                            key={label}
                            type="button"
                            onClick={() => {
                              const weekdays = [...config.weekdays];
                              weekdays[index] = !weekdays[index];
                              updateTask(type, { weekdays });
                            }}
                            className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold transition-colors ${config.weekdays[index] ? 'bg-forest-500 text-white' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                            aria-pressed={config.weekdays[index]}
                          >
                            {label[0]}
                          </button>
                        ))}
                      </div>
                    )}
                    {showTimeField && (
                      <TimeField value={config.timeOfDay ?? (type === 'meds' ? '12:00' : '')} onChange={(timeOfDay) => updateTask(type, { timeOfDay })} />
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function FrequencyButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${active ? 'bg-forest-50 text-forest-600' : 'text-gray-400 hover:bg-gray-50'}`}
    >
      {children}
    </button>
  );
}

function TimeField({ value, onChange }: { value: string; onChange: (value: string | null) => void }) {
  return (
    <label className="flex items-center gap-2">
      <span className="text-xs font-bold uppercase tracking-wide text-gray-400">Time</span>
      <input
        type="time"
        value={value}
        onChange={(event) => onChange(event.target.value || null)}
        className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-semibold text-gray-800 focus:border-forest-400 focus:outline-none"
      />
    </label>
  );
}

export function useCareScheduleState(initial?: CareSchedule) {
  return useState<CareSchedule>(initial ?? getDefaultCareSchedule());
}
