import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Decorator to define required permissions for a route
 *
 * @example
 * // Requires ANY of the permissions
 * @Permissions('users.read', 'users.manage')
 *
 * @example
 * // Requires ALL permissions (use RequireAllPermissions)
 * @RequireAllPermissions('orders.read', 'orders.approve')
 */
export const Permissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, { permissions, requireAll: false });

export const RequireAllPermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, { permissions, requireAll: true });
