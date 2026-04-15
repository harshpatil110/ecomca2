import { Link, useLocation } from 'react-router-dom';

export default function MainLayout({ children }) {
  const { pathname } = useLocation();

  const navLinks = [
    { label: 'Portfolio', to: '/' },
    { label: 'Neighborhoods', to: '/explore' },
    { label: 'Journal', to: '/journal' },
    { label: 'Saved', to: '/saved' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Top App Bar ── */}
      <header className="bg-[#fbf9f4] border-b border-stone-200/30 sticky top-0 z-50">
        <div className="flex justify-between items-center w-full px-8 py-6 max-w-screen-2xl mx-auto">
          <Link to="/" className="text-lg font-black tracking-tighter text-stone-900 uppercase" style={{ fontFamily: 'Inter, sans-serif' }}>
            LUMINA REALTY
          </Link>

          <nav className="hidden md:flex items-center gap-10" style={{ fontFamily: 'Inter, sans-serif' }}>
            {navLinks.map(({ label, to }) => {
              const active = pathname === to;
              return (
                <Link
                  key={label}
                  to={to}
                  className={`text-[10px] font-bold uppercase tracking-widest transition-colors duration-300 pb-1 ${
                    active
                      ? 'text-stone-900 border-b-2 border-stone-900'
                      : 'text-stone-500 hover:text-stone-900'
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-6">
            <button className="material-symbols-outlined text-stone-900">search</button>
            <Link
              to="/auth"
              className="px-6 py-2 bg-[#625d5b] text-[#fef6f2] text-xs uppercase tracking-widest font-bold rounded-sm hover:opacity-90 transition-opacity"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              Inquire
            </Link>
          </div>
        </div>
      </header>

      {/* ── Page Content ── */}
      <main className="flex-1">{children}</main>

      {/* ── Footer ── */}
      <footer className="bg-[#fbf9f4] border-t border-stone-200/40 py-16">
        <div className="flex flex-col md:flex-row justify-between items-center px-12 gap-8 max-w-screen-2xl mx-auto">
          <div className="text-md font-black tracking-tighter text-stone-400 uppercase" style={{ fontFamily: 'Inter, sans-serif' }}>
            LUMINA REALTY
          </div>
          <div className="flex flex-wrap gap-8 md:gap-12 text-sm italic text-stone-500" style={{ fontFamily: 'Newsreader, serif' }}>
            {[
              { label: 'Privacy', path: '/privacy' },
              { label: 'Terms', path: '/terms' },
              { label: 'Press', path: '/press' },
              { label: 'Contact', path: '/contact' },
            ].map((link) => (
              <Link key={link.label} to={link.path} className="hover:text-stone-900 transition-all">
                {link.label}
              </Link>
            ))}
          </div>
          <div className="text-xs italic text-stone-400 text-center md:text-right" style={{ fontFamily: 'Newsreader, serif' }}>
            © 2024 LUMINA REALTY. ALL RIGHTS RESERVED.
          </div>
        </div>
      </footer>

      {/* ── Bottom Nav (Mobile) ── */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full flex justify-around items-center pt-3 pb-6 px-6 bg-white/95 backdrop-blur-md border-t border-stone-200/50 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
        {[
          { icon: 'search', label: 'Explore', to: '/explore' },
          { icon: 'favorite', label: 'Saved', to: '/saved' },
          { icon: 'menu_book', label: 'Journal', to: '/journal' },
          { icon: 'person', label: 'Profile', to: '/auth' },
        ].map(({ icon, label, to }) => (
          <Link key={label} to={to} className="flex flex-col items-center justify-center text-stone-400 hover:text-stone-900 transition-colors">
            <span className="material-symbols-outlined">{icon}</span>
            <span className="text-[10px] uppercase tracking-widest font-bold mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
