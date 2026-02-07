/**
 * Base class for application errors
 */
export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 400 Bad Request errors
 */
export class BadRequestError extends AppError {
  constructor(message = 'Bad request') {
    super(message, 400);
  }
}

/**
 * 401 Unauthorized errors
 */
export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401);
  }
}

/**
 * 403 Forbidden errors
 */
export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403);
  }
}

/**
 * 404 Not Found errors
 */
export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

/**
 * 409 Conflict errors
 */
export class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409);
  }
}

/**
 * 422 Unprocessable Entity errors
 */
export class ValidationError extends AppError {
  constructor(message = 'Validation failed', errors = null) {
    super(message, 422);
    this.errors = errors;
  }
}

/**
 * Specific application errors
 */
export class EmailTakenError extends ConflictError {
  constructor(email) {
    super(`Email ${email} is already taken`);
  }
}

export class UserNotFoundError extends NotFoundError {
  constructor(userId) {
    super(userId ? `User with ID ${userId} not found` : 'User not found');
  }
}

export class InvalidCredentialsError extends UnauthorizedError {
  constructor() {
    super('Invalid email or password');
  }
}

export class RoleNotFoundError extends NotFoundError {
  constructor(roleName) {
    super(`Role "${roleName}" not found`);
  }
}

export class ClubNotFoundError extends NotFoundError {
  constructor(clubId) {
    super(clubId ? `Club with ID ${clubId} not found` : 'Club not found');
  }
}

export class AccessDeniedError extends ForbiddenError {
  constructor(message = 'Access denied') {
    super(message);
  }
}

export class EmailNotVerifiedError extends UnauthorizedError {
  constructor() {
    super('Please verify your email before signing in');
    this.code = 'EMAIL_NOT_VERIFIED';
  }
}
