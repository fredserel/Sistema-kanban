import { Router } from 'express';
import {
  getRolesController,
  getRoleController,
  createRoleController,
  updateRoleController,
  deleteRoleController,
  getPermissionsController,
  getPermissionsGroupedController,
} from '../controllers/role.controller.js';
import { authenticate, requirePermission } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate);

// Listar permissoes - qualquer usuario autenticado pode ver
router.get('/permissions', requirePermission('roles.read'), getPermissionsController);
router.get('/permissions/grouped', requirePermission('roles.read'), getPermissionsGroupedController);

// Listar roles - requer permissao de leitura de roles
router.get('/', requirePermission('roles.read'), getRolesController);
router.get('/:id', requirePermission('roles.read'), getRoleController);

// Gerenciar roles - requer permissao de gerenciar roles
router.post('/', requirePermission('roles.manage'), createRoleController);
router.put('/:id', requirePermission('roles.manage'), updateRoleController);
router.delete('/:id', requirePermission('roles.manage'), deleteRoleController);

export default router;
