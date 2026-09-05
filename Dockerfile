# syntax=docker/dockerfile:1

# Nuxt 4.5 requires node ^22.19 || ^24.11 || >=26. The 22 line is current LTS
# and its latest patch satisfies that floor.
ARG NODE_VERSION=22-alpine

FROM node:${NODE_VERSION} AS base
ENV CI=1
# The npm that ships with Node 22 is 10.x, whose dependency resolver crashes on
# this tree (`Cannot read properties of null (reading 'edgesOut')` while walking
# Nuxt's peer set). 11.x resolves it, and generated the committed lockfile.
RUN npm install -g npm@11 --no-fund --no-audit
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
# `--ignore-scripts` because the postinstall is `nuxt prepare`, which needs app
# source that has not been copied yet — `nuxt build` prepares on its own. The
# platform binaries for esbuild and friends arrive as optional dependencies, so
# nothing here depends on a dependency's install script running.
RUN --mount=type=cache,id=npm,target=/root/.npm \
    npm ci --ignore-scripts --no-fund --no-audit

FROM deps AS build
COPY . .
RUN npm run build

# Nitro bundles every server dependency into .output, so the runtime image needs
# neither node_modules nor a package manager — only the built output and node.
FROM node:${NODE_VERSION} AS runtime
ENV NODE_ENV=production \
    NITRO_HOST=0.0.0.0 \
    NITRO_PORT=3000
WORKDIR /app

COPY --from=build --chown=node:node /app/.output ./.output

USER node

EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=3s --start-period=15s --retries=6 \
    CMD wget -qO- http://127.0.0.1:3000/healthz || exit 1

CMD ["node", ".output/server/index.mjs"]
