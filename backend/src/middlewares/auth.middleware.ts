import { Response, NextFunction } from 'express';
import { verifyToken } from '../services/auth.service.js';
import { AuthenticatedRequest } from '../types/index.js';

// Middleware de autenticacao
export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token nao fornecido' });
  }

  const token = authHeader.substring(7);

  try {
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Token invalido' });
  }
}

// Middleware de autorizacao por permissao
// Uso: requirePermission('projects.create') ou requirePermission('projects.create', 'projects.update')
export function requirePermission(...requiredPermissions: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Nao autenticado' });
    }

    const userPermissions = req.user.permissions || [];

    // Verifica se o usuario tem pelo menos uma das permissoes requeridas
    const hasPermission = requiredPermissions.some(perm => userPermissions.includes(perm));

    if (!hasPermission) {
      return res.status(403).json({
        error: 'Acesso negado. Permissao insuficiente.',
        required: requiredPermissions,
      });
    }

    next();
  };
}

// Middleware que verifica se o usuario tem TODAS as permissoes requeridas
export function requireAllPermissions(...requiredPermissions: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Nao autenticado' });
    }

    const userPermissions = req.user.permissions || [];

    // Verifica se o usuario tem TODAS as permissoes requeridas
    const hasAllPermissions = requiredPermissions.every(perm => userPermissions.includes(perm));

    if (!hasAllPermissions) {
      return res.status(403).json({
        error: 'Acesso negado. Permissoes insuficientes.',
        required: requiredPermissions,
      });
    }

    next();
  };
}

// Helper para verificar permissao no codigo (nao middleware)
export function hasPermission(user: AuthenticatedRequest['user'], permission: string): boolean {
  if (!user) return false;
  return user.permissions?.includes(permission) ?? false;
}

// Helper para verificar se tem alguma permissao de uma lista
export function hasAnyPermission(user: AuthenticatedRequest['user'], permissions: string[]): boolean {
  if (!user) return false;
  return permissions.some(perm => user.permissions?.includes(perm));
}
