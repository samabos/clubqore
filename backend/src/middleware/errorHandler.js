import { AppError } from '../errors/AppError.js';

/**
 * Global error handler middleware for Fastify
 */
export function errorHandler(error, request, reply) {
  // Handle custom AppError instances
  if (error instanceof AppError) {
    return reply.code(error.statusCode).send({
      error: error.message,
      ...(error.errors && { errors: error.errors })
    });
  }

  // Handle Fastify validation errors
  if (error.validation) {
    return reply.code(400).send({
      error: 'Validation failed',
      errors: error.validation
    });
  }

  // Handle database errors
  if (error.code === '23505') { // PostgreSQL unique violation
    return reply.code(409).send({
      error: 'Resource already exists'
    });
  }

  if (error.code === '23503') { // PostgreSQL foreign key violation
    return reply.code(400).send({
      error: 'Invalid reference to related resource'
    });
  }

  // Log unexpected errors
  console.error('Unexpected error:', error);

  // Return generic error for production
  const isDevelopment = process.env.NODE_ENV === 'development';
  return reply.code(500).send({
    error: 'Internal server error',
    ...(isDevelopment && { details: error.message, stack: error.stack })
  });
}
