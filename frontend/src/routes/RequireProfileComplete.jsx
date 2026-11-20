import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function RequireProfileComplete() {
  const { isProfileComplete } = useAuth();
  if (!isProfileComplete) return <Navigate to="/complete-profile" replace />;
  return <Outlet />;
}