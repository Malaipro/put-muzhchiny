import type { Cell } from '../types';
import type { VisitRecord } from './game';

export type ReminderStatus = 'unknown' | 'scheduled' | 'unavailable' | 'error';
export type ReminderScheduleMode = 'start' | 'reconcile';

interface ScheduleReminderInput {
  initData: string;
  visit: VisitRecord;
  cell: Cell;
  question: string;
  mode?: ReminderScheduleMode;
}

async function postReminderApi(path: string, payload: Record<string, unknown>): Promise<void> {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    credentials: 'same-origin',
    keepalive: true,
  });
  if (!response.ok) throw new Error(`Reminder API returned ${response.status}`);
}

export async function scheduleVisitReminders({
  initData,
  visit,
  cell,
  question,
  mode = 'start',
}: ScheduleReminderInput): Promise<ReminderStatus> {
  if (!initData) return 'unavailable';
  try {
    await postReminderApi('/api/reminders/schedule', {
      initData,
      visitId: visit.visitId,
      cellId: visit.cellId,
      cellName: cell.kempName,
      question,
      startedAt: visit.actionAcceptedAt || visit.startedAt,
      mode,
    });
    return 'scheduled';
  } catch {
    return 'error';
  }
}

export async function cancelVisitReminders(initData: string, visitId: string): Promise<void> {
  if (!initData) return;
  try {
    await postReminderApi('/api/reminders/cancel', { initData, visitId });
  } catch {
    // Completion is stored locally even if a temporary network error prevents cancellation.
    // The next application launch reconciles the completed visit again.
  }
}
