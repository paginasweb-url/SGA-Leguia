import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import MobileNav from '../components/MobileNav';
import NotificationsDropdown from '../components/NotificationsDropdown';
import { Menu, GraduationCap, Search } from 'lucide-react';
import { getStoredUser } from '../utils/storage';

function DashboardLayout({ children }) {
  const user = getStoredUser();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-slate-900">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <header className="hidden lg:flex fixed top-0 left-64 right-0 h-16 bg-white/95 backdrop-blur-xl border-b border-slate-200 z-40 items-center justify-between px-6">
        <div className="relative w-full max-w-md">
        </div>

        <div className="flex items-center gap-4">
          <NotificationsDropdown />

          <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
            <div className="text-right">
              <p className="text-sm font-extrabold text-brand-950">
                {user?.nombres || 'Usuario'}
              </p>

              <p className="text-xs text-slate-500">
                {user?.rol}
              </p>
            </div>

            <div className="w-10 h-10 rounded-full bg-brand-900 text-white flex items-center justify-center text-sm font-extrabold shadow-sm ring-2 ring-gold-500/20">
              {user?.nombres?.charAt(0) || 'U'}
            </div>
          </div>
        </div>
      </header>

      <header className="lg:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-brand-950 text-gold-500 flex items-center justify-center shadow-sm">
            <GraduationCap size={21} />
          </div>

          <div>
            <h1 className="font-extrabold text-sm text-brand-950">
              Augusto B. Leguía
            </h1>

            <p className="text-[11px] text-slate-500">
              {user?.rol || 'Portal'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <NotificationsDropdown />

          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="p-2.5 rounded-2xl bg-brand-50 text-brand-950 border border-brand-100"
            aria-label="Abrir menú"
          >
            <Menu size={21} />
          </button>
        </div>
      </header>

      <main className="lg:ml-64 lg:pt-16 p-4 sm:p-6 pb-24">
        {children}
      </main>

      <MobileNav />
    </div>
  );
}

export default DashboardLayout;