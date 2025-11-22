# Backend Dockerfile for ClubQore
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Expose port
EXPOSE 3000

# Health check disabled - causes issues with Traefik routing
# Traefik will perform its own health checks instead
# HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
#   CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if(r.statusCode !== 200) throw new Error('Health check failed')})"

# Start application (runs migrations first via sh to handle line endings)
CMD ["sh", "-c", "KNEX_ENV=${NODE_ENV:-development} && echo \"🔄 Running database migrations for environment: $KNEX_ENV...\" && npx knex migrate:latest --knexfile knexfile.js --env $KNEX_ENV && echo \"🚀 Starting application...\" && exec node src/server.js"]
