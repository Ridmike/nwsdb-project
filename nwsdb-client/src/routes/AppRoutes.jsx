import { Navigate, Route, Routes } from 'react-router-dom';
import { LoginPage } from '../features/auth/LoginPage';
import { AppLayout } from '../layouts/AppLayout';
import { ApprovalsPage } from '../pages/ApprovalsPage';
import { CategoriesPage } from '../pages/CategoriesPage';
import { DashboardPage } from '../pages/DashboardPage';
import { DepartmentsPage } from '../pages/DepartmentsPage';
import { FileDetailPage } from '../pages/FileDetailPage';
import { FilesPage } from '../pages/FilesPage';
import { ReportsPage } from '../pages/ReportsPage';
import { UsersPage } from '../pages/UsersPage';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleRoute } from './RoleRoute';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="files" element={<FilesPage />} />
        <Route path="files/:fileId" element={<FileDetailPage />} />
        <Route path="approvals" element={<ApprovalsPage />} />
        <Route
          path="reports"
          element={
            <RoleRoute roles={['admin', 'manager', 'rsc']}>
              <ReportsPage />
            </RoleRoute>
          }
        />
        <Route
          path="admin/users"
          element={
            <RoleRoute roles={['admin']}>
              <UsersPage />
            </RoleRoute>
          }
        />
        <Route
          path="admin/departments"
          element={
            <RoleRoute roles={['admin']}>
              <DepartmentsPage />
            </RoleRoute>
          }
        />
        <Route
          path="admin/categories"
          element={
            <RoleRoute roles={['admin']}>
              <CategoriesPage />
            </RoleRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRoutes;
