import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';

import { clearSession, getRole } from '../utils/storage';
import { getMobileMenuByRole } from '../utils/navigation';

function MobileNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const role = getRole();

  const menuItems = getMobileMenuByRole(role);
  const visibleItems = menuItems.slice(0, 4);

  const handleLogout = () => {
    clearSession();

    window.dispatchEvent(new Event('sga-auth-changed'));

    navigate('/login', { replace: true });
  };

  if (!role) return null;

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-slate-200 shadow-[0_-10px_30px_rgba(15,23,42,0.08)]">
      <div className="grid grid-cols-5">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const active = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-extrabold transition ${
                active
                  ? 'text-white bg-brand-900'
                  : 'text-slate-500 hover:text-brand-950 hover:bg-brand-50'
              }`}
            >
              <Icon size={20} />
              <span className="truncate max-w-[68px]">
                {item.label}
              </span>
            </Link>
          );
        })}

        <button
          type="button"
          onClick={handleLogout}
          className="flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-extrabold text-danger hover:bg-red-50 transition"
        >
          <LogOut size={20} />
          <span>Salir</span>
        </button>
      </div>
    </nav>
  );
}

export default MobileNav;