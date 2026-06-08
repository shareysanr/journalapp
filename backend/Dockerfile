# Build stage
FROM node:22-bookworm-slim AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json prisma.config.ts ./
COPY prisma ./prisma
COPY src ./src

# Prisma config requires DATABASE_URL at generate time; a placeholder is enough.
ENV DATABASE_URL="postgresql://user:pass@localhost:5432/db"
RUN npx prisma generate
RUN npm run build

# Production stage
FROM node:22-bookworm-slim AS production

WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/server.js"]
