# Multi-stage Next.js 22 — CI deploy builds `.next` on runner, this image build keeps its own prune step.
# Quality gates (lint, biome, test, quality:deps) run in CI via `npm run test-all`; use `npm run check-all` locally before PR.
FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-bookworm-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Baked at build time (same constraint as docs/deploy.md)
ARG NEXT_PUBLIC_API_URL=http://localhost:8080
ARG NEXT_PUBLIC_STREAM_SSE_URL=
ARG NEXT_PUBLIC_STREAM_WS_URL=
ARG NEXT_PUBLIC_STREAM_GRPC_BASE_URL=
# OAuth — required for the Google / Discord sign-in buttons; missing GOOGLE id → FE-local 4020
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID=
ARG NEXT_PUBLIC_X_CLIENT_ID=
ARG NEXT_PUBLIC_X_CALLBACK_URL=
ARG NEXT_PUBLIC_DISCORD_CLIENT_ID=
ARG NEXT_PUBLIC_DISCORD_CALLBACK_URL=

ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL} \
    NEXT_PUBLIC_STREAM_SSE_URL=${NEXT_PUBLIC_STREAM_SSE_URL} \
    NEXT_PUBLIC_STREAM_WS_URL=${NEXT_PUBLIC_STREAM_WS_URL} \
    NEXT_PUBLIC_STREAM_GRPC_BASE_URL=${NEXT_PUBLIC_STREAM_GRPC_BASE_URL} \
    NEXT_PUBLIC_GOOGLE_CLIENT_ID=${NEXT_PUBLIC_GOOGLE_CLIENT_ID} \
    NEXT_PUBLIC_X_CLIENT_ID=${NEXT_PUBLIC_X_CLIENT_ID} \
    NEXT_PUBLIC_X_CALLBACK_URL=${NEXT_PUBLIC_X_CALLBACK_URL} \
    NEXT_PUBLIC_DISCORD_CLIENT_ID=${NEXT_PUBLIC_DISCORD_CLIENT_ID} \
    NEXT_PUBLIC_DISCORD_CALLBACK_URL=${NEXT_PUBLIC_DISCORD_CALLBACK_URL}

RUN npm run build
RUN npm prune --omit=dev

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/public ./public
COPY package.json ./
EXPOSE 3000
CMD ["npm", "run", "start"]
