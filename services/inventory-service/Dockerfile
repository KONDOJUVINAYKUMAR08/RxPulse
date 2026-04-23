FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY src/ ./src/

FROM node:18-alpine AS production
RUN addgroup -S rxpulse && \
    adduser -S rxpulse -G rxpulse
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/src ./src
RUN chown -R rxpulse:rxpulse /app
USER rxpulse
EXPOSE 3003
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3003/health || exit 1
CMD ["node", "src/app.js"]