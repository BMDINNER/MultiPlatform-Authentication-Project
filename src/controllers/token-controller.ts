import {  Request, Response } from 'express';
import { verifyToken } from '../utils/jwt.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();


export const verifyAccessToken = async (req: Request, res: Response) => {

  try {

    const authHeader = req.headers.authorization;

    if(!authHeader ) {
      return res.status(401).json({
        valid: false,
        error: 'No token provided'
      });
    }

    const parts = authHeader.split(' ');

    if(parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({
        valid: false,
        error: 'Invalid token format'
      });
    }

    const token = parts[1];
    const payload = verifyToken(token);

    res.json({
      valid: true,
      user: {
        userId: payload.userId,
        email: payload.email,
        projectId: payload.projectId
      }
    });
  } catch(error: any){
    res.status(401).json({
      valid: false,
      error: error.message || 'Invalid or expired token'
    });
  }
};


export const revokeToken = async (req: Request, res:Response) => {
  try {
    const { refreshToken } = req.body;

    if(!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token is required'
      });
    }

    const user = await prisma.user.findFirst({
      where: {
        refreshToken: refreshToken
      }
    })


    if(user) {
      await prisma.user.update({
        where: {  id: user.id },
        data: { refreshToken: null} 
      });
    }

    res.json({
      success: true,
      message: 'Token revoked successfully'
    });
  } catch(error: any) {
    console.error('Revoke token error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to revoke token'
    });
  }
};