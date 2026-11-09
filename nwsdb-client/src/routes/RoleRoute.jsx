import { Navigate } from 'react-router-dom';
import { LoadingScreen } from '../components/LoadingScreen/LoadingScreen';
import { useAuth } from '../hooks/useAuth';

export function RoleRoute({ roles = [], children }) {
  const { role, loading } = useAuth();

  if (loading) {
    return <LoadingScreen label="Checking your access..." />;
  }

  if (!roles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default RoleRoute;
