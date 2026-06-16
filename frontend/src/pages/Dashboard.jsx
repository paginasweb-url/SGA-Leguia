import { Navigate } from 'react-router-dom';

import { getRole } from '../utils/storage';

import DirectorDashboard from './dashboards/DirectorDashboard';
import AdminDashboard from './dashboards/AdminDashboard';
import RoleOverviewDashboard from './dashboards/RoleOverviewDashboard';

function Dashboard() {
  const role = getRole();

  if (role === 'Director') {
    return <DirectorDashboard />;
  }

  if (role === 'Administrativo') {
    return <AdminDashboard />;
  }

  if (role === 'Docente') {
    return <RoleOverviewDashboard role="Docente" />;
  }

  if (role === 'Auxiliar') {
    return <RoleOverviewDashboard role="Auxiliar" />;
  }

  if (role === 'Estudiante') {
    return <RoleOverviewDashboard role="Estudiante" />;
  }

  if (role === 'Apoderado') {
    return <RoleOverviewDashboard role="Apoderado" />;
  }

  return <Navigate to="/login" replace />;
}

export default Dashboard;