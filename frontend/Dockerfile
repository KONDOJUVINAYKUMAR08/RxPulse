# ── Stage 1: Builder ─────────────────────────────────────────────
FROM node:18-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY index.html ./
COPY vite.config.js ./
COPY postcss.config.js ./
COPY tailwind.config.js ./
COPY src/ ./src/
RUN npm run build

# ── Stage 2: Production Nginx ─────────────────────────────────── 
FROM nginx:1.25-alpine AS production
RUN rm -f /etc/nginx/conf.d/default.conf /etc/nginx/nginx.conf
COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=builder /app/dist /usr/share/nginx/html
RUN mkdir -p /var/cache/nginx/client_temp \
             /var/cache/nginx/proxy_temp \
             /var/cache/nginx/fastcgi_temp \
             /var/cache/nginx/uwsgi_temp \
             /var/cache/nginx/scgi_temp \
             /var/run/nginx \
             /var/log/nginx && \
    chown -R nginx:nginx \
             /var/cache/nginx \
             /var/run/nginx \
             /var/log/nginx \
             /usr/share/nginx/html \
             /etc/nginx/nginx.conf && \
    chmod -R 755 /usr/share/nginx/html
# Switch to non-root nginx user (uid=101)
USER nginx
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:8080/ || exit 1
CMD ["nginx", "-g", "daemon off;"]
