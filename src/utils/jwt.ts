import jwt from 'jsonwebtoken';
import { config } from '../config';
import { TokenPayload, RefreshTokenPayload } from '../types';

export const generateTokens = (payload: TokenPayload) => {
  const token = jwt.sign(
    payload, 
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