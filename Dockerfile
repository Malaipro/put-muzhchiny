# Multi-stage build for Amvera / any Docker host
# Stage 1: Build React app
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Amvera can reuse a previously built application layer after a repository
# update. Change this revision for releases that must rebuild the full client.
ARG APP_BUILD_REVISION=2026-11-09-telegram-reminders-v1
RUN echo "$APP_BUILD_REVISION" > /tmp/put-muzhchiny-build-revision

COPY . .
RUN npm run build

# Stage 2: Serve the SPA and persistent Telegram reminder queue.
FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY server.mjs ./server.mjs
COPY server ./server
ENV PORT=80
ENV DATA_DIR=/data
EXPOSE 80
CMD ["node", "server.mjs"]
