# Multi-stage build for Amvera / any Docker host
# Stage 1: Build React app
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Amvera can reuse a previously built application layer after a repository
# update. Change this revision for releases that must rebuild the full client.
ARG APP_BUILD_REVISION=2026-10-20-v005-assets-after-referrer-v6
RUN echo "$APP_BUILD_REVISION" > /tmp/put-muzhchiny-build-revision

COPY . .
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
