import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Kanban } from './pages/Kanban';
import { ProjectForm } from './pages/ProjectForm';
import { Users } from './pages/Users';
import { Roles } from './pages/Roles';
import { Trash } from './pages/Trash';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Rotas protegidas - qualquer usuario autenticado */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Kanban />} />
            </Route>
          </Route>

          {/* Rotas que requerem permissao de criar projetos */}
          <Route element={<ProtectedRoute requiredPermissions={['projects.create']} />}>
            <Route element={<Layout />}>
              <Route path="/projects/new" element={<ProjectForm />} />
            </Route>
          </Route>

          {/* Rotas que requerem permissao de visualizar usuarios */}
          <Route element={<ProtectedRoute requiredPermissions={['users.read']} />}>
            <Route element={<Layout />}>
              <Route path="/users" element={<Users />} />
            </Route>
          </Route>

          {/* Rotas que requerem permissao de visualizar perfis */}
          <Route element={<ProtectedRoute requiredPermissions={['roles.read']} />}>
            <Route element={<Layout />}>
              <Route path="/roles" element={<Roles />} />
            </Route>
          </Route>

          {/* Rotas que requerem permissao de visualizar lixeira */}
          <Route element={<ProtectedRoute requiredPermissions={['trash.read']} />}>
            <Route element={<Layout />}>
              <Route path="/trash" element={<Trash />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
