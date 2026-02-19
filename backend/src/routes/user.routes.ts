import { Router } from 'express';
import {
  getUsersController,
  getUserController,
  createUserController,
  updateUserController,
  deleteUserController,
  assignRoleController,
  removeRoleController,
} from '../controllers/user.controller.js';
import { authenticate, requirePermission } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate);

// Listar usuarios - requer permissao de leitura
router.get('/', requirePermission('users.read'), getUsersController);
router.get('/:id', requirePermission('users.read'), getUserController);

// Criar usuario - requer permissao de criacao
router.post('/', requirePermission('users.create'), createUserController);

// Atualizar usuario - requer permissao de atualizacao
router.put('/:id', requirePermission('users.update'), updateUserController);

// Excluir usuario - requer permissao de exclusao
router.delete('/:id', requirePermission('users.delete'), deleteUserController);

// Gerenciar roles do usuario - requer permissao de gerenciar roles
router.post('/:id/roles', requirePermission('roles.manage'), assignRoleController);
router.delete('/:id/roles/:roleId', requirePermission('roles.manage'), removeRoleController);

export default router;
