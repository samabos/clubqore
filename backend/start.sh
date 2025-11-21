#!/bin/sh
set -e

# Determine which environment to use for migrations
KNEX_ENV="${NODE_ENV:-development}"
echo "🔄 Running database migrations for environment: $KNEX_ENV..."

# Run migrations with the correct environment
NODE_ENV=$KNEX_ENV npx knex migrate:latest --knexfile knexfile.js --env $KNEX_ENV

echo "🚀 Starting application..."
exec node src/server.js
