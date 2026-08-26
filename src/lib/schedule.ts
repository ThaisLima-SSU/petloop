import type { ActivityType, LogWithUser, Schedule } from '@/lib/supabase';
import { ACTIVITY_MAP } from '@/lib/activities';

export type DueItem = {
  type: ActivityType;
  label: string;
  timeOfDay: string;
  status: 'due-soon' | 'overdue';
};

export type TaskScheduleConfig = {
  enabled: boolean;
  frequency: 'daily' | 'specific-days' | 'specific-hours';
  weekdays: boolean[];
  timeOfDay: string | null;
  times: string[];
  note: string | null;
  visibleToSitter: boolean;
};

export type CareSchedule = Record<ActivityType, TaskScheduleConfig>;

export const ALL_ACTIVITY_TYPES: ActivityType[] = ['fed', 'walked', 'pooped', 'peed', 'slept', 'meds', 'bath', 'brushed_teeth'];

export const SIMPLE_TYPES: ActivityType[] = ['pooped', 'peed', 'slept'];

export const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function getDefaultCareSchedule(): CareSchedule {
  const config: CareSchedule = {} as CareSchedule;
  for (const type of ALL_ACTIVITY_TYPES) {
    config[type] = {
      enabled: type !== 'meds',
      frequency: 'daily',
      weekdays: [true, true, true, true, true, true, true],
      timeOfDay: type === 'meds' ? '12:00' : null,
      times: [],
      note: null,
      visibleToSitter: false,
    };
  }
  return config;
}

export function careScheduleFromDb(schedules: Schedule[]): CareSchedule {
  const config = getDefaultCareSchedule();
  for (const type of ALL_ACTIVITY_TYPES) {
    const rows = schedules.filter((s) => s.type === type);
    if (rows.length === 0) continue;

    const activeRows = rows.filter((s) => s.active);

    if (activeRows.length === 0) {
      const row = rows[0];
      config[type] = {
        enabled: false,
        frequency: row.weekdays ? 'specific-days' : 'daily',
        weekdays: row.weekdays
          ? row.weekdays.split(',').map((d) => d === '1')
          : [true, true, true, true, true, true, true],
        timeOfDay: row.time_of_day ?? (type === 'meds' ? '12:00' : null),
        times: [],
        note: row.note ?? null,
        visibleToSitter: row.visible_to_sitter,
      };
      continue;
    }

    if ((type === 'fed' || type === 'walked') && activeRows.length > 1) {
      config[type] = {
        enabled: true,
        frequency: 'specific-hours',
        weekdays: [true, true, true, true, true, true, true],
        timeOfDay: activeRows[0].time_of_day ?? null,
        times: activeRows.map((r) => r.time_of_day).filter((t): t is string => t !== null),
        note: activeRows[0].note ?? null,
        visibleToSitter: activeRows.some((r) => r.visible_to_sitter),
      };
    } else {
      const row = activeRows[0];
      config[type] = {
        enabled: true,
        frequency: row.weekdays ? 'specific-days' : 'daily',
        weekdays: row.weekdays
          ? row.weekdays.split(',').map((d) => d === '1')
          : [true, true, true, true, true, true, true],
        timeOfDay: row.time_of_day ?? (type === 'meds' ? '12:00' : null),
        times: [],
        note: row.note ?? null,
        visibleToSitter: row.visible_to_sitter,
      };
    }
  }
  return config;
}

export function isTaskScheduledToday(config: TaskScheduleConfig, dayOfWeek: number): boolean {
  if (!config.enabled) return false;
  if (config.frequency === 'daily' || config.frequency === 'specific-hours') return true;
  return config.weekdays[dayOfWeek] ?? false;
}

export function getScheduledTypesForToday(careSchedule: CareSchedule, date?: Date): ActivityType[] {
  const now = date ?? new Date();
  const dayOfWeek = now.getDay();
  return ALL_ACTIVITY_TYPES.filter((type) => isTaskScheduledToday(careSchedule[type], dayOfWeek));
}

export function getDailyGoal(careSchedule: CareSchedule, date?: Date): number {
  return getScheduledTypesForToday(careSchedule, date).length;
}

export function getCompletedCount(logs: LogWithUser[], goal: number): number {
  const distinctTypes = new Set(logs.map((l) => l.type));
  return Math.min(distinctTypes.size, goal);
}

export function isTaskCompleted(logs: LogWithUser[], type: ActivityType): boolean {
  return logs.some((l) => l.type === type);
}

function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

export function getDueItems(schedules: Schedule[], careSchedule: CareSchedule, logs: LogWithUser[], date?: Date): DueItem[] {
  const now = date ?? new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const dayOfWeek = now.getDay();
  const items: DueItem[] = [];

  const completedTypes = new Set(logs.map((l) => l.type));

  for (const type of ALL_ACTIVITY_TYPES) {
    if (completedTypes.has(type)) continue;

    const config = careSchedule[type];
    if (!isTaskScheduledToday(config, dayOfWeek)) continue;

    const dbRows = schedules.filter((s) => s.type === type && s.active && s.time_of_day);
    if (dbRows.length === 0) continue;

    for (const row of dbRows) {
      const taskMinutes = timeToMinutes(row.time_of_day!);
      const diff = taskMinutes - currentMinutes;
      if (diff <= 60 && diff >= -120) {
        const meta = ACTIVITY_MAP[type];
        items.push({
          type,
          label: row.med_label || row.label || meta?.label || type,
          timeOfDay: row.time_of_day!,
          status: diff < 0 ? 'overdue' : 'due-soon',
        });
      }
    }
  }

  return items;
}
