#!/usr/bin/env bash
# Apply database migrations and start the server.
# Use this in your container entrypoint or as a one-off job.
set -euo pipefail

echo "→ Running prisma migrate deploy..."
npx prisma migrate deploy --schema=prisma/schema.prisma

echo "→ Starting application..."
exec node server.js
