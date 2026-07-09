import { Request, Response } from 'express';
import { AuthService } from '../services/auth-service.js';
import { AuthRequest } from '../middleware/auth.js';
import { PrismaClient } from '@prisma/client';
import { comparePassword } from '../utils/password.js';

const prisma = new PrismaClient();

const authService = new AuthService();

export class AuthController {
  async register(req: Request, res: Response): Promise<Response> {
    try {
      const apiKey = req.headers['x-api-key'] as string;
      console.log('=== AUTH CONTROLLER REGISTER ===');
      console.log('Email:', req.body.email);
      console.log('ProjectId:', req.body.projectId);
      console.log('API Key:', apiKey);
      
      if (!req.body.projectId) {
        return res.status(400).json({
          success: false,
          message: 'Project ID is required'
        });
      }
      
      const result = await authService.register(req.body, apiKey);
      return res.json(result);
    } catch (error: any) {
      console.error('Register error:', error.message);
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async login(req: Request, res: Response): Promise<Response> {
    try {
      const apiKey = req.headers['x-api-key'] as string;
      console.log('=== AUTH CONTROLLER LOGIN ===');
      console.log('Email:', req.body.email);
      console.log('ProjectId:', req.body.projectId);
      console.log('API Key:', apiKey);
      
      if (!req.body.projectId) {
        return res.status(400).json({
          success: false,
          message: 'Project ID is required'
        });
      }
      
      const result = await authService.login(req.body, apiKey);
      return res.json(result);
    } catch (error: any) {
      console.error('Login error:', error.message);
      return res.status(401).json({
        success: false,
        message: error.message
      });
    }
  }

  async refreshToken(req: Request, res: Response): Promise<Response> {
    try {
      const { refreshToken } = req.body;
      const result = await authService.refreshToken(refreshToken);
      return res.json(result);
    } catch (error: any) {
      console.error('Refresh token error:', error.message);
      return res.status(401).json({
        success: false,
        message: error.message
      });
    }
  }

  async logout(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const refreshToken = req.body.refreshToken;
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Not authenticated'
        });
      }
      await authService.logout(req.user.userId, refreshToken);
      return res.json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error: any) {
      console.error('Logout error:', error.message);
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async verify(req: AuthRequest, res: Response): Promise<Response> {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Not authenticated'
        });
      }
      const projectId = req.headers['x-project-id'] as string;
      const user = await authService.verifyToken(req.user.userId, projectId);
      return res.json({
        success: true,
        user
      });
    } catch (error: any) {
      console.error('Verify error:', error.message);
      return res.status(401).json({
        success: false,
        message: error.message
      });
    }
  }

  async requestPasswordReset(req: Request, res: Response): Promise<Response> {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email is required'
        });
      }

      await authService.requestPasswordReset(email);
      
      return res.json({
        success: true,
        message: 'If an account exists with this email, you will receive a password reset link.'
      });
    } catch (error: any) {
      console.error('Password reset request error:', error.message);
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async resetPassword(req: Request, res: Response): Promise<Response> {
    try {
      const { token, newPassword } = req.body;
      
      if (!token || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Token and new password are required'
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters'
        });
      }

      await authService.resetPassword(token, newPassword);
      
      return res.json({
        success: true,
        message: 'Password reset successfully'
      });
    } catch (error: any) {
      console.error('Reset password error:', error.message);
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async updateEmail(req: AuthRequest, res: Response): Promise<Response> {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    const { newEmail, password } = req.body;
    
    if (!newEmail || !password) {
      return res.status(400).json({
        success: false,
        message: 'New email and password are required'
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId }
    });

    if (!user || !user.password) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const isValid = await comparePassword(password, user.password);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password'
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: newEmail }
    });

    if (existingUser && existingUser.id !== req.user.userId) {
      return res.status(400).json({
        success: false,
        message: 'Email is already in use'
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.userId },
      data: { email: newEmail }
    });

    const { password: _, refreshToken: __, resetToken: ___, resetTokenExpiry: ____, ...userWithoutSensitive } = updatedUser;

    return res.json({
      success: true,
      message: 'Email updated successfully',
      user: userWithoutSensitive
    });
  } catch (error: any) {
    console.error('Update email error:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

  async createProject(req: Request, res: Response): Promise<Response> {
    try {
      const { name, description } = req.body;
      
      if (!name) {
        return res.status(400).json({
          success: false,
          message: 'Project name is required'
        });
      }

      const project = await authService.createProject(name, description);
      
      console.log('Project created:', { id: project.id, name: project.name, apiKey: project.apiKey });
      
      return res.json({
        success: true,
        data: {
          id: project.id,
          name: project.name,
          apiKey: project.apiKey,
          description: project.description
        }
      });
    } catch (error: any) {
      console.error('Create project error:', error.message);
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
}