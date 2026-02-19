import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import * as authService from '../services/auth.service';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasPermission: (...permissions: string[]) => boolean;
  hasAllPermissions: (...permissions: string[]) => boolean;
  hasRole: (roleName: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
      authService
        .getMe()
        .then((userData) => {
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
        })
        .catch(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authService.login(email, password);
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
    setUser(response.user);
  };

  const logout = () => {
    authService.logout().catch(console.error);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  // Verifica se o usuario tem pelo menos uma das permissoes
  const hasPermission = (...permissions: string[]) => {
    if (!user || !user.permissions) return false;
    return permissions.some(perm => user.permissions?.includes(perm));
  };

  // Verifica se o usuario tem todas as permissoes
  const hasAllPermissions = (...permissions: string[]) => {
    if (!user || !user.permissions) return false;
    return permissions.every(perm => user.permissions?.includes(perm));
  };

  // Verifica se o usuario tem uma role especifica
  const hasRole = (roleName: string) => {
    if (!user || !user.roles) return false;
    return user.roles.some(role => role.name === roleName);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        hasPermission,
        hasAllPermissions,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
