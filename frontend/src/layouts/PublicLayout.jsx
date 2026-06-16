import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import {
  GraduationCap,
  Menu,
  X,
  FileText,
  Search,
  Download,
  LogIn
} from 'lucide-react';

function PublicLayout() {
  const [open, setOpen] = useState(false);

  const navItems = [
    {
      label: 'Solicitar matrícula',
      path: '/matricula/solicitud',
      icon: FileText
    },
    {
      label: 'Seguimiento',
      path: '/matricula/seguimiento',
      icon: Search
    },
    {
      label: 'Formatos',
      path: '/matricula/formatos',
      icon: Download
    }
  ];

  return (
    <div className="min-h-screen bg-[#F7F9FB]">
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 h-16 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-3"
            onClick={() => setOpen(false)}
          >
            <div className="w-11 h-11 rounded-2xl bg-brand-900 text-white flex items-center justify-center shadow-sm">
              <GraduationCap size={24} />
            </div>

            <div>
              <p className="font-extrabold text-brand-900 leading-tight">
                Augusto B. Leguía
              </p>
              <p className="text-xs text-slate-500">
                Sistema de Gestión Académica
              </p>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition ${
                      isActive
                        ? 'bg-brand-50 text-brand-900'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-brand-900'
                    }`
                  }
                >
                  <Icon size={17} />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>

          <div className="hidden lg:flex items-center gap-3">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 bg-brand-900 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-brand-800 transition shadow-sm"
            >
              <LogIn size={17} />
              Iniciar sesión
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="lg:hidden w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center"
            aria-label="Abrir menú"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {open && (
          <div className="lg:hidden border-t border-slate-200 bg-white">
            <nav className="max-w-7xl mx-auto px-4 py-3 space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold ${
                        isActive
                          ? 'bg-brand-50 text-brand-900'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`
                    }
                  >
                    <Icon size={18} />
                    {item.label}
                  </NavLink>
                );
              })}

              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center gap-2 bg-brand-900 text-white px-4 py-3 rounded-xl text-sm font-bold"
              >
                <LogIn size={18} />
                Iniciar sesión
              </Link>
            </nav>
          </div>
        )}
      </header>

      <Outlet />
    </div>
  );
}

export default PublicLayout;