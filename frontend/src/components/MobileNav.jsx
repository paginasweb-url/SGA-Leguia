import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  Bell
} from 'lucide-react';

import { NavLink } from 'react-router-dom';

function MobileNav() {
  const items = [
    { label: 'Inicio', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'Estudiantes', icon: Users, path: '/students' },
    { label: 'Docentes', icon: GraduationCap, path: '/teachers' },
    { label: 'Cursos', icon: BookOpen, path: '/courses' },
    { label: 'Avisos', icon: Bell, path: '/announcements' }
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50">
      <div className="grid grid-cols-5">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-2 text-[11px] font-medium ${
                  isActive ? 'text-blue-700' : 'text-slate-500'
                }`
              }
            >
              <Icon size={20} />
              <span className="mt-1">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

export default MobileNav;