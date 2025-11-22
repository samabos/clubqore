# Logging Documentation

ClubQore backend uses **Pino** for structured logging with **Seq** for log aggregation and visualization.

## Architecture

- **Pino**: Fast, low-overhead structured logger
- **Pino-Pretty**: Pretty console output for development
- **Pino-Seq**: Transport to send logs to Seq server
- **Seq**: Centralized log server with powerful search and filtering

## Configuration

### Environment Variables

```bash
# Optional - Seq server URL (automatically configured in docker-compose)
SEQ_SERVER_URL=http://seq:5341

# Optional - Seq API key for authentication (if needed)
SEQ_API_KEY=your-api-key-here

# Optional - Log level (default: 'info' in production, 'debug' in development)
LOG_LEVEL=debug
```

### Log Levels

- `fatal` (60): Application crash
- `error` (50): Error events
- `warn` (40): Warning conditions
- `info` (30): Informational messages (default)
- `debug` (20): Debug information
- `trace` (10): Very detailed debugging

## Accessing Logs

### Development (Docker Compose)

1. **Seq UI**: http://localhost:5341
   - View all structured logs
   - Filter by level, properties, time range
   - Create queries and dashboards

2. **Console**: Pretty-printed logs in terminal
   ```bash
   docker compose logs -f backend
   ```

### Staging/Production

Seq UI will be available at the configured Seq server URL.

## Using the Logger

### Basic Usage

```javascript
import logger from './config/logger.js';

// Simple log
logger.info('User registered');

// With structured data
logger.info({ userId: 123, email: 'user@example.com' }, 'User registered');

// Error logging
logger.error({ err, userId: 123 }, 'Failed to create user');
```

### Creating Child Loggers

```javascript
import { createLogger } from './config/logger.js';

// Create logger with context
const authLogger = createLogger({ module: 'auth' });
authLogger.info('Processing login');

// All logs will include module: 'auth'
```

### In Fastify Routes

```javascript
// Logger is available on fastify instance
fastify.get('/users', async (request, reply) => {
  request.log.info({ userId: request.user.id }, 'Fetching users');

  try {
    const users = await db.getUsers();
    return users;
  } catch (err) {
    request.log.error({ err }, 'Failed to fetch users');
    throw err;
  }
});
```

## Sensitive Data Redaction

The logger automatically redacts sensitive fields:
- `req.headers.authorization`
- `req.headers.cookie`
- `password`
- `token`

These will appear as `***REDACTED***` in logs.

## Log Querying in Seq

### Example Queries

**Find all errors:**
```
@Level = 'Error'
```

**Find logs for specific user:**
```
userId = 123
```

**Find slow requests:**
```
responseTime > 1000
```

**Combine filters:**
```
@Level = 'Error' and module = 'auth'
```

## Best Practices

1. **Use structured logging**: Include relevant context as objects
   ```javascript
   // Good
   logger.info({ userId, action: 'login' }, 'User logged in');

   // Avoid
   logger.info(`User ${userId} logged in`);
   ```

2. **Log appropriate levels**:
   - `error`: For actual errors that need attention
   - `warn`: For potential issues
   - `info`: For business events
   - `debug`: For development information

3. **Include context**: Always include relevant IDs and metadata

4. **Don't log sensitive data**: The redactor helps, but be mindful

5. **Use child loggers**: For module-specific context

## Troubleshooting

### Logs not appearing in Seq

1. Check Seq container is running:
   ```bash
   docker compose ps seq
   ```

2. Check Seq logs:
   ```bash
   docker compose logs seq
   ```

3. Verify SEQ_SERVER_URL environment variable

4. Check backend can reach Seq:
   ```bash
   docker compose exec backend curl http://seq:5341
   ```

### Performance Impact

Pino is designed for minimal overhead:
- Async logging (doesn't block application)
- JSON serialization (fast)
- Child loggers share configuration
