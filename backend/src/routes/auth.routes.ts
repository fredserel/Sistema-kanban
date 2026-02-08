import { Router } from 'express';
import {
  loginController,
  registerController,
  meController,
  logoutController,
} from '../controllers/auth.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { Role } from '../types/index.js';

const router = Router();

router.post('/login', loginController);
router.post('/register', authenticate, authorize(Role.ADMIN), registerController);
router.get('/me', authenticate, meController);
router.post('/logout', authenticate, logoutController);

export default router;
