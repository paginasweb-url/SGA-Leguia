import Sidebar from '../components/Sidebar';
import MobileNav from '../components/MobileNav';
import { Menu, GraduationCap, Search, Bell, Settings } from 'lucide-react';

function DashboardLayout({ children }) {
  const user = JSON.parse(localStorage.getItem('user'));

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-slate-900">
      <Sidebar />

      <header className="hidden lg:flex fixed top-0 left-64 right-0 h-14 bg-white/90 backdrop-blur border-b border-slate-200 z-40 items-center justify-between px-6">
        <div className="relative w-full max-w-md">
          <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar estudiante, curso o docente..."
            className="w-full bg-slate-100 border border-transparent rounded-full pl-9 pr-4 py-2 text-sm outline-none focus:bg-white focus:border-blue-200"
          />
        </div>

        <div className="flex items-center gap-4 text-slate-600">
          <Bell size={18} />
          <Settings size={18} />

          <div className="w-9 h-9 rounded-full bg-blue-900 text-white flex items-center justify-center text-sm font-bold">
            {user?.nombres?.charAt(0) || 'U'}
          </div>
        </div>
      </header>

      <header className="lg:hidden sticky top-0 z-40 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-800 text-white flex items-center justify-center">
            <GraduationCap size={20} />
          </div>

          <div>
            <h1 className="font-bold text-sm text-slate-900">
              Augusto B. Leguía
            </h1>
            <p className="text-[11px] text-slate-500">
              {user?.rol || 'Portal'}
            </p>
          </div>
        </div>

        <button className="p-2 rounded-lg bg-slate-100">
          <Menu size={21} />
        </button>
      </header>

      <main className="lg:ml-64 lg:pt-14 p-4 sm:p-6 pb-24">
        {children}
      </main>

      <MobileNav />
    </div>
  );
}

export default DashboardLayout;