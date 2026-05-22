import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  Bell,
  LogOut
} from 'lucide-react';

import { NavLink, useNavigate } from 'react-router-dom';

function Sidebar() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const items = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'Estudiantes', icon: Users, path: '/students' },
    { label: 'Cursos', icon: BookOpen, path: '/courses' },
    { label: 'Docentes', icon: GraduationCap, path: '/teachers' },
    { label: 'Comunicados', icon: Bell, path: '/announcements' }
  ];

  return (
    <aside className="hidden lg:flex w-64 min-h-screen bg-white border-r border-slate-200 flex-col fixed left-0 top-0">
      <div className="px-5 py-4">
        <h1 className="text-lg font-bold text-blue-950 leading-tight">
          Augusto B. Leguía
        </h1>
        <p className="text-xs text-slate-500">
          Director Dashboard
        </p>
      </div>

      <div className="px-4 py-3">
        <div className="flex items-center gap-3 bg-blue-50 rounded-xl p-3">
          <div className="w-10 h-10 rounded-full bg-blue-800 text-white flex items-center justify-center font-bold">
            {user?.nombres?.charAt(0) || 'D'}
          </div>

          <div>
            <p className="text-sm font-bold text-slate-900">
              {user?.nombres || 'Director'}
            </p>
            <p className="text-xs text-slate-500">
              {user?.rol || 'Director'}
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-3 space-y-1">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition border-l-4 ${
                  isActive
                    ? 'bg-blue-100 text-blue-900 border-blue-900'
                    : 'text-slate-600 border-transparent hover:bg-slate-100'
                }`
              }
            >
              <Icon size={18} />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-200">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold text-slate-600 hover:text-red-600 hover:bg-red-50 w-full"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;