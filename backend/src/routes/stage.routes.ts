import { Router } from 'express';
import {
  updateStageController,
  completeStageController,
  blockStageController,
  unblockStageController,
} from '../controllers/stage.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { Role } from '../types/index.js';

const router = Router();

// Todas as rotas exigem autenticação
router.use(authenticate);

// Operações em etapas
router.put('/:id', authorize(Role.ADMIN, Role.MANAGER), updateStageController);
router.post('/:id/complete', authorize(Role.ADMIN, Role.MANAGER), completeStageController);
router.post('/:id/block', authorize(Role.ADMIN, Role.MANAGER), blockStageController);
router.post('/:id/unblock', authorize(Role.ADMIN, Role.MANAGER), unblockStageController);

export default router;
