/**
 * Custom Error Classes for ClubQore
 *
 * Provides structured error handling with specific error types
 * for different failure scenarios.
 */

/**
 * Base API Error class with HTTP status code support
 */
export class ApiError extends Error {
  statusCode?: number;
  code?: string;
  details?: unknown;

  constructor(
    message: string,
    statusCode?: number,
    code?: string,
    details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

/**
 * Authentication/Authorization errors (401, 403)
 */
export class AuthenticationError extends ApiError {
  constructor(message: string = 'Authentication failed', details?: unknown) {
    super(message, 401, 'AUTH_ERROR', details);
    this.name = 'AuthenticationError';
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

/**
 * Resource not found errors (404)
 */
export class NotFoundError extends ApiError {
  constructor(resource: string = 'Resource', details?: unknown) {
    super(`${resource} not found`, 404, 'NOT_FOUND', details);
    this.name = 'NotFoundError';
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * Validation errors (400, 422)
 */
export class ValidationError extends ApiError {
  errors?: Record<string, string[]>;

  constructor(message: string = 'Validation failed', errors?: Record<string, string[]>) {
    super(message, 400, 'VALIDATION_ERROR', errors);
    this.name = 'ValidationError';
    this.errors = errors;
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Conflict errors (409) - e.g., duplicate email
 */
export class ConflictError extends ApiError {
  constructor(message: string = 'Resource already exists', details?: unknown) {
    super(message, 409, 'CONFLICT', details);
    this.name = 'ConflictError';
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

/**
 * Server errors (500+)
 */
export class ServerError extends ApiError {
  constructor(message: string = 'Server error occurred', details?: unknown) {
    super(message, 500, 'SERVER_ERROR', details);
    this.name = 'ServerError';
    Object.setPrototypeOf(this, ServerError.prototype);
  }
}

/**
 * Network/Connection errors
 */
export class NetworkError extends ApiError {
  constructor(message: string = 'Network error occurred', details?: unknown) {
    super(message, 0, 'NETWORK_ERROR', details);
    this.name = 'NetworkError';
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

/**
 * API Error Response shape
 */
interface ApiErrorResponse {
  message?: string;
  error?: string;
  details?: unknown;
  errors?: Record<string, string[]>;
}

/**
 * Parse error response and throw appropriate error type
 */
export async function handleApiError(response: Response): Promise<never> {
  let errorData: ApiErrorResponse;

  try {
    errorData = await response.json();
  } catch {
    // If response is not JSON, use status text
    errorData = { message: response.statusText };
  }

  const message = errorData.message || errorData.error || 'An error occurred';
  const details = errorData.details || errorData.errors || errorData;

  // Create appropriate error based on status code
  switch (response.status) {
    case 401:
    case 403:
      throw new AuthenticationError(message, details);
    case 404:
      throw new NotFoundError(message, details);
    case 409:
      throw new ConflictError(message, details);
    case 422:
    case 400:
      throw new ValidationError(message, details as Record<string, string[]>);
    case 500:
    case 502:
    case 503:
    case 504:
      throw new ServerError(message, details);
    default:
      throw new ApiError(message, response.status, 'API_ERROR', details);
  }
}
