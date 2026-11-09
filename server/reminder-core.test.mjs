import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createVisitReminders,
  reconcileVisitReminders,
  reminderText,
  signTelegramInitData,
  validateTelegramInitData,
} from './reminder-core.mjs';

const token = '123456:TEST_TOKEN';
const nowMs = Date.UTC(2026, 10, 8, 9, 0, 0);

function validInitData() {
  const params = new URLSearchParams({
    auth_date: String(Math.floor(nowMs / 1000)),
    query_id: 'query-1',
    user: JSON.stringify({ id: 777, first_name: 'Дмитрий' }),
  });
  params.set('hash', signTelegramInitData(params, token));
  return params.toString();
}

test('validates signed Telegram initData', () => {
  assert.deepEqual(validateTelegramInitData(validInitData(), token, nowMs), {
    id: 777,
    firstName: 'Дмитрий',
  });
});

test('rejects tampered Telegram initData', () => {
  const tampered = validInitData().replace('%D0%94', '%D0%98');
  assert.throws(() => validateTelegramInitData(tampered, token, nowMs), /signature/);
});

test('creates the 0, 6, 12 and 24 hour reminder schedule', () => {
  const reminders = createVisitReminders({
    telegramUserId: 777,
    visitId: 'visit-123456',
    cellId: 16,
    cellName: 'Ревность',
    question: 'Что ты заметил?',
    startedAt: new Date(nowMs).toISOString(),
  }, nowMs);

  assert.deepEqual(
    reminders.map((reminder) => [reminder.kind, reminder.dueAt]),
    [
      ['started', '2026-11-08T09:00:00.000Z'],
      ['midpoint', '2026-11-08T15:00:00.000Z'],
      ['ready', '2026-11-08T21:00:00.000Z'],
      ['follow_up', '2026-11-09T09:00:00.000Z'],
    ],
  );
  assert.match(reminderText(reminders[2]), /итоговую рефлексию/);
});

test('reconciliation sends at most one overdue reminder', () => {
  const reminders = createVisitReminders({
    telegramUserId: 777,
    visitId: 'visit-123456',
    cellId: 16,
    cellName: 'Ревность',
    question: 'Что ты заметил?',
    startedAt: new Date(nowMs).toISOString(),
  }, nowMs);
  const reconciled = reconcileVisitReminders(reminders, nowMs + 13 * 60 * 60 * 1000);

  assert.deepEqual(
    reconciled.filter((reminder) => !reminder.cancelledAt).map((reminder) => reminder.kind),
    ['ready', 'follow_up'],
  );
});
