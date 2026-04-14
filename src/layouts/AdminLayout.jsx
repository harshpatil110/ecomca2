import { Link, useLocation } from 'react-router-dom';

const adminNav = [
  { icon: 'dashboard', label: 'Overview', to: '/admin/overview' },
  { icon: 'payments', label: 'Revenue', to: '/admin/revenue' },
  { icon: 'campaign', label: 'Marketing', to: '/admin/marketing' },
  { icon: 'group', label: 'CRM', to: '/admin/crm' },
  { icon: 'apartment', label: 'Listings', to: '/admin/listings' },
  { icon: 'settings', label: 'Settings', to: '/admin/settings' },
];

export default function AdminLayout({ children }) {
  const { pathname } = useLocation();

  return (
    <div className="bg-[#fbf9f4] text-[#31332c] min-h-screen">
      {/* ── Side Nav ── */}
      <aside className="w-64 h-screen fixed left-0 top-0 flex flex-col py-8 px-6 z-50 bg-[#fbf9f4] border-r border-stone-200/30">
        <div className="mb-10">
          <h1 className="text-2xl font-black tracking-tighter text-stone-900" style={{ fontFamily: 'Inter, sans-serif' }}>
            ESTATE
          </h1>
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-500 mt-0.5" style={{ fontFamily: 'Inter, sans-serif' }}>
            Management Console
          </p>
        </div>

        <nav className="flex-1 space-y-1">
          {adminNav.map(({ icon, label, to }) => {
            const active = pathname === to;
            return (
              <Link
                key={label}
                to={to}
                className={`flex items-center gap-3 py-2.5 px-3 rounded-sm transition-colors duration-200 ${
                  active
                    ? 'text-stone-900 font-bold border-b-2 border-stone-800'
                    : 'text-stone-500 font-medium hover:text-stone-800'
                }`}
                style={{ fontFamily: 'Newsreader, serif' }}
              >
                <span className="material-symbols-outlined text-[20px]">{icon}</span>
                <span className="italic text-lg">{label}</span>
              </Link>
            );
          })}
        </nav>

        <Link to="/admin/listings/new" className="mt-auto bg-[#625d5b] text-[#fef6f2] py-3 px-4 rounded-sm font-bold tracking-tight flex items-center justify-center gap-2 hover:opacity-90 transition-opacity" style={{ fontFamily: 'Inter, sans-serif' }}>
          <span className="material-symbols-outlined text-sm">add</span>
          New Property
        </Link>
      </aside>

      {/* ── Top Bar ── */}
      <header className="fixed top-0 right-0 w-[calc(100%-16rem)] h-16 flex justify-between items-center px-12 z-40 bg-[#fbf9f4]/80 backdrop-blur-sm shadow-sm">
        <div className="relative w-full max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">search</span>
          <input
            className="w-full bg-[#f5f4ed] border-none focus:ring-0 text-sm py-2 pl-10 rounded-sm"
            placeholder="Search Console..."
            type="text"
            style={{ fontFamily: 'Newsreader, serif', fontStyle: 'italic' }}
          />
        </div>

        <div className="flex items-center gap-6">
          <span className="text-stone-800 font-black tracking-tighter text-xl" style={{ fontFamily: 'Inter, sans-serif' }}>
            Admin Console
          </span>
          <Link to="/admin/notifications" className="material-symbols-outlined text-stone-500 hover:text-stone-900 transition-colors">notifications</Link>
          <Link to="/admin/help" className="material-symbols-outlined text-stone-500 hover:text-stone-900 transition-colors">help</Link>
          <Link to="/admin/profile" className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center overflow-hidden hover:bg-stone-300 transition-colors">
            <span className="material-symbols-outlined text-stone-500 text-sm">person</span>
          </Link>
        </div>
      </header>

      {/* ── Page Content ── */}
      <main className="ml-64 pt-16 min-h-screen">
        {children}
      </main>
    </div>
  );
}
