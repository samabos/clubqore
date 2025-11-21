import pino from 'pino';

const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';
const seqServerUrl = process.env.SEQ_SERVER_URL;

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

// Configure transports based on environment
const transports = [];

if (isDevelopment) {
  // Pretty print to console in development
  transports.push({
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss Z',
      ignore: 'pid,hostname',
      singleLine: false,
    }
  });
}

if (seqServerUrl) {
  // Send structured logs to Seq
  transports.push({
    target: 'pino-seq',
    options: {
      serverUrl: seqServerUrl,
      apiKey: process.env.SEQ_API_KEY || undefined,
      onError: (error) => {
        console.error('Seq logging error:', error);
      }
    }
  });
}

// Create logger with transports
const logger = pino({
  ...loggerConfig,
  transport: transports.length > 0 ? {
    targets: transports
  } : undefined
});

// Create child logger with context
export function createLogger(context = {}) {
  return logger.child(context);
}

// Export default logger
export default logger;
