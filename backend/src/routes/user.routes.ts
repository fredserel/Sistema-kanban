import { Router } from 'express';
import { getUsersController } from '../controllers/user.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate);
router.get('/', getUsersController);

export default router;
