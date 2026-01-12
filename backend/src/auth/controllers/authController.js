import { AuthService } from '../services/authService.js';
import { TokenService } from '../services/tokenService.js';
import { AppError } from '../../errors/AppError.js';
import { config } from '../../config/index.js';

const isProduction = process.env.NODE_ENV === 'production';

// Cookie configuration
const getCookieOptions = (maxAgeSeconds) => ({
  httpOnly: true,
  secure: isProduction,
  sameSite: 'lax',
  path: '/',
  maxAge: maxAgeSeconds * 1000, // Convert to milliseconds
  ...(config.cookies?.domain && { domain: config.cookies.domain }),
});

export class AuthController {
  constructor(db) {
    this.authService = new AuthService(db);
    this.tokenService = new TokenService(db);
  }

  // Helper to set auth cookies
  setAuthCookies(reply, accessToken, refreshToken) {
    const accessMaxAge = config.tokens?.accessTokenExpiresIn || 900; // 15 min
    const refreshMaxAge = config.tokens?.refreshTokenExpiresIn || 604800; // 7 days

    reply.setCookie('access_token', accessToken, getCookieOptions(accessMaxAge));
    reply.setCookie('refresh_token', refreshToken, getCookieOptions(refreshMaxAge));
  }

  // Helper to clear auth cookies
  clearAuthCookies(reply) {
    const clearOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    };
    reply.setCookie('access_token', '', clearOptions);
    reply.setCookie('refresh_token', '', clearOptions);
  }

  async register(request, reply) {
    try {
      const { email, password } = request.body;

      if (!email || !password) {
        return reply.code(400).send({ error: 'Email and password required' });
      }

      const result = await this.authService.registerUser(email, password);

      // Set httpOnly cookies
      if (result.accessToken && result.refreshToken) {
        this.setAuthCookies(reply, result.accessToken, result.refreshToken);
      }

      // Return response (includes tokens for backward compatibility with mobile/API clients)
      return reply.send(result);
    } catch (error) {
      if (error instanceof AppError) {
        return reply.code(error.statusCode).send({ error: error.message });
      }
      // Log the actual error for debugging but don't expose it to the client
      request.log.error('Registration error:', error);
      // Return a generic error message to prevent information disclosure
      return reply.code(500).send({ error: 'An error occurred during registration. Please try again later.' });
    }
  }

  async login(request, reply) {
    try {
      const { email, password } = request.body;

      if (!email || !password) {
        return reply.code(400).send({ error: 'Email and password required' });
      }

      const result = await this.authService.loginUser(email, password);

      // Set httpOnly cookies
      if (result.accessToken && result.refreshToken) {
        this.setAuthCookies(reply, result.accessToken, result.refreshToken);
      }

      // Return response (includes tokens for backward compatibility with mobile/API clients)
      return reply.send(result);
    } catch (error) {
      if (error instanceof AppError) {
        return reply.code(error.statusCode).send({ error: error.message });
      }
      // Log the actual error for debugging but don't expose it to the client
      request.log.error('Login error:', error);
      // Return a generic error message to prevent information disclosure
      return reply.code(500).send({ error: 'An error occurred during login. Please try again later.' });
    }
  }

  async refresh(request, reply) {
    try {
      // Try to get refresh token from cookie first, then from body
      const refreshToken = request.cookies?.refresh_token || request.body?.refreshToken;

      if (!refreshToken) {
        return reply.code(400).send({ error: 'Refresh token required' });
      }

      const result = await this.authService.refreshTokens(refreshToken);

      // Set new httpOnly cookies
      if (result.accessToken && result.refreshToken) {
        this.setAuthCookies(reply, result.accessToken, result.refreshToken);
      }

      // Return response (includes tokens for backward compatibility)
      return reply.send(result);
    } catch (error) {
      // Clear cookies on refresh failure
      this.clearAuthCookies(reply);
      return reply.code(401).send({ error: error.message });
    }
  }

  async logout(request, reply) {
    try {
      await this.authService.logoutUser(request.user.tokenId);

      // Clear httpOnly cookies
      this.clearAuthCookies(reply);

      return reply.send({ message: 'Logged out successfully' });
    } catch (error) {
      // Still clear cookies even if logout fails
      this.clearAuthCookies(reply);
      // Log the error but don't expose details
      request.log.error('Logout error:', error);
      return reply.code(500).send({ error: 'An error occurred during logout' });
    }
  }

  async logoutAll(request, reply) {
    try {
      await this.authService.logoutAllDevices(request.user.id);

      // Clear httpOnly cookies
      this.clearAuthCookies(reply);

      return reply.send({ message: 'Logged out from all devices successfully' });
    } catch (error) {
      this.clearAuthCookies(reply);
      // Log the error but don't expose details
      request.log.error('LogoutAll error:', error);
      return reply.code(500).send({ error: 'An error occurred during logout' });
    }
  }

  // Verify email is available
  async isEmailAvailable(request, reply) {
    try {
      const { email } = request.query;
      if (!email) {
        return reply.code(400).send({ error: 'Email is required' });
      }

      const isAvailable = await this.authService.isEmailAvailable(email);
      return reply.code(200).send({ available: isAvailable });
    } catch (error) {
      request.log.error('Email availability check error:', error);
      return reply.code(500).send({ error: 'An error occurred while checking email availability' });
    }
  }

  // Email verification methods
  async sendEmailVerification(request, reply) {
    try {
      const userId = request.user.id;
      const { email } = request.body;

      // Use provided email or user's current email
      const targetEmail = email || request.user.email;

      await this.authService.sendEmailVerification(userId, targetEmail);
      reply.code(200).send({
        message: 'Verification email sent successfully',
        email: targetEmail
      });
    } catch (error) {
      const statusCode = error.message.includes('already verified') ? 400 : 500;
      reply.code(statusCode).send({ error: error.message });
    }
  }

  async confirmEmailVerification(request, reply) {
    try {
      const { token } = request.body;
      const result = await this.authService.confirmEmailVerification(token);

      reply.code(200).send({
        message: 'Email verified successfully',
        user: {
          id: result.id,
          email: result.email,
          emailVerified: result.email_verified
        }
      });
    } catch (error) {
      const statusCode = error.message.includes('Invalid') || error.message.includes('expired') ? 400 : 404;
      reply.code(statusCode).send({ error: error.message });
    }
  }

  async resendEmailVerification(request, reply) {
    try {
      const userId = request.user.id;
      const userEmail = request.user.email;

      // Check if already verified
      if (request.user.email_verified) {
        return reply.code(200).send({ error: 'Email is already verified' });
      }

      await this.authService.sendEmailVerification(userId, userEmail);
      reply.code(200).send({ message: 'Verification email sent successfully' });
    } catch (error) {
      const statusCode = error.message.includes('rate limit') ? 429 : 500;
      reply.code(statusCode).send({ error: error.message });
    }
  }

  // Password reset methods
  async forgotPassword(request, reply) {
    try {
      const { email } = request.body;
      await this.authService.sendPasswordResetEmail(email);

      // Always return success to prevent email enumeration
      reply.code(200).send({
        message: 'If an account with that email exists, a password reset link has been sent'
      });
    } catch (error) {
      // Log error but don't expose it to prevent email enumeration
      console.error('Password reset error:', error);
      reply.code(200).send({
        message: 'If an account with that email exists, a password reset link has been sent'
      });
    }
  }

  async resetPassword(request, reply) {
    try {
      const { token, password } = request.body;
      await this.authService.resetPassword(token, password);

      reply.code(200).send({
        message: 'Password has been reset successfully'
      });
    } catch (error) {
      const statusCode = error.message.includes('Invalid') || error.message.includes('expired') ? 400 : 404;
      reply.code(statusCode).send({ error: error.message });
    }
  }
}
