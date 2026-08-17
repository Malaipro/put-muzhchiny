# Настройка Telegram бота для Mini App

## 1. Минимальная настройка через BotFather

Уже должно быть сделано:
- `/newbot` — создан бот
- `/setwebapp` — указан URL `https://malaipro.github.io/put-muzhchiny/` (потом заменим на Amvera)

## 2. Кнопка в меню бота (Menu Button)

Это кнопка «Открыть приложение» в правом верхнем углу чата с ботом.

Через curl (замени `YOUR_BOT_TOKEN`):

```bash
curl -X POST \
  https://api.telegram.org/botYOUR_BOT_TOKEN/setChatMenuButton \
  -H 'Content-Type: application/json' \
  -d '{
    "menu_button": {
      "type": "web_app",
      "text": "Играть",
      "web_app": {
        "url": "https://malaipro.github.io/put-muzhchiny/"
      }
    }
  }'
```

## 3. Кнопка при старте (/start)

Чтобы при `/start` показывалась красивая кнопка в чате, нужен серверный webhook.

Простейший вариант — Supabase Edge Function (ниже), или можно временно использовать webhook.site для теста.

### Отправка кнопки вручную (через curl)

Найди свой `chat_id` (напиши боту, потом открой `https://api.telegram.org/botYOUR_BOT_TOKEN/getUpdates` и найди `"chat":{"id":123456789`)

```bash
curl -X POST \
  https://api.telegram.org/botYOUR_BOT_TOKEN/sendMessage \
  -H 'Content-Type: application/json' \
  -d '{
    "chat_id": YOUR_CHAT_ID,
    "text": "Добро пожаловать в Путь Мужчины.\n\n72 клетки. Один запрос. Твой путь начинается здесь.",
    "reply_markup": {
      "inline_keyboard": [
        [
          {
            "text": "🎲 Начать Путь",
            "web_app": {
              "url": "https://malaipro.github.io/put-muzhchiny/"
            }
          }
        ]
      ]
    }
  }'
```

## 4. Автоматический ответ на /start (через Supabase Edge Function)

Файл: `supabase/functions/telegram-bot/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const BOT_TOKEN = Deno.env.get('BOT_TOKEN');
const WEBAPP_URL = 'https://malaipro.github.io/put-muzhchiny/';

serve(async (req) => {
  const { message } = await req.json();

  if (message?.text === '/start') {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: message.chat.id,
        text: 'Добро пожаловать в Путь Мужчины.',
        reply_markup: {
          inline_keyboard: [[
            { text: '🎲 Начать Путь', web_app: { url: WEBAPP_URL } }
          ]]
        }
      })
    });
  }

  return new Response('OK');
});
```

Затем установи webhook:
```bash
curl "https://api.telegram.org/botYOUR_BOT_TOKEN/setWebhook?url=https://YOUR_PROJECT.supabase.co/functions/v1/telegram-bot"
```

## 5. Полезные API методы

### Удалить webhook (если нужно отключить)
```bash
curl "https://api.telegram.org/botYOUR_BOT_TOKEN/deleteWebhook"
```

### Получить информацию о боте
```bash
curl "https://api.telegram.org/botYOUR_BOT_TOKEN/getMe"
```

### Проверить webhook
```bash
curl "https://api.telegram.org/botYOUR_BOT_TOKEN/getWebhookInfo"
```

---

**Важно:** после переезда на Amvera не забудь обновить URL во всех местах:
1. BotFather → `/setwebapp`
2. Menu Button (curl)
3. Webhook / Edge Function
