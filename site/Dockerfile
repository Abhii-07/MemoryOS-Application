FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG NEXT_PUBLIC_MEMORY_API_URL=http://localhost:8000
ARG NEXT_PUBLIC_MEMORY_ENGINE=demo
ENV NEXT_PUBLIC_MEMORY_API_URL=$NEXT_PUBLIC_MEMORY_API_URL
ENV NEXT_PUBLIC_MEMORY_ENGINE=$NEXT_PUBLIC_MEMORY_ENGINE

RUN npm run build

# ── production ───────────────────────────────────────────────────────────────
FROM node:20-alpine AS runtime

WORKDIR /app

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000

ENV NODE_ENV=production
CMD ["node", "server.js"]
