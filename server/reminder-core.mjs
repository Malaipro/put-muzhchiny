import { createHmac, timingSafeEqual } from 'node:crypto';

export const REMINDER_OFFSETS_HOURS = Object.freeze({
  started: 0,
  midpoint: 6,
  ready: 12,
  follow_up: 24,
});

const MAX_AUTH_AGE_SECONDS = 7 * 24 * 60 * 60;
const MAX_VISIT_AGE_MS = 45 * 24 * 60 * 60 * 1000;

function safeEqualHex(left, right) {
  if (!/^[a-f0-9]{64}$/i.test(left) || !/^[a-f0-9]{64}$/i.test(right)) return false;
  const leftBuffer = Buffer.from(left, 'hex');
  const rightBuffer = Buffer.from(right, 'hex');
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export function signTelegramInitData(values, botToken) {
  const params = new URLSearchParams(values);
  params.delete('hash');
  params.delete('signature');
  const dataCheckString = [...params.entries()]
    .sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  const secretKey = createHmac('sha256', 'WebAppData').update(botToken).digest();
  return createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
}

export function validateTelegramInitData(initData, botToken, nowMs = Date.now()) {
  if (!botToken) throw new Error('Telegram bot token is not configured');
  if (typeof initData !== 'string' || initData.length < 10 || initData.length > 16_384) {
    throw new Error('Telegram initData is missing');
  }

  const params = new URLSearchParams(initData);
  const receivedHash = params.get('hash') ?? '';
  const expectedHash = signTelegramInitData(params, botToken);
  if (!safeEqualHex(receivedHash, expectedHash)) throw new Error('Invalid Telegram signature');

  const authDate = Number(params.get('auth_date'));
  if (!Number.isFinite(authDate)) throw new Error('Invalid Telegram auth date');
  const ageSeconds = Math.floor(nowMs / 1000) - authDate;
  if (ageSeconds < -60 || ageSeconds > MAX_AUTH_AGE_SECONDS) {
    throw new Error('Telegram session is too old');
  }

  let user;
  try {
    user = JSON.parse(params.get('user') ?? 'null');
  } catch {
    throw new Error('Invalid Telegram user');
  }
  if (!user || !Number.isSafeInteger(user.id) || user.id <= 0) {
    throw new Error('Telegram user is missing');
  }

  return {
    id: user.id,
    firstName: typeof user.first_name === 'string' ? user.first_name.slice(0, 80) : '',
  };
}

function normalizeStartedAt(startedAt, nowMs) {
  const parsed = new Date(startedAt).getTime();
  if (!Number.isFinite(parsed)) return nowMs;
  if (parsed > nowMs + 5 * 60 * 1000) return nowMs;
  if (parsed < nowMs - MAX_VISIT_AGE_MS) return nowMs;
  return parsed;
}

export function createVisitReminders({ telegramUserId, visitId, cellId, cellName, question, startedAt }, nowMs = Date.now()) {
  if (!Number.isSafeInteger(telegramUserId) || telegramUserId <= 0) throw new Error('Invalid Telegram user id');
  if (typeof visitId !== 'string' || !/^[a-z0-9-]{6,120}$/i.test(visitId)) throw new Error('Invalid visit id');
  if (!Number.isInteger(cellId) || cellId < 1 || cellId > 72) throw new Error('Invalid cell id');

  const safeCellName = typeof cellName === 'string' && cellName.trim()
    ? cellName.trim().slice(0, 120)
    : `Клетка ${cellId}`;
  const safeQuestion = typeof question === 'string' ? question.trim().slice(0, 500) : '';
  const baseMs = normalizeStartedAt(startedAt, nowMs);

  return Object.entries(REMINDER_OFFSETS_HOURS).map(([kind, offsetHours]) => ({
    id: `${telegramUserId}:${visitId}:${kind}`,
    telegramUserId,
    visitId,
    cellId,
    cellName: safeCellName,
    question: safeQuestion,
    kind,
    dueAt: new Date(baseMs + offsetHours * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(nowMs).toISOString(),
    sentAt: null,
    cancelledAt: null,
    attempts: 0,
    nextAttemptAt: null,
  }));
}

export function reconcileVisitReminders(reminders, nowMs = Date.now()) {
  const due = reminders
    .filter((reminder) => new Date(reminder.dueAt).getTime() <= nowMs)
    .sort((left, right) => new Date(left.dueAt).getTime() - new Date(right.dueAt).getTime());
  const latestDueId = due.at(-1)?.id ?? null;
  const reconciledAt = new Date(nowMs).toISOString();

  return reminders.map((reminder) => (
    new Date(reminder.dueAt).getTime() <= nowMs && reminder.id !== latestDueId
      ? { ...reminder, cancelledAt: reconciledAt }
      : reminder
  ));
}

export function reminderText(reminder) {
  const title = `клетке ${reminder.cellId} — ${reminder.cellName}`;
  if (reminder.kind === 'started') {
    return `Ты на ${title}.\n\nНачался 12-часовой этап проживания. Не спеши с выводами: наблюдай и выполни выбранное действие.`;
  }
  if (reminder.kind === 'midpoint') {
    return reminder.question
      ? `Прошла половина времени на ${title}.\n\n${reminder.question}`
      : `Прошла половина времени на ${title}. Заметь, что уже изменилось в твоём восприятии.`;
  }
  if (reminder.kind === 'ready') {
    return `Минимальное время проживания ${title} прошло.\n\nВернись в Путь и заполни итоговую рефлексию, когда будешь готов.`;
  }
  return `Твоя ${title} всё ещё ждёт завершения.\n\nЭто не ошибка. Проверь, что мешает поставить точку действием, и заполни итог.`;
}

export function retryDelayMs(attempts) {
  return Math.min(60 * 60 * 1000, 60 * 1000 * (2 ** Math.max(0, attempts - 1)));
}
