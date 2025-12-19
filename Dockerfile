# --- Build web ---
FROM node:20-alpine AS web_builder
WORKDIR /app
COPY package.json ./
COPY apps/web/package.json apps/web/package.json
COPY apps/server/package.json apps/server/package.json
RUN npm install
COPY apps/web apps/web
RUN npm -w apps/web run build

# --- Build server ---
FROM node:20-alpine AS server_builder
WORKDIR /app
COPY package.json ./
COPY apps/web/package.json apps/web/package.json
COPY apps/server/package.json apps/server/package.json
RUN npm install
COPY apps/server apps/server
RUN npm -w apps/server run build

# --- Runtime ---
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY package.json ./
COPY apps/web/package.json apps/web/package.json
COPY apps/server/package.json apps/server/package.json
RUN npm install --omit=dev

# server runtime files
COPY --from=server_builder /app/apps/server/dist /app/apps/server/dist
COPY --from=server_builder /app/apps/server/prisma /app/apps/server/prisma

# built web -> served by server
COPY --from=web_builder /app/apps/web/dist /app/apps/server/public

EXPOSE 8080
CMD ["sh", "-c", "cd apps/server && npx prisma generate && npx prisma migrate deploy && node dist/index.js"]
