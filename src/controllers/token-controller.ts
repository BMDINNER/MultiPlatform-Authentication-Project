import { Request, Response } from 'express';
import { verifyToken, isTokenBlacklisted, blacklistToken, blacklistUserTokens } from '../utils/jwt.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const verifyAccessToken = async (req: Request, res: Response) => {
  try {
    console.log('=== AUTH SERVICE: VERIFY ACCESS TOKEN ===');
    
    const authHeader = req.headers.authorization;
    console.log('Auth header present:', !!authHeader);

    if (!authHeader) {
      console.log('No auth header provided');
      return res.status(401).json({
        valid: false,
        error: 'No token provided'
      });
    }

    const parts = authHeader.split(' ');
    console.log('Auth header parts count:', parts.length);

    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      console.log('Invalid token format');
      return res.status(401).json({
        valid: false,
        error: 'Invalid token format'
      });
    }

    const token = parts[1];
    console.log('Token (first 30 chars):', token.substring(0, 30) + '...');
    
    const isBlacklisted = isTokenBlacklisted(token);
    console.log('Is token blacklisted:', isBlacklisted);
    
    if (isBlacklisted) {
      console.log('Token is blacklisted');
      return res.status(401).json({
        valid: false,
        error: 'Token has been revoked'
      });
    }
    
    console.log('Verifying token...');
    const payload = verifyToken(token);
    console.log('Token payload:', JSON.stringify(payload, null, 2));
    console.log('User ID from token:', payload.userId);

    console.log('Fetching user from database...');
    const user = await prisma.user.findUnique({
      where: { id: payload.userId }
    });

    if (!user) {
      console.log('User not found in database');
      return res.status(401).json({
        valid: false,
        error: 'User not found'
      });
    }

    console.log('User found:', {
      id: user.id,
      email: user.email,
      username: user.username,
      provider: user.provider
    });

    const responseData = {
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
    };

    console.log('Sending response:', JSON.stringify(responseData, null, 2));
    console.log('=== VERIFY ACCESS TOKEN COMPLETED ===');
    
    res.json(responseData);
  } catch (error: any) {
    console.error('=== VERIFY ACCESS TOKEN ERROR ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    res.status(401).json({
      valid: false,
      error: error.message || 'Invalid or expired token'
    });
  }
};

export const revokeToken = async (req: Request, res: Response) => {
  try {
    console.log('=== AUTH SERVICE: REVOKE TOKEN ===');
    
    const { refreshToken } = req.body;
    console.log('Refresh token provided:', !!refreshToken);

    if (!refreshToken) {
      console.log('No refresh token provided');
      return res.status(400).json({
        success: false,
        error: 'Refresh token is required'
      });
    }

    console.log('Looking for user with refresh token...');
    const user = await prisma.user.findFirst({
      where: {
        refreshToken: refreshToken
      }
    });

    if (user) {
      console.log('User found, clearing refresh token...');
      await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: null }
      });
      
      console.log('Blacklisting user tokens...');
      await blacklistUserTokens(user.id);
      console.log('User tokens blacklisted');
    } else {
      console.log('No user found with this refresh token');
    }

    console.log('=== REVOKE TOKEN COMPLETED ===');
    
    res.json({
      success: true,
      message: 'Token revoked successfully'
    });
  } catch (error: any) {
    console.error('=== REVOKE TOKEN ERROR ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    res.status(500).json({
      success: false,
      error: 'Failed to revoke token'
    });
  }
};

export const blacklistAccessToken = async (req: Request, res: Response) => {
  try {
    console.log('=== AUTH SERVICE: BLACKLIST ACCESS TOKEN ===');
    
    const authHeader = req.headers.authorization;
    console.log('Auth header present:', !!authHeader);
    
    if (!authHeader) {
      console.log('No auth header provided');
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    const parts = authHeader.split(' ');
    console.log('Auth header parts count:', parts.length);
    
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      console.log('Invalid token format');
      return res.status(401).json({
        success: false,
        error: 'Invalid token format'
      });
    }

    const token = parts[1];
    console.log('Token (first 30 chars):', token.substring(0, 30) + '...');
    
    console.log('Blacklisting token...');
    await blacklistToken(token);
    console.log('Token blacklisted successfully');

    console.log('=== BLACKLIST ACCESS TOKEN COMPLETED ===');
    
    res.json({
      success: true,
      message: 'Token blacklisted successfully'
    });
  } catch (error: any) {
    console.error('=== BLACKLIST ACCESS TOKEN ERROR ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    res.status(500).json({
      success: false,
      error: 'Failed to blacklist token'
    });
  }
};

export const validateSession = async (req: Request, res: Response) => {
  try {
    console.log('=== AUTH SERVICE: VALIDATE SESSION ===');
    
    const authHeader = req.headers.authorization;
    console.log('Auth header present:', !!authHeader);

    if (!authHeader) {
      console.log('No auth header provided');
      return res.status(401).json({
        valid: false,
        error: 'No token provided'
      });
    }

    const parts = authHeader.split(' ');
    console.log('Auth header parts count:', parts.length);
    
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      console.log('Invalid token format');
      return res.status(401).json({
        valid: false,
        error: 'Invalid token format'
      });
    }

    const token = parts[1];
    console.log('Token (first 30 chars):', token.substring(0, 30) + '...');
    
    const isBlacklisted = isTokenBlacklisted(token);
    console.log('Is token blacklisted:', isBlacklisted);
    
    if (isBlacklisted) {
      console.log('Token is blacklisted');
      return res.status(401).json({
        valid: false,
        error: 'Session expired'
      });
    }
    
    console.log('Verifying token...');
    const payload = verifyToken(token);
    console.log('Token payload:', JSON.stringify(payload, null, 2));
    console.log('User ID from token:', payload.userId);

    console.log('Fetching user from database...');
    const user = await prisma.user.findUnique({
      where: { id: payload.userId }
    });

    if (!user) {
      console.log('User not found in database');
      return res.status(401).json({
        valid: false,
        error: 'User not found'
      });
    }

    console.log('User found:', {
      id: user.id,
      email: user.email,
      username: user.username,
      provider: user.provider
    });

    const sessionId = req.headers['x-session-id'] as string;
    console.log('Session ID from header:', sessionId);
    
    if (sessionId) {
      console.log('Fetching session from database...');
      const session = await prisma.session.findUnique({
        where: { id: sessionId }
      });

      if (!session) {
        console.log('Session not found');
        return res.status(401).json({
          valid: false,
          error: 'Invalid session'
        });
      }

      console.log('Session found:', {
        id: session.id,
        userId: session.userId,
        expires: session.expires
      });

      if (session.userId !== user.id) {
        console.log('Session user mismatch');
        return res.status(401).json({
          valid: false,
          error: 'Invalid session'
        });
      }

      if (session.expires < new Date()) {
        console.log('Session expired');
        return res.status(401).json({
          valid: false,
          error: 'Session expired'
        });
      }
    }

    const responseData = {
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
    };

    console.log('Sending response:', JSON.stringify(responseData, null, 2));
    console.log('=== VALIDATE SESSION COMPLETED ===');
    
    res.json(responseData);
  } catch (error: any) {
    console.error('=== VALIDATE SESSION ERROR ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    res.status(401).json({
      valid: false,
      error: error.message || 'Invalid or expired token'
    });
  }
};