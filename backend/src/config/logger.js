import pino from 'pino';

const isDevelopment = process.env.NODE_ENV === 'development';

// Base logger configuration
const loggerConfig = {
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),

  // Format timestamps
  timestamp: pino.stdTimeFunctions.isoTime,

  // Redact sensitive information
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie', 'password', 'token'],
    censor: '***REDACTED***'
  },

  // Serialize common objects
  serializers: {
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
    err: pino.stdSerializers.err,
  },
};

// Create logger with simple configuration
// NOTE: Transports are disabled for now due to worker thread flush timeout issues
// TODO: Re-enable transports once pino transport stability is resolved
const logger = pino(loggerConfig);

// Create child logger with context
export function createLogger(context = {}) {
  return logger.child(context);
}

// Export default logger
export default logger;
