import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { createTestApp, cleanDatabase } from '../../setup.js';

describe('Auth Routes Integration Tests', () => {
  let app;

  // Helper function to create unique test user data
  const createTestUser = (prefix = 'test') => ({
    email: `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@example.com`,
    password: 'password123'
  });

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await cleanDatabase(app);
  });

  // ============================================================================
  // REGISTER ROUTE TESTS
  // ============================================================================
  describe('POST /auth/register', () => {
    test('should register a new user successfully', async () => {
      const testUser = createTestUser();
      
      const response = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: testUser
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      
      expect(body.accessToken).toBeDefined();
      expect(body.refreshToken).toBeDefined();
      expect(body.user.email).toBe(testUser.email);
      expect(body.user.id).toBeDefined();
      expect(body.user.password).toBeUndefined(); // Should not return password

      // Verify user was created in database
      const userInDb = await app.db('users').where({ email: testUser.email }).first();
      expect(userInDb).toBeDefined();
      expect(userInDb.email).toBe(testUser.email);
    });

    test('should not register user with duplicate email', async () => {
      const testUser = createTestUser('duplicate');
      
      // Register user first
      await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: testUser
      });

      // Try to register again
      const response = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: testUser
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Email taken');
    });

    test('should handle case-insensitive email duplicates', async () => {
      // Register with lowercase email
      await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: { email: 'test@example.com', password: 'password123' }
      });

      // Try to register with uppercase email
      const response = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: { email: 'TEST@EXAMPLE.COM', password: 'password123' }
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Email taken');
    });

    test('should validate required fields', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: { email: 'test@example.com' } // Missing password
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Email and password required');
    });

    test('should validate email format', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: {
          email: 'invalid-email',
          password: 'password123'
        }
      });

      expect(response.statusCode).toBe(400);
    });

    test('should validate password length', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: {
          email: 'test@example.com',
          password: '123' // Too short
        }
      });

      expect(response.statusCode).toBe(400);
    });
  });

  // ============================================================================
  // LOGIN ROUTE TESTS
  // ============================================================================
  describe('POST /auth/login', () => {
    let testUser;

    beforeEach(async () => {
      // Create unique test user for each login test
      testUser = createTestUser('login');
      
      // Register a user for login tests
      await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: testUser
      });
    });

    test('should login with valid credentials', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: testUser
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      
      expect(body.accessToken).toBeDefined();
      expect(body.refreshToken).toBeDefined();
      expect(body.user.email).toBe(testUser.email);
      expect(body.user.id).toBeDefined();
    });

    test('should handle case-insensitive email login', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          email: testUser.email.toUpperCase(), // Use uppercase version of the actual test user email
          password: testUser.password
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.user.email).toBe(testUser.email.toLowerCase());
    });

    test('should reject invalid email', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          email: 'wrong@example.com',
          password: testUser.password
        }
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Invalid credentials');
    });

    test('should reject invalid password', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          email: testUser.email,
          password: 'wrongpassword'
        }
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Invalid credentials');
    });

    test('should validate required fields', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: { email: testUser.email } // Missing password
      });

      expect(response.statusCode).toBe(400);
    });
  });

  // ============================================================================
  // LOGOUT ROUTE TESTS
  // ============================================================================
  describe('POST /auth/logout', () => {
    let testUser;
    let accessToken;

    beforeEach(async () => {
      testUser = createTestUser('logout');
      
      const response = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: testUser
      });
      accessToken = JSON.parse(response.body).accessToken;
    });

    test('should logout successfully with valid token', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/logout',
        headers: {
          authorization: `Bearer ${accessToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.message).toBe('Logged out successfully');
    });

    test('should invalidate token after logout', async () => {
      // Logout
      await app.inject({
        method: 'POST',
        url: '/auth/logout',
        headers: {
          authorization: `Bearer ${accessToken}`
        }
      });

      // Try to use the token
      const response = await app.inject({
        method: 'GET',
        url: '/auth/me',
        headers: {
          authorization: `Bearer ${accessToken}`
        }
      });

      expect(response.statusCode).toBe(401);
    });

    test('should reject logout without token', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/logout'
      });

      expect(response.statusCode).toBe(401);
    });

    test('should reject logout with invalid token', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/logout',
        headers: {
          authorization: 'Bearer invalid-token'
        }
      });

      expect(response.statusCode).toBe(401);
    });
  });

  // ============================================================================
  // LOGOUT ALL ROUTE TESTS
  // ============================================================================
  describe('POST /auth/logout-all', () => {
    let testUser;
    let accessToken1, accessToken2;

    beforeEach(async () => {
      testUser = createTestUser('logoutall');
      
      // Create first session
      const response1 = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: testUser
      });
      accessToken1 = JSON.parse(response1.body).accessToken;

      // Create second session (login again)
      const response2 = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: testUser
      });
      accessToken2 = JSON.parse(response2.body).accessToken;
    });

    test('should logout from all devices', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/logout-all',
        headers: {
          authorization: `Bearer ${accessToken1}`
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.message).toBe('Logged out from all devices successfully');
    });

    test('should invalidate all user tokens', async () => {
      // Logout from all devices
      await app.inject({
        method: 'POST',
        url: '/auth/logout-all',
        headers: {
          authorization: `Bearer ${accessToken1}`
        }
      });

      // Both tokens should be invalid
      const response1 = await app.inject({
        method: 'GET',
        url: '/auth/me',
        headers: {
          authorization: `Bearer ${accessToken1}`
        }
      });

      const response2 = await app.inject({
        method: 'GET',
        url: '/auth/me',
        headers: {
          authorization: `Bearer ${accessToken2}`
        }
      });

      expect(response1.statusCode).toBe(401);
      expect(response2.statusCode).toBe(401);
    });

    test('should not affect other users tokens', async () => {
      // Create another user
      const otherUser = { email: 'other@example.com', password: 'password123' };
      const otherUserResponse = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: otherUser
      });

      const { accessToken: otherAccessToken } = JSON.parse(otherUserResponse.body);

      // Logout all for first user
      await app.inject({
        method: 'POST',
        url: '/auth/logout-all',
        headers: {
          authorization: `Bearer ${accessToken1}`
        }
      });

      // Other user's token should still work
      const meResponse = await app.inject({
        method: 'GET',
        url: '/auth/me',
        headers: {
          authorization: `Bearer ${otherAccessToken}`
        }
      });

      expect(meResponse.statusCode).toBe(200);
    });
  });

  // ============================================================================
  // ME ROUTE TESTS
  // ============================================================================
  describe('GET /auth/me', () => {
    let testUser;
    let accessToken;

    beforeEach(async () => {
      testUser = createTestUser('me');
      
      const response = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: testUser
      });
      accessToken = JSON.parse(response.body).accessToken;
    });

    test('should return user info with valid token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/auth/me',
        headers: {
          authorization: `Bearer ${accessToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.user.email).toBe(testUser.email);
      expect(body.user.id).toBeDefined();
      expect(body.user.password).toBeUndefined();
    });

    test('should reject request without token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/auth/me'
      });

      expect(response.statusCode).toBe(401);
    });

    test('should reject request with invalid token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/auth/me',
        headers: {
          authorization: 'Bearer invalid-token'
        }
      });

      expect(response.statusCode).toBe(401);
    });
  });

  // ============================================================================
  // REFRESH TOKEN ROUTE TESTS
  // ============================================================================
  describe('POST /auth/refresh', () => {
    let testUser;
    let refreshToken;

    beforeEach(async () => {
      testUser = createTestUser('refresh');
      
      const response = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: testUser
      });
      refreshToken = JSON.parse(response.body).refreshToken;
    });

    test('should refresh token with valid refresh token', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/refresh',
        payload: { refreshToken }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.accessToken).toBeDefined();
      expect(body.refreshToken).toBeDefined();
    });

    test('should reject invalid refresh token', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/refresh',
        payload: { refreshToken: 'invalid-token' }
      });

      expect(response.statusCode).toBe(401);
    });

    test('should validate required refresh token', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/refresh',
        payload: {}
      });

      expect(response.statusCode).toBe(400);
    });
  });

  // ============================================================================
  // EMAIL VERIFICATION ROUTE TESTS
  // ============================================================================
  describe('Email Verification Routes', () => {
    let testUser;
    let accessToken;

    beforeEach(async () => {
      testUser = createTestUser('verification');
      
      const response = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: testUser
      });
      
      const body = JSON.parse(response.body);
      accessToken = body.accessToken;
      // userId available via body.user?.id if needed
    });

    describe('POST /auth/verify-email', () => {
      test('should send email verification to current user email', async () => {
        const response = await app.inject({
          method: 'POST',
          url: '/auth/verify-email',
          payload: {},
          headers: {
            authorization: `Bearer ${accessToken}`
          }
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.message).toBe('Verification email sent successfully');
        expect(body.email).toBe(testUser.email);
      });

      test('should send email verification to specific email', async () => {
        const specificEmail = 'specific@example.com';
        const response = await app.inject({
          method: 'POST',
          url: '/auth/verify-email',
          payload: { email: specificEmail },
          headers: {
            authorization: `Bearer ${accessToken}`
          }
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.message).toBe('Verification email sent successfully');
        expect(body.email).toBe(specificEmail);
      });

      test('should reject without authentication', async () => {
        const response = await app.inject({
          method: 'POST',
          url: '/auth/verify-email',
          payload: {}
        });

        expect(response.statusCode).toBe(401);
      });
    });
  });

  // ============================================================================
  // PASSWORD RESET ROUTE TESTS
  // ============================================================================
  describe('Password Reset Routes', () => {
    let testUser;

    beforeEach(async () => {
      testUser = createTestUser('passwordreset');
      
      await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: testUser
      });
    });

    describe('POST /auth/forgot-password', () => {
      test('should send password reset email', async () => {
        const response = await app.inject({
          method: 'POST',
          url: '/auth/forgot-password',
          payload: { email: testUser.email }
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.message).toBeDefined();
      });

      test('should handle non-existent email gracefully', async () => {
        const response = await app.inject({
          method: 'POST',
          url: '/auth/forgot-password',
          payload: { email: 'nonexistent@example.com' }
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.message).toBeDefined();
      });

      test('should validate email format', async () => {
        const response = await app.inject({
          method: 'POST',
          url: '/auth/forgot-password',
          payload: { email: 'invalid-email' }
        });

        expect(response.statusCode).toBe(400);
      });

      test('should require email field', async () => {
        const response = await app.inject({
          method: 'POST',
          url: '/auth/forgot-password',
          payload: {}
        });

        expect(response.statusCode).toBe(400);
      });
    });

    describe('POST /auth/reset-password', () => {
      test('should reject invalid token', async () => {
        const response = await app.inject({
          method: 'POST',
          url: '/auth/reset-password',
          payload: {
            token: 'invalid-token',
            password: 'newpassword123'
          }
        });

        expect(response.statusCode).toBe(400);
      });

      test('should validate new password length', async () => {
        const response = await app.inject({
          method: 'POST',
          url: '/auth/reset-password',
          payload: {
            token: 'some-token',
            password: '123' // Too short
          }
        });

        expect(response.statusCode).toBe(400);
      });

      test('should require both token and password', async () => {
        const response = await app.inject({
          method: 'POST',
          url: '/auth/reset-password',
          payload: {
            token: 'some-token'
            // Missing password
          }
        });

        expect(response.statusCode).toBe(400);
      });

      test('should require token field', async () => {
        const response = await app.inject({
          method: 'POST',
          url: '/auth/reset-password',
          payload: {
            password: 'newpassword123'
            // Missing token
          }
        });

        expect(response.statusCode).toBe(400);
      });
    });
  });

  // ============================================================================
  // SECURITY TESTS
  // ============================================================================
  describe('Security Tests', () => {
    let testUser;
    let accessToken;

    beforeEach(async () => {
      testUser = createTestUser('security');
      
      const response = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: testUser
      });
      accessToken = JSON.parse(response.body).accessToken;
    });

    test('should reject malformed authorization header', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/auth/me',
        headers: {
          authorization: 'InvalidFormat token'
        }
      });

      expect(response.statusCode).toBe(401);
    });

    test('should reject missing Bearer prefix', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/auth/me',
        headers: {
          authorization: `${accessToken}` // Missing "Bearer " prefix
        }
      });

      expect(response.statusCode).toBe(401);
    });

    test('should handle concurrent login attempts', async () => {
      const requests = Array(5).fill().map(() =>
        app.inject({
          method: 'POST',
          url: '/auth/login',
          payload: testUser
        })
      );

      const responses = await Promise.all(requests);
      
      // All should succeed
      responses.forEach(response => {
        expect(response.statusCode).toBe(200);
      });
    });

    test('should handle concurrent logout attempts', async () => {
      const requests = Array(3).fill().map(() =>
        app.inject({
          method: 'POST',
          url: '/auth/logout',
          headers: {
            authorization: `Bearer ${accessToken}`
          }
        })
      );

      const responses = await Promise.all(requests);
      
      // All requests should succeed with 200 as logout is idempotent
      responses.forEach(response => {
        expect(response.statusCode).toBe(200);
      });
    });
  });
});
