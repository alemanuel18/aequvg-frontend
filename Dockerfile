FROM oven/bun:1-alpine

WORKDIR /app

COPY . .

EXPOSE 3000

CMD ["sh", "-c", "if [ -f package.json ]; then bun install && bun run dev --host 0.0.0.0; else echo 'Frontend pendiente de implementación'; exec tail -f /dev/null; fi"]
