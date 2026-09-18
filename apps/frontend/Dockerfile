FROM oven/bun:latest AS base
WORKDIR /usr/src/app

FROM base AS install
COPY package.json bun.lock bunfig.toml ./
COPY packages ./packages
COPY apps ./apps
RUN bun install --frozen-lockfile

FROM base AS prerelease
COPY --from=install /usr/src/app/node_modules ./node_modules
COPY --from=install /usr/src/app/packages ./packages
COPY --from=install /usr/src/app/apps ./apps
COPY . .
RUN bun run build:packages
RUN bun run build:frontend

FROM base AS release
ENV NODE_ENV=production
COPY --from=prerelease /usr/src/app/apps/frontend/build ./build

USER bun
EXPOSE 3000/tcp
ENTRYPOINT [ "bun", "run", "build/index.js" ]