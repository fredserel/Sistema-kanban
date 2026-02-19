import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  requiredPermissions?: string[];
  requireAll?: boolean; // Se true, requer todas as permissoes. Se false, requer pelo menos uma.
}

export function ProtectedRoute({ requiredPermissions, requireAll = false }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, hasPermission, hasAllPermissions } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredPermissions && requiredPermissions.length > 0) {
    const hasAccess = requireAll
      ? hasAllPermissions(...requiredPermissions)
      : hasPermission(...requiredPermissions);

    if (!hasAccess) {
      return <Navigate to="/" replace />;
    }
  }

  return <Outlet />;
}
