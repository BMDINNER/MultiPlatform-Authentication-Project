import { Router } from 'express';
import { OAuthController } from '../controllers/oauth-controller';
import passport from 'passport';

const router = Router();
const oauthController = new OAuthController();

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', passport.authenticate('google', { session: false }), oauthController.googleCallback);

router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));
router.get('/github/callback', passport.authenticate('github', { session: false }), oauthController.githubCallback);

router.get('/microsoft', passport.authenticate('microsoft', { scope: ['user.read'] }));
router.get('/microsoft/callback', passport.authenticate('microsoft', { session: false }), oauthController.microsoftCallback);

export default router;