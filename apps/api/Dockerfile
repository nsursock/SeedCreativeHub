FROM node:22-alpine AS deps
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/
RUN pnpm install --filter @creative-hub/api --filter @creative-hub/shared

FROM deps AS build
COPY packages/shared packages/shared
COPY apps/api apps/api
RUN pnpm --filter @creative-hub/shared build \
 && pnpm --filter @creative-hub/api exec prisma generate \
 && pnpm --filter @creative-hub/api build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api ./apps/api
COPY --from=build /app/packages/shared ./packages/shared
WORKDIR /app/apps/api
EXPOSE 3001
CMD ["node", "dist/index.js"]
