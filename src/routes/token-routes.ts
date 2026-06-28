import {  Router } from 'express';
import { verifyAccessToken, revokeToken } from '../controllers/token-controller.js';

const router = Router();

router.post('/verify', verifyAccessToken);
router.post('/revoke', revokeToken);

export default router;