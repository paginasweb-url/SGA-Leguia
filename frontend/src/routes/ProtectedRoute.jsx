import { Navigate, useLocation } from 'react-router-dom';
import { getStoredUser, getToken } from '../utils/storage';

function ProtectedRoute({ children }) {
  const location = useLocation();
  const token = getToken();
  const user = getStoredUser();

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (
    user.must_change_password &&
    location.pathname !== '/cambiar-password'
  ) {
    return <Navigate to="/cambiar-password" replace />;
  }

  return children;
}

export default ProtectedRoute;