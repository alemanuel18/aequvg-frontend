FROM oven/bun:1-alpine AS dependencies

WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

FROM dependencies AS development

ENV NODE_ENV=development \
    NUXT_HOST=0.0.0.0 \
    NUXT_PORT=3000

COPY . .
EXPOSE 3000
CMD ["bun", "run", "dev", "--host", "0.0.0.0"]

FROM dependencies AS build

ENV NODE_ENV=production
COPY . .
RUN bun run build

FROM oven/bun:1-alpine AS production

WORKDIR /app
ENV NODE_ENV=production \
    NITRO_HOST=0.0.0.0 \
    NITRO_PORT=3000

COPY --from=build --chown=bun:bun /app/.output ./.output
USER bun
EXPOSE 3000
CMD ["bun", ".output/server/index.mjs"]
