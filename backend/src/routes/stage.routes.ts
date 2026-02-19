import { Router } from 'express';
import {
  updateStageController,
  completeStageController,
  blockStageController,
  unblockStageController,
} from '../controllers/stage.controller.js';
import { authenticate, requirePermission } from '../middlewares/auth.middleware.js';

const router = Router();

// Todas as rotas exigem autenticacao
router.use(authenticate);

// Operacoes em etapas
router.put('/:id', requirePermission('stages.update'), updateStageController);
router.post('/:id/complete', requirePermission('stages.complete'), completeStageController);
router.post('/:id/block', requirePermission('stages.block'), blockStageController);
router.post('/:id/unblock', requirePermission('stages.block'), unblockStageController);

export default router;
