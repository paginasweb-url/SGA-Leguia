import { LogOut, GraduationCap } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { clearSession, getStoredUser } from '../utils/storage';
import { getMenuByRole } from '../utils/navigation';

function Sidebar({ open = false, onClose }) {
  const navigate = useNavigate();
  const user = getStoredUser();
  const items = getMenuByRole(user?.rol);

  const handleLogout = () => {
    clearSession();

    window.dispatchEvent(new Event('sga-auth-changed'));

    navigate('/login');
  };

  return (
    <>
      {open && (
        <button
          type="button"
          onClick={onClose}
          className="lg:hidden fixed inset-0 bg-brand-950/60 backdrop-blur-sm z-40"
          aria-label="Cerrar menú"
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 h-screen w-64 bg-white border-r border-slate-200 flex flex-col transition-transform shadow-sm ${
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-brand-950 text-gold-500 flex items-center justify-center shadow-sm">
              <GraduationCap size={23} />
            </div>

            <div>
              <h1 className="text-sm font-extrabold text-brand-950 leading-tight">
                Augusto B. Leguía
              </h1>

              <p className="text-xs text-slate-500">
                Sistema Académico
              </p>
            </div>
          </div>
        </div>

        <div className="px-4 py-4">
          <div className="relative overflow-hidden flex items-center gap-3 bg-brand-950 rounded-2xl p-3 text-white shadow-soft">
            <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full bg-gold-500/20 blur-2xl" />

            <div className="relative w-10 h-10 rounded-full bg-gold-500 text-brand-950 flex items-center justify-center font-extrabold">
              {user?.nombres?.charAt(0) || 'U'}
            </div>

            <div className="relative min-w-0">
              <p className="text-sm font-extrabold truncate">
                {user?.nombres || 'Usuario'} {user?.apellidos || ''}
              </p>

              <p className="text-xs text-blue-100 truncate">
                {user?.rol || 'Rol'}
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {items.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-extrabold transition ${
                    isActive
                      ? 'bg-brand-900 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-brand-50 hover:text-brand-950'
                  }`
                }
              >
                <Icon size={18} />
                <span className="truncate">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200">
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-extrabold text-slate-600 hover:text-danger hover:bg-red-50 w-full transition"
          >
            <LogOut size={18} />
            Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;