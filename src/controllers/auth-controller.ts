import { Request, Response } from 'express';
import { AuthService } from '../services/auth-service';
import { AuthRequest } from '../middleware/auth';

const authService = new AuthService();

export class AuthController {
  async register(req: Request, res: Response): Promise<Response> {
    try {
      const apiKey = req.headers['x-api-key'] as string;
      const result = await authService.register(req.body, apiKey);
      return res.json(result);
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  }

  async login(req: Request, res: Response): Promise<Response> {
    try {
      const apiKey = req.headers['x-api-key'] as string;
      const result = await authService.login(req.body, apiKey);
      return res.json(result);
    } catch (error: any) {
      return res.status(401).json({ message: error.message });
    }
  }

  async refreshToken(req: Request, res: Response): Promise<Response> {
    try {
      const { refreshToken } = req.body;
      const result = await authService.refreshToken(refreshToken);
      return res.json(result);
    } catch (error: any) {
      return res.status(401).json({ message: error.message });
    }
  }

  async logout(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const refreshToken = req.body.refreshToken;
      if (!req.user) {
        return res.status(401).json({ message: 'Not authenticated' });
      }
      await authService.logout(req.user.userId, refreshToken);
      return res.json({ message: 'Logged out successfully' });
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  }

  async verify(req: AuthRequest, res: Response): Promise<Response> {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Not authenticated' });
      }
      const projectId = req.headers['x-project-id'] as string;
      const user = await authService.verifyToken(req.user.userId, projectId);
      return res.json(user);
    } catch (error: any) {
      return res.status(401).json({ message: error.message });
    }
  }

  async requestPasswordReset(req: Request, res: Response): Promise<Response> {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: 'Email is required' });
      }

      await authService.requestPasswordReset(email);
      
      // Always return success to prevent email enumeration
      return res.json({ 
        message: 'If an account exists with this email, you will receive a password reset link.' 
      });
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  }

  async resetPassword(req: Request, res: Response): Promise<Response> {
    try {
      const { token, newPassword } = req.body;
      
      if (!token || !newPassword) {
        return res.status(400).json({ message: 'Token and new password are required' });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters' });
      }

      await authService.resetPassword(token, newPassword);
      
      return res.json({ message: 'Password reset successfully' });
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  }

  async createProject(req: Request, res: Response): Promise<Response> {
    try {
      const { name, description } = req.body;
      const project = await authService.createProject(name, description);
      return res.json({
        id: project.id,
        name: project.name,
        apiKey: project.apiKey,
        description: project.description
      });
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  }
}