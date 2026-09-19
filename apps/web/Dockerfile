FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
# ScifiUI path dep expected at build context sibling — copy if vendored, else install from workspace
COPY packages packages
COPY apps/web apps/web
ARG VITE_PUBLIC_API_URL=
ARG VITE_HUB_MARKET=worldwide
ENV VITE_PUBLIC_API_URL=$VITE_PUBLIC_API_URL
ENV VITE_HUB_MARKET=$VITE_HUB_MARKET
RUN pnpm install --filter @creative-hub/web --filter @creative-hub/shared \
 && pnpm --filter @creative-hub/shared build \
 && pnpm --filter @creative-hub/web build

FROM nginx:alpine
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
