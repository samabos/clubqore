import logger from '../config/logger.js';

/**
 * Audit events categories
 */
export const AuditCategory = {
  AUTH: 'auth',
  USER: 'user',
  BILLING: 'billing',
  CLUB: 'club',
  TEAM: 'team',
  MEMBER: 'member',
  SYSTEM: 'system'
};

/**
 * Audit event types
 */
export const AuditEvent = {
  // Auth events
  LOGIN_SUCCESS: 'login_success',
  LOGIN_FAILED: 'login_failed',
  LOGOUT: 'logout',
  REGISTER: 'register',
  PASSWORD_RESET_REQUEST: 'password_reset_request',
  PASSWORD_RESET_SUCCESS: 'password_reset_success',
  TOKEN_REFRESH: 'token_refresh',
  TOKEN_REVOKED: 'token_revoked',

  // User events
  USER_CREATED: 'user_created',
  USER_UPDATED: 'user_updated',
  USER_DELETED: 'user_deleted',
  ROLE_CHANGED: 'role_changed',
  EMAIL_VERIFIED: 'email_verified',

  // Billing events
  INVOICE_CREATED: 'invoice_created',
  INVOICE_SENT: 'invoice_sent',
  INVOICE_PAID: 'invoice_paid',
  INVOICE_CANCELLED: 'invoice_cancelled',
  PAYMENT_RECEIVED: 'payment_received',

  // Club events
  CLUB_CREATED: 'club_created',
  CLUB_UPDATED: 'club_updated',
  CLUB_APPROVED: 'club_approved',

  // Access control events
  PERMISSION_DENIED: 'permission_denied',
  UNAUTHORIZED_ACCESS: 'unauthorized_access'
};

/**
 * Audit logging service for tracking security and business events
 */
export class AuditService {
  constructor(db) {
    this.db = db;
  }

  /**
   * Log an audit event
   * @param {Object} params - Audit event parameters
   * @param {string} params.category - Event category (auth, user, billing, etc.)
   * @param {string} params.event - Event type
   * @param {number|null} params.userId - User ID (if applicable)
   * @param {Object} params.metadata - Additional event data
   * @param {string} params.ip - IP address of the request
   * @param {string} params.userAgent - User agent string
   * @param {boolean} params.success - Whether the action was successful
   */
  async log({
    category,
    event,
    userId = null,
    metadata = {},
    ip = null,
    userAgent = null,
    success = true
  }) {
    const logData = {
      category,
      event,
      userId,
      metadata,
      ip,
      userAgent,
      success,
      timestamp: new Date().toISOString()
    };

    // Log to structured logger
    if (success) {
      logger.info({ audit: logData }, `[AUDIT] ${category}.${event}`);
    } else {
      logger.warn({ audit: logData }, `[AUDIT] ${category}.${event} - FAILED`);
    }

    // Optionally persist to database (for compliance requirements)
    try {
      // Check if audit_logs table exists before inserting
      const tableExists = await this.db.schema.hasTable('audit_logs');
      if (tableExists) {
        await this.db('audit_logs').insert({
          category,
          event,
          user_id: userId,
          metadata: JSON.stringify(metadata),
          ip_address: ip,
          user_agent: userAgent,
          success,
          created_at: new Date()
        });
      }
    } catch (error) {
      // Don't fail if audit log persistence fails
      logger.error({ error: error.message }, 'Failed to persist audit log');
    }
  }

  /**
   * Log a successful login
   */
  async logLoginSuccess(userId, ip, userAgent) {
    await this.log({
      category: AuditCategory.AUTH,
      event: AuditEvent.LOGIN_SUCCESS,
      userId,
      ip,
      userAgent,
      success: true
    });
  }

  /**
   * Log a failed login attempt
   */
  async logLoginFailed(email, ip, userAgent, reason) {
    await this.log({
      category: AuditCategory.AUTH,
      event: AuditEvent.LOGIN_FAILED,
      metadata: { email, reason },
      ip,
      userAgent,
      success: false
    });
  }

  /**
   * Log a permission denied event
   */
  async logPermissionDenied(userId, resource, action, ip) {
    await this.log({
      category: AuditCategory.AUTH,
      event: AuditEvent.PERMISSION_DENIED,
      userId,
      metadata: { resource, action },
      ip,
      success: false
    });
  }

  /**
   * Log a password reset request
   */
  async logPasswordResetRequest(email, ip) {
    await this.log({
      category: AuditCategory.AUTH,
      event: AuditEvent.PASSWORD_RESET_REQUEST,
      metadata: { email },
      ip,
      success: true
    });
  }

  /**
   * Log a role change
   */
  async logRoleChange(userId, targetUserId, oldRole, newRole, ip) {
    await this.log({
      category: AuditCategory.USER,
      event: AuditEvent.ROLE_CHANGED,
      userId,
      metadata: { targetUserId, oldRole, newRole },
      ip,
      success: true
    });
  }

  /**
   * Log billing event
   */
  async logBillingEvent(event, userId, invoiceId, metadata, ip) {
    await this.log({
      category: AuditCategory.BILLING,
      event,
      userId,
      metadata: { invoiceId, ...metadata },
      ip,
      success: true
    });
  }
}

// Singleton instance creator
let auditServiceInstance = null;

export function createAuditService(db) {
  if (!auditServiceInstance) {
    auditServiceInstance = new AuditService(db);
  }
  return auditServiceInstance;
}
