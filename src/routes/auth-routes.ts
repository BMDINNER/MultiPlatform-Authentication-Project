import { Router } from 'express';
import { AuthController } from '../controllers/auth-controller.js';
import { authenticate } from '../middleware/auth.js';
import { validateProjectApiKey } from '../middleware/project-auth.js';
import rateLimit from 'express-rate-limit';
import { asyncHandler } from '../utils/async-handler.js';

const router = Router();
const authController = new AuthController();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts, please try again later'
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 200,
  message: 'Too many registration attempts, please try again later'
});

const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 300,
  message: 'Too many password reset attempts, please try again later'
});

router.post('/register', registerLimiter, asyncHandler(authController.register.bind(authController)));
router.post('/login', loginLimiter, asyncHandler(authController.login.bind(authController)));
router.post('/refresh', asyncHandler(authController.refreshToken.bind(authController)));
router.post('/forgot-password', passwordResetLimiter, asyncHandler(authController.requestPasswordReset.bind(authController)));
router.post('/reset-password', passwordResetLimiter, asyncHandler(authController.resetPassword.bind(authController)));

router.post('/logout', authenticate, asyncHandler(authController.logout.bind(authController)));
router.get('/verify', authenticate, asyncHandler(authController.verify.bind(authController)));

router.put('/email', authenticate, asyncHandler(authController.updateEmail.bind(authController)));
router.put('/change-password', authenticate, asyncHandler(authController.changePassword.bind(authController)));

router.post('/projects', authenticate, asyncHandler(authController.createProject.bind(authController)));

router.post('/project/register', validateProjectApiKey, asyncHandler(authController.register.bind(authController)));
router.post('/project/login', validateProjectApiKey, asyncHandler(authController.login.bind(authController)));

export default router;