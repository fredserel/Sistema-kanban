import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

interface PermissionsMetadata {
  permissions: string[];
  requireAll: boolean;
}

interface UserWithPermissions {
  isSuperAdmin: boolean;
  permissions: string[];
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
}

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Get permissions metadata
    const metadata = this.reflector.getAllAndOverride<PermissionsMetadata>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no permissions defined, allow access
    if (!metadata || !metadata.permissions.length) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest() as { user: UserWithPermissions };

    if (!user) {
      throw new ForbiddenException('Usuário não autenticado');
    }

    // Super admin has full access
    if (user.isSuperAdmin) {
      return true;
    }

    const { permissions, requireAll } = metadata;

    // Check permissions
    const hasPermission = requireAll
      ? user.hasAllPermissions(permissions)
      : user.hasAnyPermission(permissions);

    if (!hasPermission) {
      throw new ForbiddenException(
        `Permissão negada. Requer: ${permissions.join(requireAll ? ' E ' : ' OU ')}`,
      );
    }

    return true;
  }
}
