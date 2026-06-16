import { Navigate } from 'react-router-dom';
import { getRole } from '../utils/storage';

function RoleRoute({ allowedRoles = [], children }) {
  const role = getRole();

  if (!allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default RoleRoute;