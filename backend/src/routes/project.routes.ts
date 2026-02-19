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
import { authenticate, requirePermission } from '../middlewares/auth.middleware.js';

const router = Router();

// Todas as rotas exigem autenticacao
router.use(authenticate);

// CRUD de Projetos
router.get('/', requirePermission('projects.read'), getProjectsController);
router.get('/trash', requirePermission('trash.read'), getDeletedProjectsController);
router.get('/:id', requirePermission('projects.read'), getProjectController);
router.post('/', requirePermission('projects.create'), createProjectController);
router.put('/:id', requirePermission('projects.update'), updateProjectController);
router.delete('/:id', requirePermission('projects.delete'), deleteProjectController);
router.post('/:id/restore', requirePermission('trash.restore'), restoreProjectController);
router.delete('/:id/permanent', requirePermission('trash.delete'), permanentDeleteProjectController);

// Membros do Projeto
router.post('/:id/members', requirePermission('projects.update'), addMemberController);
router.delete('/:id/members/:userId', requirePermission('projects.update'), removeMemberController);

// Alterar Responsavel
router.patch('/:id/owner', requirePermission('projects.update'), changeOwnerController);

// Etapas do Projeto
router.get('/:id/stages', requirePermission('stages.read'), getStagesController);
router.post('/:id/move', requirePermission('stages.update'), moveStageController);

// Comentarios - qualquer usuario autenticado com acesso ao projeto pode comentar
router.post('/:id/comments', requirePermission('projects.read'), addCommentController);

export default router;
