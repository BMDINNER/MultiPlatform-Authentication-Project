import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { TokenPayload, RefreshTokenPayload } from '../types/index.js';

export const generateTokens = (payload: Omit<TokenPayload, 'projectId'>) => {
  const token = jwt.sign(
    { 
      userId: payload.userId, 
      email: payload.email 
    },
    config.jwtSecret, 
    { expiresIn: config.jwtExpiresIn }
  );
  
  const refreshToken = jwt.sign(
    { userId: payload.userId, tokenId: generateTokenId() },
    config.jwtRefreshSecret,
    { expiresIn: config.jwtRefreshExpiresIn }
  );
  
  return { token, refreshToken };
};

export const verifyToken = (token: string): TokenPayload => {
  return jwt.verify(token, config.jwtSecret) as TokenPayload;
};

export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  return jwt.verify(token, config.jwtRefreshSecret) as RefreshTokenPayload;
};

const generateTokenId = (): string => {
  return Math.random().toString(36).substring(2, 15) + 
  Math.random().toString(36).substring(2, 15);
};

export const blacklistToken = async (token: string): Promise<void> => {
  try {
    const decoded = jwt.decode(token) as any;
    if (!decoded || !decoded.exp) {
      throw new Error('Invalid token');
    }

    const expiresIn = (decoded.exp * 1000) - Date.now();
    
    if (expiresIn > 0) {
      const tokenBlacklist = global.tokenBlacklist || new Map();
      tokenBlacklist.set(token, true);
      
      setTimeout(() => {
        tokenBlacklist.delete(token);
      }, expiresIn);
      
      global.tokenBlacklist = tokenBlacklist;
    }
  } catch (error) {
    console.error('Failed to blacklist token:', error);
  }
};

export const isTokenBlacklisted = (token: string): boolean => {
  const tokenBlacklist = global.tokenBlacklist || new Map();
  return tokenBlacklist.has(token);
};

export const blacklistUserTokens = async (userId: string): Promise<void> => {
  const userBlacklist = global.userTokenBlacklist || new Map();
  const newTokenId = generateTokenId();
  userBlacklist.set(userId, newTokenId);
  global.userTokenBlacklist = userBlacklist;
};