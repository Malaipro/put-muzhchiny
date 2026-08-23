# Multi-stage build for Amvera / any Docker host
# Stage 1: Build React app
FROM node:20-alpine AS builder
ARG BUILD_DATE=2026-08-23-v3
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
