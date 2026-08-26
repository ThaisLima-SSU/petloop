import type { LogWithUser } from '@/lib/supabase';

export function groupLogs(logs: LogWithUser[]): LogWithUser[][] {
  const groups: LogWithUser[][] = [];
  for (const log of logs) {
    const lastGroup = groups[groups.length - 1];
    if (lastGroup && lastGroup[0].created_at === log.created_at) {
      lastGroup.push(log);
    } else {
      groups.push([log]);
    }
  }
  return groups;
}
