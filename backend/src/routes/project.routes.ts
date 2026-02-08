import { Router } from 'express';
import {
  createProjectController,
  getProjectsController,
  getProjectController,
  updateProjectController,
  deleteProjectController,
  addMemberController,
  removeMemberController,
  addCommentController,
} from '../controllers/project.controller.js';
import { getStagesController } from '../controllers/stage.controller.js';
import { moveStageController } from '../controllers/stage.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { Role } from '../types/index.js';

const router = Router();

// Todas as rotas exigem autenticação
router.use(authenticate);

// CRUD de Projetos
router.get('/', getProjectsController);
router.get('/:id', getProjectController);
router.post('/', authorize(Role.ADMIN, Role.MANAGER), createProjectController);
router.put('/:id', authorize(Role.ADMIN, Role.MANAGER), updateProjectController);
router.delete('/:id', authorize(Role.ADMIN), deleteProjectController);

// Membros do Projeto
router.post('/:id/members', authorize(Role.ADMIN, Role.MANAGER), addMemberController);
router.delete('/:id/members/:userId', authorize(Role.ADMIN, Role.MANAGER), removeMemberController);

// Etapas do Projeto
router.get('/:id/stages', getStagesController);
router.post('/:id/move', authorize(Role.ADMIN, Role.MANAGER), moveStageController);

// Comentários
router.post('/:id/comments', addCommentController);

export default router;
