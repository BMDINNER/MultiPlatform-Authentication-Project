import { Router } from 'express';
import { AuthController } from '../controllers/auth-controller.js';
import { authenticate } from '../middleware/auth.js';
import { validateProjectApiKey } from '../middleware/project-auth.js';
import { asyncHandler } from '../utils/async-handler.js';

const router = Router();
const authController = new AuthController();

router.post('/register', asyncHandler(authController.register.bind(authController)));
router.post('/login', asyncHandler(authController.login.bind(authController)));
router.post('/refresh', asyncHandler(authController.refreshToken.bind(authController)));

router.post('/logout', authenticate, asyncHandler(authController.logout.bind(authController)));
router.get('/verify', authenticate, asyncHandler(authController.verify.bind(authController)));

router.put('/email', authenticate, asyncHandler(authController.updateEmail.bind(authController)));
router.put('/change-password', authenticate, asyncHandler(authController.changePassword.bind(authController)));

router.post('/projects', authenticate, asyncHandler(authController.createProject.bind(authController)));

router.post('/project/register', validateProjectApiKey, asyncHandler(authController.register.bind(authController)));
router.post('/project/login', validateProjectApiKey, asyncHandler(authController.login.bind(authController)));

export default router;