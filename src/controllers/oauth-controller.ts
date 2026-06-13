import { Request, Response } from 'express';
import { AuthService } from '../services/auth-service';
import { generateTokens } from '../utils/jwt';
import { config } from '../config';

const authService = new AuthService();

export class OAuthController {
  async googleCallback(req: Request, res: Response) {
    try {
      const user = await authService.findOrCreateOAuthUser(req.user, 'google');
      
      const { token, refreshToken } = generateTokens({
        userId: user.id,
        email: user.email,
        provider: 'google'
      });

      const redirectUrl = new URL(`${config.clientUrl}/oauth/callback`);
      redirectUrl.searchParams.append('token', token);
      redirectUrl.searchParams.append('refreshToken', refreshToken);
      
      res.redirect(redirectUrl.toString());
    } catch (error) {
      res.redirect(`${config.clientUrl}/login?error=oauth_failed`);
    }
  }

  async githubCallback(req: Request, res: Response) {
    try {
      const user = await authService.findOrCreateOAuthUser(req.user, 'github');
      
      const { token, refreshToken } = generateTokens({
        userId: user.id,
        email: user.email,
        provider: 'github'
      });

      const redirectUrl = new URL(`${config.clientUrl}/oauth/callback`);
      redirectUrl.searchParams.append('token', token);
      redirectUrl.searchParams.append('refreshToken', refreshToken);
      
      res.redirect(redirectUrl.toString());
    } catch (error) {
      res.redirect(`${config.clientUrl}/login?error=oauth_failed`);
    }
  }

  async microsoftCallback(req: Request, res: Response) {
    try {
      const user = await authService.findOrCreateOAuthUser(req.user, 'microsoft');
      
      const { token, refreshToken } = generateTokens({
        userId: user.id,
        email: user.email,
        provider: 'microsoft'
      });

      const redirectUrl = new URL(`${config.clientUrl}/oauth/callback`);
      redirectUrl.searchParams.append('token', token);
      redirectUrl.searchParams.append('refreshToken', refreshToken);
      
      res.redirect(redirectUrl.toString());
    } catch (error) {
      res.redirect(`${config.clientUrl}/login?error=oauth_failed`);
    }
  }
}