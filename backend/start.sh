#!/bin/sh
set -e

echo "🔄 Running database migrations..."
npm run migrate:latest

echo "🚀 Starting application..."
exec node src/server.js
