import { Router } from 'express';
import { verifyAccessToken, revokeToken, blacklistAccessToken, validateSession } from '../controllers/token-controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/verify', verifyAccessToken);
router.post('/revoke', revokeToken);
router.post('/blacklist', authenticate, blacklistAccessToken);
router.post('/validate-session', validateSession);

export default router;