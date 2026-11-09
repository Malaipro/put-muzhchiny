import { createReadStream } from 'node:fs';
import { mkdir, readFile, rename, stat, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  createVisitReminders,
  reconcileVisitReminders,
  reminderText,
  retryDelayMs,
  validateTelegramInitData,
} from './server/reminder-core.mjs';

const PORT = Number(process.env.PORT || 80);
const DIST_DIR = fileURLToPath(new URL('./dist/', import.meta.url));
const DATA_DIR = process.env.DATA_DIR || '/data';
const QUEUE_FILE = join(DATA_DIR, 'put-muzhchiny-reminders.json');
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const PUBLIC_APP_URL = process.env.PUBLIC_APP_URL || 'https://put-muzhchiny-galdyan.mia0.amvera.tech/';
const TELEGRAM_API_BASE = process.env.TELEGRAM_API_BASE || 'https://api.telegram.org';
const SCHEDULER_DISABLED = process.env.REMINDER_SCHEDULER_DISABLED === '1';
const MAX_BODY_BYTES = 32 * 1024;

const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

let queueMutation = Promise.resolve();
let processing = false;

function json(response, statusCode, body) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Referrer-Policy': 'no-referrer',
  });
  response.end(JSON.stringify(body));
}

async function readJsonBody(request) {
  const chunks = [];
  let total = 0;
  for await (const chunk of request) {
    total += chunk.length;
    if (total > MAX_BODY_BYTES) throw new Error('Request body is too large');
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
  } catch {
    throw new Error('Invalid JSON');
  }
}

async function loadQueue() {
  try {
    const parsed = JSON.parse(await readFile(QUEUE_FILE, 'utf8'));
    return Array.isArray(parsed.reminders) ? parsed.reminders : [];
  } catch (error) {
    if (error?.code === 'ENOENT') return [];
    console.error('Failed to read reminder queue:', error?.message || error);
    return [];
  }
}

async function saveQueue(reminders) {
  await mkdir(DATA_DIR, { recursive: true });
  const temporary = `${QUEUE_FILE}.tmp`;
  await writeFile(temporary, JSON.stringify({ version: 1, reminders }, null, 2), { mode: 0o600 });
  await rename(temporary, QUEUE_FILE);
}

function mutateQueue(mutator) {
  const operation = queueMutation.then(async () => {
    const reminders = await loadQueue();
    const result = await mutator(reminders);
    await saveQueue(reminders);
    return result;
  });
  queueMutation = operation.catch(() => undefined);
  return operation;
}

function authenticate(body) {
  return validateTelegramInitData(body.initData, BOT_TOKEN);
}

async function scheduleReminders(body) {
  const user = authenticate(body);
  const nowMs = Date.now();
  let incoming = createVisitReminders({
    telegramUserId: user.id,
    visitId: body.visitId,
    cellId: body.cellId,
    cellName: body.cellName,
    question: body.question,
    startedAt: body.startedAt,
  }, nowMs);
  if (body.mode === 'reconcile') incoming = reconcileVisitReminders(incoming, nowMs);

  return mutateQueue((reminders) => {
    const byId = new Map(reminders.map((reminder) => [reminder.id, reminder]));
    for (const candidate of incoming) {
      const previous = byId.get(candidate.id);
      if (previous) {
        Object.assign(previous, candidate, {
          sentAt: previous.sentAt,
          cancelledAt: previous.sentAt ? previous.cancelledAt : candidate.cancelledAt,
          attempts: previous.attempts,
          nextAttemptAt: previous.nextAttemptAt,
        });
      } else {
        reminders.push(candidate);
      }
    }
    return { scheduled: incoming.filter((reminder) => !reminder.cancelledAt).length };
  });
}

async function cancelReminders(body) {
  const user = authenticate(body);
  if (typeof body.visitId !== 'string') throw new Error('Invalid visit id');
  const cancelledAt = new Date().toISOString();
  return mutateQueue((reminders) => {
    let cancelled = 0;
    for (const reminder of reminders) {
      if (
        reminder.telegramUserId === user.id
        && reminder.visitId === body.visitId
        && !reminder.sentAt
        && !reminder.cancelledAt
      ) {
        reminder.cancelledAt = cancelledAt;
        cancelled += 1;
      }
    }
    return { cancelled };
  });
}

async function sendTelegramReminder(reminder) {
  const endpoint = `${TELEGRAM_API_BASE}/bot${BOT_TOKEN}/sendMessage`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(10_000),
    body: JSON.stringify({
      chat_id: reminder.telegramUserId,
      text: reminderText(reminder),
      disable_web_page_preview: true,
      reply_markup: {
        inline_keyboard: [[{
          text: 'Вернуться в Путь',
          web_app: { url: PUBLIC_APP_URL },
        }]],
      },
    }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.ok === false) {
    throw new Error(`Telegram API ${response.status}: ${payload.description || 'request failed'}`);
  }
}

async function processDueReminders() {
  if (processing || SCHEDULER_DISABLED || !BOT_TOKEN) return;
  processing = true;
  try {
    const snapshot = await loadQueue();
    const nowMs = Date.now();
    const due = snapshot.filter((reminder) => (
      !reminder.sentAt
      && !reminder.cancelledAt
      && new Date(reminder.dueAt).getTime() <= nowMs
      && (!reminder.nextAttemptAt || new Date(reminder.nextAttemptAt).getTime() <= nowMs)
    )).slice(0, 20);

    for (const reminder of due) {
      try {
        await sendTelegramReminder(reminder);
        await mutateQueue((reminders) => {
          const current = reminders.find((item) => item.id === reminder.id);
          if (current && !current.cancelledAt) {
            current.sentAt = new Date().toISOString();
            current.nextAttemptAt = null;
          }
        });
        console.log(`Reminder sent: ${reminder.kind} visit=${reminder.visitId}`);
      } catch (error) {
        await mutateQueue((reminders) => {
          const current = reminders.find((item) => item.id === reminder.id);
          if (current && !current.cancelledAt && !current.sentAt) {
            current.attempts = (current.attempts || 0) + 1;
            current.nextAttemptAt = new Date(Date.now() + retryDelayMs(current.attempts)).toISOString();
            current.lastError = String(error?.message || error).slice(0, 300);
          }
        });
        console.error(`Reminder failed: ${reminder.kind} visit=${reminder.visitId}:`, error?.message || error);
      }
    }
  } finally {
    processing = false;
  }
}

async function serveStatic(request, response) {
  const url = new URL(request.url, 'http://localhost');
  let pathname = decodeURIComponent(url.pathname);
  if (pathname === '/') pathname = '/index.html';
  const safePath = normalize(pathname).replace(/^(\.\.[/\\])+/, '').replace(/^[/\\]+/, '');
  let filePath = join(DIST_DIR, safePath);
  if (!filePath.startsWith(DIST_DIR)) return json(response, 404, { error: 'Not found' });

  try {
    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) throw Object.assign(new Error('Not a file'), { code: 'ENOENT' });
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
    filePath = join(DIST_DIR, 'index.html');
  }

  const extension = extname(filePath).toLowerCase();
  const isHtml = extension === '.html';
  response.writeHead(200, {
    'Content-Type': MIME_TYPES[extension] || 'application/octet-stream',
    'Cache-Control': isHtml ? 'no-store' : safePath.startsWith('assets/') ? 'public, max-age=31536000, immutable' : 'public, max-age=3600, must-revalidate',
    'Referrer-Policy': 'no-referrer',
    'X-Content-Type-Options': 'nosniff',
  });
  if (request.method === 'HEAD') return response.end();
  createReadStream(filePath).pipe(response);
}

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url, 'http://localhost');
    if (url.pathname === '/healthz') {
      return json(response, 200, { ok: true, remindersConfigured: Boolean(BOT_TOKEN) });
    }
    if (url.pathname === '/api/reminders/schedule' && request.method === 'POST') {
      if (!BOT_TOKEN) return json(response, 503, { error: 'Telegram reminders are not configured' });
      const result = await scheduleReminders(await readJsonBody(request));
      void processDueReminders();
      return json(response, 200, { ok: true, ...result });
    }
    if (url.pathname === '/api/reminders/cancel' && request.method === 'POST') {
      if (!BOT_TOKEN) return json(response, 503, { error: 'Telegram reminders are not configured' });
      const result = await cancelReminders(await readJsonBody(request));
      return json(response, 200, { ok: true, ...result });
    }
    if (url.pathname.startsWith('/api/')) return json(response, 404, { error: 'Not found' });
    if (request.method !== 'GET' && request.method !== 'HEAD') return json(response, 405, { error: 'Method not allowed' });
    return serveStatic(request, response);
  } catch (error) {
    const message = String(error?.message || error);
    const status = /signature|session|auth date|initData|Telegram user/.test(message) ? 401 : 400;
    console.error('Request failed:', message);
    return json(response, status, { error: message });
  }
});

await mkdir(DATA_DIR, { recursive: true });
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Put Muzhchiny server listening on port ${PORT}; reminders=${BOT_TOKEN ? 'configured' : 'disabled'}`);
});

if (!SCHEDULER_DISABLED) {
  setInterval(() => void processDueReminders(), 30_000).unref();
  setTimeout(() => void processDueReminders(), 1_000).unref();
}
