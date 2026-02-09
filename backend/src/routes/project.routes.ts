import { Router } from 'express';
import {
  createProjectController,
  getProjectsController,
  getProjectController,
  updateProjectController,
  deleteProjectController,
  getDeletedProjectsController,
  restoreProjectController,
  permanentDeleteProjectController,
  addMemberController,
  removeMemberController,
  addCommentController,
  changeOwnerController,
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
router.get('/trash', authorize(Role.ADMIN), getDeletedProjectsController);
router.get('/:id', getProjectController);
router.post('/', authorize(Role.ADMIN), createProjectController);
router.put('/:id', authorize(Role.ADMIN, Role.MANAGER), updateProjectController);
router.delete('/:id', authorize(Role.ADMIN), deleteProjectController);
router.post('/:id/restore', authorize(Role.ADMIN), restoreProjectController);
router.delete('/:id/permanent', authorize(Role.ADMIN), permanentDeleteProjectController);

// Membros do Projeto
router.post('/:id/members', authorize(Role.ADMIN, Role.MANAGER), addMemberController);
router.delete('/:id/members/:userId', authorize(Role.ADMIN, Role.MANAGER), removeMemberController);

// Alterar Responsável
router.patch('/:id/owner', authorize(Role.ADMIN), changeOwnerController);

// Etapas do Projeto
router.get('/:id/stages', getStagesController);
router.post('/:id/move', authorize(Role.ADMIN, Role.MANAGER), moveStageController);

// Comentários
router.post('/:id/comments', addCommentController);

export default router;
