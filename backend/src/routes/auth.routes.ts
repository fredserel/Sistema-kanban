import { Router } from 'express';
import {
  loginController,
  registerController,
  meController,
  logoutController,
} from '../controllers/auth.controller.js';
import { authenticate, requirePermission } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/login', loginController);
router.post('/register', authenticate, requirePermission('users.create'), registerController);
router.get('/me', authenticate, meController);
router.post('/logout', authenticate, logoutController);

export default router;
