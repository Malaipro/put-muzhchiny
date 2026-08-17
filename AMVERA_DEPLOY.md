# Деплой на Amvera

## Быстрый старт

1. Зарегистрируйся / войди в [amvera.ru](https://amvera.ru)
2. Создай новый проект типа **Docker**
3. Выбери источник: **Git** → подключи репозиторий `Malaipro/put-muzhchiny`
4. Укажи ветку `main` и корень `/`
5. Нажми **Развернуть**

Amvera автоматически найдёт `Dockerfile` и соберёт образ.

## Ручная загрузка (если не хочешь подключать Git)

1. Собери локально:
   ```bash
   npm run build
   ```
2. Запакуй `dist/` в zip-архив
3. В Amvera выбери **Загрузить архив** и укажи zip

## Переменные окружения (позже, для production)

В настройках проекта добавь:
- `VITE_SUPABASE_URL` — URL твоего Supabase проекта
- `VITE_SUPABASE_ANON_KEY` — публичный ключ
- `VITE_BOT_TOKEN` — токен Telegram бота (для валидации WebAppData)

## Проверка

После деплоя Amvera выдаст URL вида:
`https://your-project.amvera.io`

Этот URL вставляй в Telegram BotFather → `/setwebapp` → выбор бота → вставка URL.

## Обновление

При каждом `git push` в `main` Amvera автоматически пересоберёт и обновит приложение.
