# Путь Мужчины

Пробная версия Telegram Mini App: игровой путь из 72 клеток, броски кубика, задания и цикл проживания клетки в 12 часов.

## Локальный запуск

```bash
npm ci
npm run dev
```

## Проверка

```bash
npm run build
npm run lint
npm run test:reminders
```

## Размещение

- [AMVERA_DEPLOY.md](./AMVERA_DEPLOY.md) — запуск и проверка Amvera.
- [BOT_SETUP.md](./BOT_SETUP.md) — подключение готового HTTPS-адреса к Telegram.

Текущий прогресс игры хранится локально в браузере. Сервер в контейнере обслуживает готовую SPA-сборку и очередь Telegram-напоминаний в `/data`; настройка секретной переменной описана в [BOT_SETUP.md](./BOT_SETUP.md).
