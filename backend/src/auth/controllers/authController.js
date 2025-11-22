import { AuthService } from '../services/authService.js';
import { TokenService } from '../services/tokenService.js';
import { AppError } from '../../errors/AppError.js';

export class AuthController {
  constructor(db) {
    this.authService = new AuthService(db);
    this.tokenService = new TokenService(db);
  }

  async register(request, reply) {
    try {
      const { email, password } = request.body;

      if (!email || !password) {
        return reply.code(400).send({ error: 'Email and password required' });
      }

      const result = await this.authService.registerUser(email, password);
      return reply.send(result);
    } catch (error) {
      if (error instanceof AppError) {
        return reply.code(error.statusCode).send({ error: error.message });
      }
      throw error;
    }
  }

  async login(request, reply) {
    try {
      const { email, password } = request.body;

      if (!email || !password) {
        return reply.code(400).send({ error: 'Email and password required' });
      }

      const result = await this.authService.loginUser(email, password);
      return reply.send(result);
    } catch (error) {
      if (error instanceof AppError) {
        return reply.code(error.statusCode).send({ error: error.message });
      }
      throw error;
    }
  }

  async refresh(request, reply) {
    try {
      const { refreshToken } = request.body;
      
      if (!refreshToken) {
        return reply.code(400).send({ error: 'Refresh token required' });
      }

      const result = await this.authService.refreshTokens(refreshToken);
      return reply.send(result);
    } catch (error) {
      return reply.code(401).send({ error: error.message });
    }
  }

  async logout(request, reply) {
    try {
      await this.authService.logoutUser(request.user.tokenId);
      return reply.send({ message: 'Logged out successfully' });
    } catch (error) {
      throw error;
    }
  }

  async logoutAll(request, reply) {
    try {
      await this.authService.logoutAllDevices(request.user.id);
      return reply.send({ message: 'Logged out from all devices successfully' });
    } catch (error) {
      throw error;
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
      throw error;
    }
  }

  // Email verification methods
  async sendEmailVerification(request, reply) {
    try {
      const userId = request.user.id;
      const { email } = request.body;
      
      // Use provided email or user's current email
      const targetEmail = email || request.user.email;
      
      const result = await this.authService.sendEmailVerification(userId, targetEmail);
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