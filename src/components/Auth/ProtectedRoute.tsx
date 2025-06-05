import { Navigate } from 'react-router-dom';
import { useAuth } from '../../utils/auth';

type ProtectedRouteProps = {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'director';
};

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
} 