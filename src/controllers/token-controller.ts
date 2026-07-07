import { Request, Response } from 'express';
import { verifyToken, isTokenBlacklisted, blacklistToken, blacklistUserTokens } from '../utils/jwt.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const verifyAccessToken = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        valid: false,
        error: 'No token provided'
      });
    }

    const parts = authHeader.split(' ');

    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({
        valid: false,
        error: 'Invalid token format'
      });
    }

    const token = parts[1];
    
    if (isTokenBlacklisted(token)) {
      return res.status(401).json({
        valid: false,
        error: 'Token has been revoked'
      });
    }
    
    const payload = verifyToken(token);

    const user = await prisma.user.findUnique({
      where: { id: payload.userId }
    });

    if (!user) {
      return res.status(401).json({
        valid: false,
        error: 'User not found'
      });
    }

    res.json({
      valid: true,
      user: {
        userId: payload.userId,
        email: payload.email,
        username: user.username || user.email.split('@')[0],
        projectId: payload.projectId
      }
    });
  } catch (error: any) {
    res.status(401).json({
      valid: false,
      error: error.message || 'Invalid or expired token'
    });
  }
};

export const revokeToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token is required'
      });
    }

    const user = await prisma.user.findFirst({
      where: {
        refreshToken: refreshToken
      }
    });

    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: null }
      });
      
      await blacklistUserTokens(user.id);
    }

    res.json({
      success: true,
      message: 'Token revoked successfully'
    });
  } catch (error: any) {
    console.error('Revoke token error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to revoke token'
    });
  }
};

export const blacklistAccessToken = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    const parts = authHeader.split(' ');
    
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token format'
      });
    }

    const token = parts[1];
    
    await blacklistToken(token);

    res.json({
      success: true,
      message: 'Token blacklisted successfully'
    });
  } catch (error: any) {
    console.error('Blacklist token error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to blacklist token'
    });
  }
};

export const validateSession = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        valid: false,
        error: 'No token provided'
      });
    }

    const parts = authHeader.split(' ');
    
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({
        valid: false,
        error: 'Invalid token format'
      });
    }

    const token = parts[1];
    
    if (isTokenBlacklisted(token)) {
      return res.status(401).json({
        valid: false,
        error: 'Session expired'
      });
    }
    
    const payload = verifyToken(token);

    const user = await prisma.user.findUnique({
      where: { id: payload.userId }
    });

    if (!user) {
      return res.status(401).json({
        valid: false,
        error: 'User not found'
      });
    }

    const sessionId = req.headers['x-session-id'] as string;
    
    if (sessionId) {
      const session = await prisma.session.findUnique({
        where: { id: sessionId }
      });

      if (!session || session.userId !== user.id || session.expires < new Date()) {
        return res.status(401).json({
          valid: false,
          error: 'Invalid session'
        });
      }
    }

    res.json({
      valid: true,
      user: {
        userId: payload.userId,
        email: payload.email,
        username: user.username || user.email.split('@')[0],
        projectId: payload.projectId,
        provider: user.provider,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error: any) {
    res.status(401).json({
      valid: false,
      error: error.message || 'Invalid or expired token'
    });
  }
};